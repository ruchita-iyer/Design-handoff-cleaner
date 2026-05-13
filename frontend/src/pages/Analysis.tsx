import { useParams, Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldQuestion, 
  Layers, 
  Type, 
  Palette, 
  Box,
  ChevronRight,
  ExternalLink,
  Search,
  Loader2,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useScannerStore } from '../store/scannerStore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const CATEGORY_ICONS = {
  naming: Layers,
  layout: Box,
  styles: Palette,
  accessibility: ShieldAlert
};

export const Analysis = () => {
  const { fileId } = useParams();
  const { currentScan, lastUrl, scanFile, isScanning } = useScannerStore();
  
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  if (!currentScan && fileId === 'latest') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
        <h2 className="text-xl font-bold">No Analysis Data</h2>
        <p className="text-muted-foreground mb-6">Please run a new scan from the dashboard.</p>
        <Link to="/dashboard" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium">Go to Dashboard</Link>
      </div>
    );
  }

  const data = currentScan || {
    fileName: 'Sample File',
    healthScore: 84,
    totalIssues: 4,
    issues: []
  };

  const issues = currentScan ? currentScan.issues : [];

  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchCategory = filterCategory === 'all' || issue.category === filterCategory;
      const matchSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
      return matchCategory && matchSeverity;
    });
  }, [issues, filterCategory, filterSeverity]);

  const handleExportCSV = () => {
    if (!issues.length) return;
    
    const headers = ['Title', 'Severity', 'Category', 'Description', 'Fix', 'Nodes'];
    const rows = issues.map(issue => [
      `"${issue.title}"`,
      `"${issue.severity}"`,
      `"${issue.category}"`,
      `"${issue.description.replace(/"/g, '""')}"`,
      `"${issue.fix.replace(/"/g, '""')}"`,
      `"${issue.nodes.join(', ')}"`
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `audit-report-${data.fileName.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text('Design Handoff Audit Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`File: ${data.fileName}`, 14, 32);
    doc.text(`Health Score: ${data.healthScore}%`, 14, 38);
    doc.text(`Total Issues: ${data.totalIssues}`, 14, 44);
    
    const tableColumn = ["Issue", "Severity", "Category", "Suggestion"];
    const tableRows = issues.map(issue => [
      issue.title,
      issue.severity.toUpperCase(),
      issue.category.toUpperCase(),
      issue.fix
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 55,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    doc.save(`audit-report-${data.fileName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const handleRescan = async () => {
    if (lastUrl) {
      await scanFile(lastUrl);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-5xl mx-auto p-8 py-16">
        <header className="mb-12">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">{data.fileName}</h1>
              <p className="text-muted-foreground text-lg mt-2">
                Audit Results • <span className="font-semibold text-foreground">{filteredIssues.length}</span> issues filtered
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handleExportCSV}
                className="px-5 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-secondary/50 transition-colors"
              >
                CSV
              </button>
              <button 
                onClick={handleExportPDF}
                className="px-5 py-2.5 border border-border rounded-xl text-sm font-bold hover:bg-secondary/50 transition-colors"
              >
                PDF
              </button>
              <button 
                onClick={handleRescan}
                disabled={isScanning}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" /> Scanning...</> : 'Re-scan'}
              </button>
            </div>
          </div>
        </header>

        {/* Health Score Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-16">
          <div className="lg:col-span-1 p-8 rounded-3xl border border-border bg-card flex flex-col items-center justify-center text-center shadow-sm">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-full h-full -rotate-90">
                <circle cx="64" cy="64" r="60" className="stroke-muted fill-none" strokeWidth="8" />
                <circle cx="64" cy="64" r="60" className={cn("fill-none", data.healthScore > 80 ? "stroke-green-500" : "stroke-amber-500")} strokeWidth="8" strokeDasharray="377" strokeDashoffset={377 * (1 - data.healthScore/100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold">{data.healthScore}</span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Health Score</span>
              </div>
            </div>
            <p className={cn("text-sm font-medium", data.healthScore > 80 ? "text-green-500" : "text-amber-500")}>
              {data.healthScore > 80 ? 'Good Quality' : 'Needs Attention'}
            </p>
          </div>

          <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
              <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">Naming</p>
              <h4 className="text-2xl font-bold">72%</h4>
              <div className="w-full h-1.5 bg-muted rounded-full mt-3">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
              <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">Layout</p>
              <h4 className="text-2xl font-bold">94%</h4>
              <div className="w-full h-1.5 bg-muted rounded-full mt-3">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '94%' }} />
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
              <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">Styles</p>
              <h4 className="text-2xl font-bold">88%</h4>
              <div className="w-full h-1.5 bg-muted rounded-full mt-3">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '88%' }} />
              </div>
            </div>
            <div className="p-5 rounded-2xl border border-border bg-card shadow-sm">
              <p className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider">A11y</p>
              <h4 className="text-2xl font-bold">64%</h4>
              <div className="w-full h-1.5 bg-muted rounded-full mt-3">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '64%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 p-6 bg-muted/20 border border-border rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground uppercase tracking-wider mr-4">
              <Filter className="w-4 h-4" /> Filter
            </div>
            <div className="flex flex-wrap gap-2">
              {['all', 'naming', 'layout', 'styles', 'accessibility'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all",
                    filterCategory === cat 
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                      : "bg-background border border-border text-muted-foreground hover:border-primary/50"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">Importance:</span>
            <div className="flex gap-2">
              {['all', 'high', 'medium', 'low'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all",
                    filterSeverity === sev 
                      ? "bg-foreground text-background" 
                      : "bg-background border border-border text-muted-foreground hover:border-foreground"
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Issue List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" /> Detected Issues
          </h2>
          
          <div className="grid gap-4">
            {filteredIssues.length === 0 ? (
              <div className="p-16 rounded-3xl border border-dashed border-border flex flex-col items-center justify-center text-center bg-card/50">
                <ShieldCheck className="w-16 h-16 text-green-500 mb-4 opacity-40" />
                <h3 className="font-bold text-xl">No Matching Issues</h3>
                <p className="text-muted-foreground">Adjust your filters to see more results.</p>
              </div>
            ) : (
              filteredIssues.map((issue) => {
                const Icon = CATEGORY_ICONS[issue.category as keyof typeof CATEGORY_ICONS] || Layers;
                return (
                  <div key={issue.id} className="p-6 rounded-2xl border border-border bg-card hover:border-primary/20 transition-all group">
                    <div className="flex gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                        issue.severity === 'high' ? "bg-red-500/10 text-red-500" : 
                        issue.severity === 'medium' ? "bg-amber-500/10 text-amber-500" : 
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-bold text-lg">{issue.title}</h3>
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border",
                              issue.severity === 'high' ? "text-red-500 border-red-500/20 bg-red-500/5" : 
                              issue.severity === 'medium' ? "text-amber-500 border-amber-500/20 bg-amber-500/5" : 
                              "text-blue-500 border-blue-500/20 bg-blue-500/5"
                            )}>
                              {issue.severity} priority
                            </span>
                          </div>
                          <button className="text-xs text-primary font-bold hover:underline flex items-center gap-1">
                            View in Figma <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">{issue.description}</p>
                        
                        <div className="bg-secondary/50 rounded-xl p-4">
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Suggested Fix</p>
                          <p className="text-sm font-medium">{issue.fix}</p>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {issue.nodes.map((node) => (
                            <span key={node} className="text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground font-mono">
                              {node}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
