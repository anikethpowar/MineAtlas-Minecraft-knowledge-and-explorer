import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Header from './components/layout/Header';
import MobileNavigation from './components/layout/MobileNavigation';
import PageContainer from './components/layout/PageContainer';
import AboutDataPage from './pages/AboutDataPage';
import BiomeDetailPage from './pages/BiomeDetailPage';
import BiomesPage from './pages/BiomesPage';
import HomePage from './pages/HomePage';
import GraphPage from './pages/GraphPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ItemsPage from './pages/ItemsPage';
import MobDetailPage from './pages/MobDetailPage';
import MobsPage from './pages/MobsPage';
import SearchPage from './pages/SearchPage';
import StructureDetailPage from './pages/StructureDetailPage';
import StructuresPage from './pages/StructuresPage';

/**
 * App Component
 *
 * Configures the React Router navigation tree and master layout for MineAtlas.
 * Includes top navigation header, centered page container, mobile bottom navigation,
 * and routes for all core Minecraft Java Edition explorers.
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#0c0f10] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
        <Header />
        <PageContainer>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/graph" element={<GraphPage />} />
            <Route path="/search" element={<SearchPage />} />

            {/* Mobs Explorer */}
            <Route path="/mobs" element={<MobsPage />} />
            <Route path="/mobs/:mobId" element={<MobDetailPage />} />

            {/* Biomes Explorer */}
            <Route path="/biomes" element={<BiomesPage />} />
            <Route path="/biomes/:biomeId" element={<BiomeDetailPage />} />

            {/* Items & Key Blocks Explorer */}
            <Route path="/items" element={<ItemsPage />} />
            <Route path="/items/:itemId" element={<ItemDetailPage />} />

            {/* Structures Explorer */}
            <Route path="/structures" element={<StructuresPage />} />
            <Route path="/structures/:structureId" element={<StructureDetailPage />} />

            {/* About Data & Transparency */}
            <Route path="/about-data" element={<AboutDataPage />} />

            {/* Fallback wildcard to Home */}
            <Route path="*" element={<HomePage />} />
          </Routes>
        </PageContainer>
        <MobileNavigation />
      </div>
    </BrowserRouter>
  );
};

export default App;
