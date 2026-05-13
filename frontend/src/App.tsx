import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react"
import { Dashboard } from './pages/Dashboard';
import { Analysis } from './pages/Analysis';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Analytics />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analysis/:fileId" element={<Analysis />} />
          {/* Redirect old /dashboard or non-existent routes to / */}
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
