import React from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { Card } from '@carrierllm/ui';
import { CarriersPanel } from '../components/CarriersPanel';

export const CarriersPage = () => {
  const { user } = useUser();
  const { organization, membership } = useOrganization();

  // Check if user is admin in their organization
  const isAdmin = membership?.role === 'admin' || membership?.role === 'org:admin';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Carrier Management</h1>
        <p className="text-gray-600">
          Select which carriers you want to include in your recommendations and upload underwriting documents.
        </p>
      </div>

      {/* User Info Card */}
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-semibold text-blue-600">
              {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-gray-600">{user?.emailAddresses?.[0]?.emailAddress}</p>
            {organization && (
              <div className="mt-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {organization.name}
                </span>
                {isAdmin && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Admin
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Carriers Panel */}
      <CarriersPanel />

      {/* Organization Admin Section */}
      {isAdmin && organization && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organization Settings</h2>
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-md font-medium text-gray-900">Carrier Management</h3>
              <p className="text-sm text-gray-600 mt-1">
                As an organization admin, you can control which carriers are available to all users in {organization.name}.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">
                    Organization Carrier Control
                  </h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Organization-controlled carriers will appear in the carriers panel above with a "Org Controlled" badge. 
                      Individual users cannot disable these carriers, but they can still select from the available options.
                    </p>
                    <p className="mt-2">
                      <strong>Note:</strong> Organization carrier controls are managed through the carriers panel above. 
                      When you disable a carrier at the organization level, it will be marked as "Org Controlled" 
                      and users will not be able to enable it individually.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
