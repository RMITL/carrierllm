import React, { useState, useEffect } from 'react';
import { billingDebugger } from '../lib/billing-debug';
import { logger } from '../lib/logger';

export const BillingDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const refreshDebugInfo = () => {
    const info = billingDebugger.getDebugInfo();
    setDebugInfo(info);
    logger.billingInfo('Debug info refreshed');
  };

  const runBillingTest = async () => {
    const result = await billingDebugger.testBillingFunctionality();
    setTestResult(result);
    logger.billingInfo('Billing test completed', { result });
  };

  const copyDebugInfo = async () => {
    const success = await billingDebugger.copyDebugInfo();
    if (success) {
      alert('Debug information copied to clipboard!');
    } else {
      alert('Failed to copy debug information. Check console for details.');
    }
  };

  const clearLogs = () => {
    billingDebugger.clearLogs();
    refreshDebugInfo();
    logger.billingInfo('Debug logs cleared');
  };

  useEffect(() => {
    if (isOpen) {
      refreshDebugInfo();
    }
  }, [isOpen]);

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV !== 'development' && !localStorage.getItem('enableBillingDebug')) {
    return null;
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
        title="Billing Debug Panel"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Billing Debug Panel</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={refreshDebugInfo}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Refresh
              </button>
              <button
                onClick={runBillingTest}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Test
              </button>
              <button
                onClick={copyDebugInfo}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
              >
                Copy
              </button>
              <button
                onClick={clearLogs}
                className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            {/* Test Result */}
            {testResult && (
              <div className={`p-2 rounded text-sm ${
                testResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <strong>Test Result:</strong> {testResult.success ? 'PASSED' : 'FAILED'}
                {testResult.error && <div>Error: {testResult.error}</div>}
              </div>
            )}

            {/* Debug Info */}
            {debugInfo && (
              <div className="space-y-2">
                <div className="text-sm">
                  <strong>Clerk Version:</strong> {debugInfo.clerkVersion}
                </div>
                <div className="text-sm">
                  <strong>Billing API:</strong> {debugInfo.billingApiAvailable ? '✅ Available' : '❌ Not Available'}
                </div>
                <div className="text-sm">
                  <strong>Environment:</strong> {debugInfo.environment}
                </div>
                <div className="text-sm">
                  <strong>User:</strong> {debugInfo.userContext ? `${debugInfo.userContext.email} (${debugInfo.userContext.id})` : 'Not signed in'}
                </div>
                
                {debugInfo.errors.length > 0 && (
                  <div className="text-sm">
                    <strong>Errors ({debugInfo.errors.length}):</strong>
                    <div className="bg-red-50 p-2 rounded text-xs max-h-20 overflow-auto">
                      {debugInfo.errors.map((error: string, index: number) => (
                        <div key={index} className="text-red-700">{error}</div>
                      ))}
                    </div>
                  </div>
                )}

                {debugInfo.warnings.length > 0 && (
                  <div className="text-sm">
                    <strong>Warnings ({debugInfo.warnings.length}):</strong>
                    <div className="bg-yellow-50 p-2 rounded text-xs max-h-20 overflow-auto">
                      {debugInfo.warnings.map((warning: string, index: number) => (
                        <div key={index} className="text-yellow-700">{warning}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-gray-500 border-t pt-2">
              <div>• Use this panel to debug billing issues</div>
              <div>• Click "Test" to check billing functionality</div>
              <div>• Click "Copy" to copy debug info for support</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
