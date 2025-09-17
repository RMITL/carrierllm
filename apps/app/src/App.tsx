import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import { Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { DashboardPage } from './routes/DashboardPage';
import { IntakePage } from './routes/IntakePage';
import { ChatPage } from './routes/ChatPage';
import { ResultsPage } from './routes/ResultsPage';
import { ProfilePage } from './routes/ProfilePage';
import { BillingPage } from './routes/BillingPage';
import { AnalyticsPage } from './routes/AnalyticsPage';

const App = () => {
  return (
    <div className="min-h-screen bg-[color:var(--color-gray-50)]">
      <SignedOut>
        <AuthLayout />
      </SignedOut>

      <SignedIn>
        <DashboardLayout>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/intake" element={<IntakePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/results/:id" element={<ResultsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </Suspense>
        </DashboardLayout>
      </SignedIn>
    </div>
  );
};

export default App;
