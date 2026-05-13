import { 
  Plus, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { useState } from 'react';
import { useScannerStore } from '../store/scannerStore';

export const Dashboard = () => {
  const [url, setUrl] = useState('');
  const { 
    scanFile, 
    isScanning, 
    error, 
    userToken, 
    setUserToken, 
    rememberToken,
    clearUserToken,
    isDemoMode, 
    toggleDemoMode 
  } = useScannerStore();
  const navigate = useNavigate();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url && !isDemoMode) return;
    await scanFile(url);
    if (!useScannerStore.getState().error) {
      navigate('/analysis/latest');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto p-8 py-32">
        <header className="flex flex-col items-center text-center mb-16">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
            <Plus className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">Design Handoff Cleaner</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            The ultimate validator for Figma files. Detect inconsistencies, improve design system usage, and reduce developer confusion.
          </p>
        </header>

        {/* Configuration Bar */}
        <div className="max-w-2xl mx-auto mb-8 p-6 bg-card border border-border rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Figma Access Token</label>
              <div className="flex gap-4">
                <a 
                  href="https://www.figma.com/settings" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-[10px] text-primary font-bold hover:underline"
                >
                  Get Token →
                </a>
                {userToken && (
                  <button 
                    onClick={clearUserToken}
                    className="text-[10px] text-destructive font-bold flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>
            <input 
              type="password" 
              placeholder="figd_..." 
              className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
              value={userToken}
              onChange={(e) => setUserToken(e.target.value, rememberToken)}
              disabled={isDemoMode}
            />
            <div className="mt-3 flex items-center gap-2">
              <input 
                type="checkbox"
                id="remember"
                checked={rememberToken}
                onChange={(e) => setUserToken(userToken, e.target.checked)}
                className="rounded border-border bg-secondary/30 text-primary focus:ring-primary/30"
              />
              <label htmlFor="remember" className="text-[10px] text-muted-foreground font-medium cursor-pointer">
                Remember on this device (Not recommended for public computers)
              </label>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demo Mode</span>
            <button 
              onClick={toggleDemoMode}
              className={cn(
                "w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out",
                isDemoMode ? "bg-primary" : "bg-muted"
              )}
            >
              <div className={cn(
                "w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ease-in-out",
                isDemoMode ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-card border border-border rounded-[2.5rem] p-10 shadow-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-[2.5rem] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
          <div className="relative">
            <form onSubmit={handleScan} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="px-3 py-1 bg-secondary rounded-full text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Step 1: Paste Figma URL
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder={isDemoMode ? "https://figma.com/file/demo-file" : "https://www.figma.com/design/..."}
                  className="w-full bg-secondary/50 border border-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-center"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScanning || isDemoMode}
                />
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-xs text-destructive font-medium">{error}</p>
                </div>
              )}

              <button 
                type="submit"
                disabled={isScanning || (!url && !isDemoMode)}
                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:shadow-none"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Analyzing Design...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-6 h-6" />
                    {isDemoMode ? 'Start Demo Analysis' : 'Start Deep Scan'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
