import React, { useState, useEffect } from 'react';
import { useUser, useOrganization } from '@clerk/clerk-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Badge } from '@carrierllm/ui';
import type { 
  CarrierWithPreferences, 
  UserCarrierPreference, 
  OrganizationCarrierSetting,
  UserDocument,
  DocumentUploadRequest,
  DocumentUploadResponse
} from '../types';

interface CarriersPanelProps {
  className?: string;
}

export const CarriersPanel: React.FC<CarriersPanelProps> = ({ className = '' }) => {
  const { user, isLoaded: userLoaded } = useUser();
  const { organization, membership } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedCarriers, setSelectedCarriers] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Check if user is admin in their organization
  const isAdmin = membership?.role === 'admin' || membership?.role === 'org:admin';

  // Fetch carriers with user preferences
  const { data: carriers, isLoading: carriersLoading } = useQuery<CarrierWithPreferences[]>({
    queryKey: ['carriers-with-preferences', user?.id, organization?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getCarriersWithPreferences();
    },
    enabled: userLoaded && !!user,
  });

  // Fetch user documents
  const { data: userDocuments, isLoading: documentsLoading } = useQuery<UserDocument[]>({
    queryKey: ['user-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getUserDocuments();
    },
    enabled: userLoaded && !!user,
  });

  // Update carrier preference mutation
  const updateCarrierPreferenceMutation = useMutation({
    mutationFn: async ({ carrierId, enabled }: { carrierId: string; enabled: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated');
      return updateCarrierPreference(carrierId, enabled);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carriers-with-preferences', user?.id, organization?.id] });
    },
  });

  // Document upload mutation
  const uploadDocumentMutation = useMutation({
    mutationFn: async (uploadRequest: DocumentUploadRequest): Promise<DocumentUploadResponse> => {
      if (!user?.id) throw new Error('User not authenticated');
      return uploadDocument(uploadRequest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', user?.id] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  // Initialize selected carriers when data loads
  useEffect(() => {
    if (carriers) {
      const enabledCarriers = carriers
        .filter(carrier => carrier.userEnabled && carrier.organizationEnabled)
        .map(carrier => carrier.id);
      setSelectedCarriers(new Set(enabledCarriers));
    }
  }, [carriers]);

  const handleCarrierToggle = (carrierId: string, enabled: boolean) => {
    if (carriers) {
      const carrier = carriers.find(c => c.id === carrierId);
      if (carrier?.isOrganizationControlled) {
        // Don't allow toggling organization-controlled carriers
        return;
      }
    }

    setSelectedCarriers(prev => {
      const newSet = new Set(prev);
      if (enabled) {
        newSet.add(carrierId);
      } else {
        newSet.delete(carrierId);
      }
      return newSet;
    });

    updateCarrierPreferenceMutation.mutate({ carrierId, enabled });
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll use a default carrier - in a real implementation,
    // you'd have a carrier selection UI
    const uploadRequest: DocumentUploadRequest = {
      carrierId: 'default',
      carrierName: 'Default Carrier',
      title: file.name,
      file,
      docType: 'underwriting_guide',
      effectiveDate: new Date().toISOString().split('T')[0],
    };

    setUploading(true);
    uploadDocumentMutation.mutate(uploadRequest);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Carrier Selection Section */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Carrier Selection</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose which carriers to include in your recommendations. Organization-controlled carriers are managed by your admin.
            </p>
          </div>
          <Badge variant="secondary">
            {selectedCarriers.size} of {carriers?.length || 0} selected
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
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  carrier.isOrganizationControlled
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  id={`carrier-${carrier.id}`}
                  checked={selectedCarriers.has(carrier.id)}
                  onChange={(e) => handleCarrierToggle(carrier.id, e.target.checked)}
                  disabled={carrier.isOrganizationControlled}
                  className={`w-4 h-4 rounded border-gray-300 ${
                    carrier.isOrganizationControlled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'text-blue-600 focus:ring-blue-500'
                  }`}
                />
                <label
                  htmlFor={`carrier-${carrier.id}`}
                  className={`flex-1 cursor-pointer ${
                    carrier.isOrganizationControlled
                      ? 'text-gray-500 cursor-not-allowed'
                      : 'text-gray-900'
                  }`}
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
                      {carrier.isOrganizationControlled && (
                        <Badge variant="secondary" className="text-xs">
                          Org Controlled
                        </Badge>
                      )}
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
      </Card>

      {/* Document Upload Section */}
      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Upload Underwriting Documents</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload carrier underwriting guides, build charts, and other documents to enhance recommendations.
          </p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            id="document-upload"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleDocumentUpload}
            disabled={uploading}
            className="hidden"
          />
          <label
            htmlFor="document-upload"
            className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex flex-col items-center">
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-gray-600 mb-2">
                {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500">
                PDF, DOC, DOCX, TXT files up to 10MB
              </p>
            </div>
          </label>
        </div>

        {/* Uploaded Documents List */}
        {userDocuments && userDocuments.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Your Documents</h3>
            <div className="space-y-2">
              {userDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(doc.fileSize)} • {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={doc.processed ? 'success' : 'warning'}>
                      {doc.processed ? 'Processed' : 'Processing'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {doc.docType.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
