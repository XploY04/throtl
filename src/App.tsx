// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout'; // Import Layout
import LandingPage  from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import Contact from './pages/Contact';
import About from './pages/About';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />

      </Route>
    </Routes>
  );
}

export default App;