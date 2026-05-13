import { create } from 'zustand';
import axios from 'axios';

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  category: 'naming' | 'layout' | 'styles' | 'accessibility';
  nodes: string[];
  fix: string;
}

interface ScanResult {
  fileName: string;
  healthScore: number;
  totalIssues: number;
  issues: Issue[];
}

interface ScannerState {
  currentScan: ScanResult | null;
  lastUrl: string | null;
  userToken: string;
  rememberToken: boolean;
  isDemoMode: boolean;
  isScanning: boolean;
  error: string | null;
  scanFile: (url: string) => Promise<void>;
  toggleDemoMode: () => void;
  setUserToken: (token: string, remember?: boolean) => void;
  clearUserToken: () => void;
  clearError: () => void;
}

export const useScannerStore = create<ScannerState>((set) => ({
  currentScan: null,
  lastUrl: null,
  userToken: localStorage.getItem('figma_token') || '',
  rememberToken: !!localStorage.getItem('figma_token'),
  isDemoMode: false,
  isScanning: false,
  error: null,
  scanFile: async (url: string) => {
    const { userToken, isDemoMode } = useScannerStore.getState();
    set({ isScanning: true, error: null, lastUrl: url });

    if (isDemoMode) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      set({ 
        currentScan: {
          fileName: "Sample Design System.fig",
          healthScore: 78,
          totalIssues: 12,
          issues: [
            {
              id: "1",
              title: "Inconsistent Grid Usage",
              description: "Layer 'Card Container' is placed at 15px, which doesn't align with your 8px grid system.",
              severity: "high",
              category: "layout",
              nodes: ["Card Container", "Button Primary"],
              fix: "Adjust X/Y coordinates to multiples of 8 (e.g., 16px)."
            }
          ]
        },
        isScanning: false 
      });
      return;
    }

    try {
      const response = await axios.post('/api/figma/scan', { 
        fileUrl: url,
        userToken: userToken 
      });
      set({ currentScan: response.data, isScanning: false });
    } catch (err: any) {
      set({ 
        error: err.response?.data?.error || 'Failed to analyze file. Please check the URL and your Figma token.', 
        isScanning: false 
      });
    }
  },
  toggleDemoMode: () => set((state) => ({ isDemoMode: !state.isDemoMode })),
  setUserToken: (token: string, remember: boolean = false) => {
    if (remember) {
      localStorage.setItem('figma_token', token);
    } else {
      localStorage.removeItem('figma_token');
    }
    // Note: We don't use sessionStorage anymore for maximum "Clear on Refresh" security
    set({ userToken: token, rememberToken: remember });
  },
  clearUserToken: () => {
    localStorage.removeItem('figma_token');
    set({ userToken: '', rememberToken: false });
  },
  clearError: () => set({ error: null })
}));
