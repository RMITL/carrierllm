/**
 * Billing debugging utilities for monitoring Clerk billing issues
 */

import { logger } from './logger';

export interface BillingDebugInfo {
  clerkVersion: string;
  billingApiAvailable: boolean;
  userContext: any;
  environment: string;
  timestamp: string;
  errors: string[];
  warnings: string[];
}

class BillingDebugger {
  private errors: string[] = [];
  private warnings: string[] = [];

  constructor() {
    this.setupGlobalErrorHandling();
  }

  private setupGlobalErrorHandling() {
    if (typeof window === 'undefined') return;

    // Monitor for billing-related errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (message.includes('billing') || message.includes('subscription') || message.includes('stripe')) {
        this.errors.push(message);
        logger.billingError('Console error detected', { message, args });
      }
      originalConsoleError.apply(console, args);
    };

    // Monitor for billing-related warnings
    const originalConsoleWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      if (message.includes('billing') || message.includes('subscription') || message.includes('stripe')) {
        this.warnings.push(message);
        logger.billingWarn('Console warning detected', { message, args });
      }
      originalConsoleWarn.apply(console, args);
    };
  }

  getDebugInfo(): BillingDebugInfo {
    const clerkVersion = this.getClerkVersion();
    const billingApiAvailable = this.checkBillingApiAvailability();
    const userContext = this.getUserContext();
    const environment = this.getEnvironment();

    return {
      clerkVersion,
      billingApiAvailable,
      userContext,
      environment,
      timestamp: new Date().toISOString(),
      errors: [...this.errors],
      warnings: [...this.warnings],
    };
  }

  private getClerkVersion(): string {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk) {
        return (window as any).Clerk.version || 'unknown';
      }
    } catch (error) {
      logger.billingError('Error getting Clerk version', { error });
    }
    return 'not available';
  }

  private checkBillingApiAvailability(): boolean {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk?.billing) {
        return true;
      }
    } catch (error) {
      logger.billingError('Error checking billing API availability', { error });
    }
    return false;
  }

  private getUserContext(): any {
    try {
      if (typeof window !== 'undefined' && (window as any).Clerk?.user) {
        const user = (window as any).Clerk.user;
        return {
          id: user.id,
          email: user.emailAddresses?.[0]?.emailAddress,
          hasSubscription: !!user.publicMetadata?.subscription,
          plan: user.publicMetadata?.plan,
        };
      }
    } catch (error) {
      logger.billingError('Error getting user context', { error });
    }
    return null;
  }

  private getEnvironment(): string {
    try {
      if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.includes('localhost')) return 'development';
        if (hostname.includes('staging')) return 'staging';
        return 'production';
      }
    } catch (error) {
      logger.billingError('Error determining environment', { error });
    }
    return 'unknown';
  }

  // Test billing functionality
  async testBillingFunctionality(): Promise<{ success: boolean; error?: string }> {
    try {
      logger.billingInfo('Testing billing functionality');
      
      // Check if Clerk is available
      if (typeof window === 'undefined' || !(window as any).Clerk) {
        return { success: false, error: 'Clerk not available' };
      }

      // Check if billing API is available
      if (!(window as any).Clerk.billing) {
        return { success: false, error: 'Billing API not available' };
      }

      // Try to access billing methods
      const billing = (window as any).Clerk.billing;
      if (typeof billing.getPlans === 'function') {
        logger.billingDebug('Billing API methods available');
        return { success: true };
      }

      return { success: false, error: 'Billing methods not available' };
    } catch (error) {
      logger.billingError('Error testing billing functionality', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Clear error and warning logs
  clearLogs(): void {
    this.errors = [];
    this.warnings = [];
    logger.billingInfo('Billing debug logs cleared');
  }

  // Export debug information
  exportDebugInfo(): string {
    const debugInfo = this.getDebugInfo();
    return JSON.stringify(debugInfo, null, 2);
  }

  // Copy debug info to clipboard
  async copyDebugInfo(): Promise<boolean> {
    try {
      const debugInfo = this.exportDebugInfo();
      await navigator.clipboard.writeText(debugInfo);
      logger.billingInfo('Debug info copied to clipboard');
      return true;
    } catch (error) {
      logger.billingError('Error copying debug info to clipboard', { error });
      return false;
    }
  }
}

// Create singleton instance
export const billingDebugger = new BillingDebugger();

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).billingDebugger = billingDebugger;
}

// Auto-run billing test on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      billingDebugger.testBillingFunctionality().then(result => {
        if (!result.success) {
          logger.billingWarn('Billing functionality test failed', { error: result.error });
        } else {
          logger.billingInfo('Billing functionality test passed');
        }
      });
    }, 2000); // Wait 2 seconds for Clerk to initialize
  });
}
