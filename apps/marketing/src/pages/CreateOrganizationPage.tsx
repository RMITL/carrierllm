import React, { useEffect, useState } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Button, Card } from '@carrierllm/ui';

const CreateOrganizationPage: React.FC = () => {
  const { user } = useUser();
  const { openCreateOrganization } = useClerk();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Check if user came from organization signup
    const selectedPlanType = localStorage.getItem('selectedPlanType');
    if (selectedPlanType === 'organization' && user) {
      // Auto-trigger organization creation
      handleCreateOrganization();
    }
  }, [user]);

  const handleCreateOrganization = async () => {
    if (!user) return;
    
    setIsCreating(true);
    try {
      await openCreateOrganization({
        afterCreateOrganizationUrl: '/success',
        appearance: {
          elements: {
            rootBox: 'mx-auto',
            card: 'shadow-lg'
          }
        }
      });
    } catch (error) {
      console.error('Error creating organization:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">
            You need to be signed in to create an organization.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Homepage
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="p-8 text-center max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Create Your Organization
        </h1>
        <p className="text-gray-600 mb-6">
          Welcome, {user.firstName || user.emailAddresses[0].emailAddress}! 
          Let's set up your organization to get started with team pricing.
        </p>
        
        <div className="space-y-4">
          <Button 
            variant="primary" 
            onClick={handleCreateOrganization}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? 'Creating Organization...' : 'Create Organization'}
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Back to Homepage
          </Button>
        </div>
        
        <p className="text-sm text-gray-500 mt-6">
          After creating your organization, you'll be able to manage team members and billing.
        </p>
      </Card>
    </div>
  );
};

export default CreateOrganizationPage;
