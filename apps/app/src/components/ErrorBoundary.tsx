import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  context?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { context = 'ErrorBoundary', onError } = this.props;
    
    // Log the error
    logger.error('Error boundary caught error', context, {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
      errorInfo: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({ error, errorInfo });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      const { fallback, context = 'ErrorBoundary' } = this.props;
      
      if (fallback) {
        return fallback;
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">
              Something went wrong
            </div>
            <div className="text-red-500 text-sm mb-4">
              {context}: {this.state.error?.message || 'Unknown error'}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  logger.info('User clicked retry button', context);
                  this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => {
                  logger.info('User clicked report button', context);
                  this.reportError();
                }}
                className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                Report Issue
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-600">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  private reportError() {
    const { error, errorInfo } = this.state;
    if (!error) return;

    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard. Please share this with support.');
      })
      .catch(() => {
        // Fallback: show in alert
        alert(`Error details:\n\n${error.message}\n\nPlease share this with support.`);
      });

    logger.info('User reported error', 'ErrorBoundary', errorReport);
  }
}

// Specialized error boundary for billing components
export const BillingErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary
      context="BillingErrorBoundary"
      fallback={
        <div className="min-h-[300px] flex items-center justify-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-center max-w-md">
            <div className="text-yellow-800 text-lg font-semibold mb-2">
              Billing Temporarily Unavailable
            </div>
            <div className="text-yellow-700 text-sm mb-4">
              We're experiencing issues with our billing system. Please try again in a few minutes or contact support.
            </div>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Refresh Page
              </button>
              <a
                href="mailto:info@carrierllm.com?subject=Billing Issue"
                className="ml-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors inline-block"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};