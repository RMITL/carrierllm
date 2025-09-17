import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App';
import './styles/tailwind.css';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error('Missing Clerk Publishable Key');
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ClerkProvider
      publishableKey={clerkPubKey}
      signInFallbackRedirectUrl="/pricing"
      signUpFallbackRedirectUrl="/success"
      afterSignUpUrl="/success"
      afterSignInUrl={import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com'}
    >
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
