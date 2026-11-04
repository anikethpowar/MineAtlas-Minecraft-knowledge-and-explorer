import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import PageContainer from './components/layout/PageContainer';
import HomePage from './pages/HomePage';

/**
 * App Component
 *
 * Configures the React Router navigation tree and master layout.
 * In Phase 1, only the HomePage route ("/") is defined.
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0c0f10] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <Header />
        <PageContainer>
          <Routes>
            {/* Phase 1 defines only the Home route */}
            <Route path="/" element={<HomePage />} />
          </Routes>
        </PageContainer>
      </div>
    </BrowserRouter>
  );
};

export default App;

