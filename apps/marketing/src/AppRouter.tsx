import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import HomePage from './pages/HomePage';
import Success from './pages/Success';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import OrganizationPricingPage from './pages/OrganizationPricingPage';
import CreateOrganizationPage from './pages/CreateOrganizationPage';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pricing" element={<HomePage scrollTo="pricing" />} />
        <Route path="/organization-pricing" element={<OrganizationPricingPage />} />
        <Route path="/create-organization" element={<CreateOrganizationPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route
          path="/success"
          element={
            <>
              <SignedIn>
                <Success />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;