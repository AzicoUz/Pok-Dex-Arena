import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoadingScreen from './components/LoadingScreen';
import Footer from './components/Footer';
import { AppProvider } from './context/AppContext';
import { usePokemon } from './hooks/usePokemon';
import Dashboard from './pages/Dashboard';
import Pokedex from './pages/Pokedex';
import Team from './pages/Team';
import Battle from './pages/Battle';
import Catch from './pages/Catch';
import Inventory from './pages/Inventory';
import Evolution from './pages/Evolution';
import Regions from './pages/Regions';
import MiniGames from './pages/MiniGames';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import BackgroundMusic from './components/BackgroundMusic';
import ErrorBoundary from './components/ErrorBoundary';

function AppContent() {
  const data = usePokemon();
  if (data.loading) return <LoadingScreen progress={data.progress} status={data.status} error={data.error} onRetry={data.reload} />;
  if (data.error) return <LoadingScreen progress={100} status="" error={data.error} onRetry={data.reload} />;

  return <>
    <Navbar />
    <BackgroundMusic />
    <main>
      <Routes>
        <Route path="/" element={<Dashboard pokemon={data.pokemon} />} />
        <Route path="/pokedex" element={<Pokedex pokemon={data.pokemon} types={data.types} />} />
        <Route path="/team" element={<Team />} />
        <Route path="/battle" element={<Battle pokemon={data.pokemon} />} />
        <Route path="/catch" element={<Catch pokemon={data.pokemon} />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/evolution" element={<Evolution pokemon={data.pokemon} />} />
        <Route path="/regions" element={<Regions />} />
        <Route path="/games" element={<MiniGames pokemon={data.pokemon} />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
    <Footer />
  </>;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
