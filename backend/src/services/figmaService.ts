import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root .env file
const envPath = path.join(process.cwd(), '.env');
dotenv.config({ path: envPath, override: true });

const FIGMA_API_BASE = 'https://api.figma.com/v1';

/**
 * Fetches a Figma file or specific nodes from the Figma API.
 * Includes a retry mechanism for handling rate limits (429).
 */
export const getFigmaFile = async (fileKey: string, nodeId?: string, providedToken?: string) => {
  const ACCESS_TOKEN = providedToken?.trim() || process.env.FIGMA_ACCESS_TOKEN?.trim();
  
  if (!ACCESS_TOKEN) {
    console.error('[Scanner] Critical: FIGMA_ACCESS_TOKEN is missing (Check .env or user provided token)');
  }

  console.log(`[Scanner] Initializing scan for file: ${fileKey}${nodeId ? ` (Node: ${nodeId})` : ''}`);
  
  const endpoint = nodeId 
    ? `${FIGMA_API_BASE}/files/${fileKey}/nodes?ids=${nodeId}`
    : `${FIGMA_API_BASE}/files/${fileKey}`;

  let retries = 5;
  let delay = 2000;

  while (retries > 0) {
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'X-Figma-Token': ACCESS_TOKEN || '',
        },
      });
      
      if (nodeId) {
        const nodeData = response.data.nodes?.[nodeId];
        if (!nodeData) {
          throw new Error(`Node ${nodeId} not found in this file.`);
        }
        return {
          name: response.data.name,
          document: nodeData.document,
          lastModified: response.data.lastModified
        };
      }
      
      return response.data;
    } catch (error: any) {
      // Handle Rate Limiting with exponential backoff
      if (error.response?.status === 429 && retries > 1) {
        console.warn(`[Scanner] Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries--;
        delay *= 2;
        continue;
      }

      // Preserve the specific status code (e.g., 403, 404, 429) for the frontend
      const figmaError = new Error(error.response?.data?.message || 'Failed to fetch Figma file. Check your token and file key.') as any;
      figmaError.status = error.response?.status || 500;
      throw figmaError;
    }
  }
};

/**
 * Extracts the File Key and Node ID from a Figma URL.
 */
export const extractFileInfo = (url: string): { fileKey: string; nodeId: string | null } => {
  try {
    const fileKeyMatch = url.match(/(?:file|design|proto)\/([a-zA-Z0-9]+)/);
    const nodeIdMatch = url.match(/node-id=([a-zA-Z0-9-]+)/);
    
    if (!fileKeyMatch || !fileKeyMatch[1]) {
      throw new Error('Invalid Figma URL format');
    }
    
    return {
      fileKey: fileKeyMatch[1],
      nodeId: nodeIdMatch && nodeIdMatch[1] ? nodeIdMatch[1].replace('-', ':') : null
    };
  } catch (error: any) {
    throw new Error(`URL Parsing Error: ${error.message}`);
  }
};
