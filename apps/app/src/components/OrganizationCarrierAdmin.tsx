import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge } from '@carrierllm/ui';
import type { 
  CarrierWithPreferences, 
  OrganizationCarrierSetting
} from '../types';

interface OrganizationCarrierAdminProps {
  className?: string;
}

export const OrganizationCarrierAdmin: React.FC<OrganizationCarrierAdminProps> = ({ className = '' }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const queryClient = useQueryClient();
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set());

  // Check if user is an admin (you'd implement this based on your role system)
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'manager';

  // Fetch carriers with organization settings
  const { data: carriers, isLoading: carriersLoading } = useQuery<CarrierWithPreferences[]>({
    queryKey: ['organization-carriers', user?.id],
    queryFn: async () => {
      const response = await fetch('/api/carriers/organization-settings', {
        headers: {
          'Authorization': `Bearer ${await (window as any).Clerk?.session?.getToken()}`,
          'X-User-Id': user?.id || '',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch organization carriers');
      return response.json();
    },
    enabled: userLoaded && !!user && isAdmin,
  });

  // Update organization carrier setting mutation
  const updateOrganizationCarrierSetting = useMutation({
    mutationFn: async ({ carrierId, enabled }: { carrierId: string; enabled: boolean }) => {
      const response = await fetch('/api/carriers/organization-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await (window as any).Clerk?.session?.getToken()}`,
          'X-User-Id': user?.id || '',
        },
        body: JSON.stringify({ carrierId, enabled }),
      });
      if (!response.ok) throw new Error('Failed to update organization carrier setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-carriers', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['carriers-with-preferences', user?.id] });
    },
  });

  // Initialize selected carriers when data loads
  useEffect(() => {
    if (carriers) {
      const enabledCarriers = carriers
        .filter(carrier => carrier.organizationEnabled)
        .map(carrier => carrier.id);
      setSelectedCarriers(new Set(enabledCarriers));
    }
  }, [carriers]);

  const handleCarrierToggle = (carrierId: string, enabled: boolean) => {
    setSelectedCarriers(prev => {
      const newSet = new Set(prev);
      if (enabled) {
        newSet.add(carrierId);
      } else {
        newSet.delete(carrierId);
      }
      return newSet;
    });

    updateOrganizationCarrierSetting.mutate({ carrierId, enabled });
  };

  if (!userLoaded) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Admin Access Required</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need admin privileges to manage organization carrier settings.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Organization Carrier Settings</h2>
          <p className="text-sm text-gray-600 mt-1">
            Control which carriers are available to all users in your organization. These settings override individual user preferences.
          </p>
        </div>
        <Badge variant="secondary">
          {selectedCarriers.size} of {carriers?.length || 0} enabled
        </Badge>
      </div>

      {carriersLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {carriers?.map((carrier) => (
            <div
              key={carrier.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-gray-300 bg-white"
            >
              <input
                type="checkbox"
                id={`org-carrier-${carrier.id}`}
                checked={selectedCarriers.has(carrier.id)}
                onChange={(e) => handleCarrierToggle(carrier.id, e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label
                htmlFor={`org-carrier-${carrier.id}`}
                className="flex-1 cursor-pointer text-gray-900"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{carrier.name}</span>
                    {carrier.amBest && (
                      <span className="ml-2 text-sm text-gray-500">
                        (AM Best: {carrier.amBest})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="primary" className="text-xs">
                      Organization Controlled
                    </Badge>
                    {carrier.preferredTierRank && (
                      <Badge variant="outline" className="text-xs">
                        Tier {carrier.preferredTierRank}
                      </Badge>
                    )}
                  </div>
                </div>
              </label>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Organization Control
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                When a carrier is enabled at the organization level, all users in your organization will see it in their recommendations. 
                Individual users cannot disable organization-controlled carriers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
