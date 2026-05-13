import { Router } from 'express';
import { analyzeNodes } from '../services/ruleEngine.js';
import { getFigmaFile, extractFileInfo } from '../services/figmaService.js';

const router = Router();

// Real Scan Endpoint
router.post('/scan', async (req, f_res) => {
  const { fileUrl, userToken } = req.body;

  if (!fileUrl) {
    return f_res.status(400).json({ error: 'Figma File URL is required' });
  }

  try {
    const { fileKey, nodeId } = extractFileInfo(fileUrl);
    const fileData = await getFigmaFile(fileKey, nodeId || undefined, userToken);
    
    // Figma document structure starts at fileData.document
    // We traverse all children of the document (Pages) and their children
    const document = fileData.document;
    const issues = analyzeNodes([document]);

    // Simple Scoring: Start at 100, subtract points based on severity
    let score = 100;
    issues.forEach(issue => {
      if (issue.severity === 'high') score -= 5;
      if (issue.severity === 'medium') score -= 2;
      if (issue.severity === 'low') score -= 1;
    });

    f_res.json({
      fileName: fileData.name,
      lastModified: fileData.lastModified,
      healthScore: Math.max(0, score),
      totalIssues: issues.length,
      issues
    });
  } catch (error: any) {
    console.error('Full Scan Error:', error);
    const status = error.status || 500;
    const message = status === 429 
      ? 'Figma Rate Limit Exceeded. Please wait a few minutes or try a different token.' 
      : status === 403
      ? 'Invalid Figma Token. Please check your token and scopes.'
      : error.message;
      
    f_res.status(status).json({ 
      error: message,
      details: error.response?.data || 'No additional details'
    });
  }
});

export default router;
