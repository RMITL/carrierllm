import { NavLink, Route, Routes } from 'react-router-dom';
import { IntakePage } from './routes/IntakePage';
import { ResultsPage } from './routes/ResultsPage';
import { AnalyticsPage } from './routes/AnalyticsPage';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-base px-3 py-2 text-sm font-semibold ${
    isActive
      ? 'bg-[color:var(--color-primary)] text-white'
      : 'text-[color:var(--color-gray-500)] hover:text-[color:var(--color-gray-900)]'
  }`;

const App = () => {
  return (
    <div className="min-h-screen bg-[color:var(--color-gray-100)]">
      <header className="border-b border-[color:var(--color-gray-100)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <span className="text-lg font-semibold text-[color:var(--color-primary)]">CarrierLLM</span>
          <nav className="flex gap-2">
            <NavLink to="/" className={navLinkClass} end>
              Intake
            </NavLink>
            <NavLink to="/analytics" className={navLinkClass}>
              Analytics
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-5 py-8">
        <Routes>
          <Route path="/" element={<IntakePage />} />
          <Route path="/results/:id" element={<ResultsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
