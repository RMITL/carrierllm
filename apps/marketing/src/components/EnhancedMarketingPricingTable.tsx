import React, { useEffect, useState } from 'react';
import { PricingTable } from '@clerk/clerk-react';
import { logger } from '../lib/logger';

interface EnhancedMarketingPricingTableProps {
  forOrganizations?: boolean;
  onError?: (error: string) => void;
}

export const EnhancedMarketingPricingTable: React.FC<EnhancedMarketingPricingTableProps> = ({
  forOrganizations = false,
  onError,
}) => {
  const [isClerkReady, setIsClerkReady] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);

  useEffect(() => {
    logger.billingInfo('EnhancedMarketingPricingTable mounted', { forOrganizations });
    
    // Set up timeout to detect if Clerk billing is not responding
    const timeout = setTimeout(() => {
      if (!isClerkReady) {
        logger.billingWarn('Clerk billing timeout - switching to fallback mode', { forOrganizations });
        setFallbackMode(true);
        onError?.('Billing system is taking longer than expected to load. Please try again or contact support.');
      }
    }, 8000); // 8 second timeout for marketing site

    // Check if Clerk is available
    const checkClerkAvailability = () => {
      try {
        if (typeof window !== 'undefined' && (window as any).Clerk) {
          logger.billingDebug('Clerk instance found', { forOrganizations });
          setIsClerkReady(true);
          clearTimeout(timeout);
        } else {
          logger.billingWarn('Clerk instance not found', { forOrganizations });
        }
      } catch (error) {
        logger.billingError('Error checking Clerk availability', { error, forOrganizations });
      }
    };

    // Check immediately and then periodically
    checkClerkAvailability();
    const interval = setInterval(checkClerkAvailability, 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isClerkReady, forOrganizations, onError]);

  // Monitor for billing events
  useEffect(() => {
    const handleBillingEvent = (event: any) => {
      logger.billingInfo('Billing event detected', { event, forOrganizations });
    };

    const handleBillingError = (event: any) => {
      logger.billingError('Billing error event', { event, forOrganizations });
      onError?.(`Billing error: ${event.detail?.message || 'Unknown error'}`);
    };

    // Listen for custom billing events
    if (typeof window !== 'undefined') {
      window.addEventListener('clerk:billing:start', handleBillingEvent);
      window.addEventListener('clerk:billing:error', handleBillingError);
      window.addEventListener('clerk:billing:success', handleBillingEvent);

      return () => {
        window.removeEventListener('clerk:billing:start', handleBillingEvent);
        window.removeEventListener('clerk:billing:error', handleBillingError);
        window.removeEventListener('clerk:billing:success', handleBillingEvent);
      };
    }
  }, [onError, forOrganizations]);

  // Monitor PricingTable for errors
  const handlePricingTableError = (error: Error) => {
    logger.billingError('PricingTable error', { 
      error: error.message, 
      stack: error.stack, 
      forOrganizations 
    });
    onError?.(`Pricing table error: ${error.message}`);
    setFallbackMode(true);
  };

  // Fallback billing implementation
  const handleFallbackBilling = async (plan: string) => {
    logger.billingInfo('Using fallback billing flow', { plan, forOrganizations });

    try {
      // Redirect to Clerk's subscription checkout directly
      const checkoutUrl = `https://accounts.production.clerk.dev/subscription/checkout`;
      const params = new URLSearchParams({
        redirect_url: `${window.location.origin}/success`,
        plan: plan,
      });
      
      logger.billingInfo('Redirecting to Clerk checkout', { 
        checkoutUrl, 
        params: params.toString(), 
        forOrganizations 
      });
      window.location.href = `${checkoutUrl}?${params}`;
    } catch (error) {
      logger.billingError('Fallback billing failed', { error, forOrganizations });
      onError?.('Unable to process billing request. Please contact support.');
    }
  };

  if (fallbackMode) {
    return (
      <div className="space-y-4">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-800 font-medium mb-2">
            Alternative Billing Options
          </div>
          <div className="text-yellow-700 text-sm mb-4">
            The standard billing interface is temporarily unavailable. You can still subscribe using the options below.
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {forOrganizations ? (
            <>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Organization Plan</h3>
                <p className="text-gray-600 text-sm mb-3">$150/month - 5 team seats, unlimited recommendations</p>
                <button
                  onClick={() => handleFallbackBilling('organization')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Start Organization Plan
                </button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Enterprise Plan</h3>
                <p className="text-gray-600 text-sm mb-3">Custom pricing - Unlimited seats & features</p>
                <button
                  onClick={() => handleFallbackBilling('enterprise')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Contact Sales
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Individual Plan</h3>
                <p className="text-gray-600 text-sm mb-3">$50/month - 100 recommendations</p>
                <button
                  onClick={() => handleFallbackBilling('individual')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Start Individual Plan
                </button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Enterprise Plan</h3>
                <p className="text-gray-600 text-sm mb-3">$150/month - 500 recommendations</p>
                <button
                  onClick={() => handleFallbackBilling('enterprise')}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Start Enterprise Plan
                </button>
              </div>
            </>
          )}
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">Need help?</p>
          <a
            href="mailto:support@carrierllm.com?subject=Billing Issue"
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            Contact Support
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      {!isClerkReady && (
        <div className="text-center p-6">
          <div className="inline-flex items-center text-gray-600">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
            Loading billing options...
          </div>
        </div>
      )}
      
      <div style={{ display: isClerkReady ? 'block' : 'none' }}>
        <ErrorBoundaryPricingTable 
          forOrganizations={forOrganizations}
          onError={handlePricingTableError} 
        />
      </div>
    </div>
  );
};

// Wrapper component with error boundary for PricingTable
const ErrorBoundaryPricingTable: React.FC<{ 
  forOrganizations: boolean;
  onError: (error: Error) => void;
}> = ({ forOrganizations, onError }) => {
  useEffect(() => {
    // Set up error monitoring for the PricingTable
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('billing') || event.message.includes('subscription')) {
        onError(new Error(event.message));
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [onError]);

  try {
    return <PricingTable forOrganizations={forOrganizations} />;
  } catch (error) {
    onError(error as Error);
    return null;
  }
};
