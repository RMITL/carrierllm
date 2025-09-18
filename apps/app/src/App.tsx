import { SignedIn, SignedOut, useUser, useAuth } from '@clerk/clerk-react';
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
// import { AnalyticsPageSimple as AnalyticsPage } from './routes/AnalyticsPageSimple';
import { HistoryPage } from './routes/HistoryPage';
import { PricingPage } from './routes/PricingPage';
import { TermsPage } from './routes/TermsPage';
import { PrivacyPage } from './routes/PrivacyPage';

const App = () => {
  const { isLoaded } = useAuth();

  // Add debugging
  console.log('App render:', { isLoaded });

  // Show loading spinner while Clerk is initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-[color:var(--color-gray-50)] flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading CarrierLLM...</p>
        </div>
      </div>
    );
  }

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
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
            </Routes>
          </Suspense>
        </DashboardLayout>
      </SignedIn>
    </div>
  );
};

export default App;
