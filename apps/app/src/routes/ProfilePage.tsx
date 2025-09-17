import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Card, Button } from '@carrierllm/ui';

export const ProfilePage = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.emailAddresses[0]?.emailAddress || '',
    phone: user?.phoneNumbers[0]?.phoneNumber || '',
    company: user?.organizationMemberships[0]?.organization?.name || '',
    title: '',
    licenseNumber: '',
    licenseState: '',
  });

  const handleSave = async () => {
    try {
      // In a real app, you'd update the user profile via Clerk API
      // await user?.update({
      //   firstName: profile.firstName,
      //   lastName: profile.lastName,
      // });

      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const handleCancel = () => {
    setProfile({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.emailAddresses[0]?.emailAddress || '',
      phone: user?.phoneNumbers[0]?.phoneNumber || '',
      company: user?.organizationMemberships[0]?.organization?.name || '',
      title: '',
      licenseNumber: '',
      licenseState: '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account information and professional details.
        </p>
      </div>

      {/* Profile Picture */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h2>
        <div className="flex items-center space-x-6">
          <img
            className="h-20 w-20 rounded-full object-cover"
            src={user?.imageUrl || '/default-avatar.png'}
            alt="Profile"
          />
          <div>
            <Button variant="secondary" size="sm">
              Change Picture
            </Button>
            <p className="mt-1 text-xs text-gray-500">
              JPG, GIF or PNG. 1MB max.
            </p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
          {!isEditing && (
            <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.firstName || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.lastName || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <p className="text-gray-900">{profile.email}</p>
            <p className="text-xs text-gray-500 mt-1">
              Email changes must be done through account security settings
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            {isEditing ? (
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.phone || 'Not provided'}</p>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <Button variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        )}
      </Card>

      {/* Professional Information */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Professional Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.company}
                onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.company || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Title
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.title}
                onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
                placeholder="e.g., Insurance Agent"
              />
            ) : (
              <p className="text-gray-900">{profile.title || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License Number
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.licenseNumber}
                onChange={(e) => setProfile(prev => ({ ...prev, licenseNumber: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
              />
            ) : (
              <p className="text-gray-900">{profile.licenseNumber || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              License State
            </label>
            {isEditing ? (
              <input
                type="text"
                value={profile.licenseState}
                onChange={(e) => setProfile(prev => ({ ...prev, licenseState: e.target.value.toUpperCase() }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent"
                placeholder="e.g., CA"
                maxLength={2}
              />
            ) : (
              <p className="text-gray-900">{profile.licenseState || 'Not provided'}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Account Security */}
      <Card>
        <h2 className="text-lg font-medium text-gray-900 mb-4">Account Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Password</p>
              <p className="text-sm text-gray-500">Last updated 30 days ago</p>
            </div>
            <Button variant="secondary" size="sm">
              Change Password
            </Button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div>
              <p className="text-sm font-medium text-gray-900">Two-Factor Authentication</p>
              <p className="text-sm text-gray-500">Add an extra layer of security</p>
            </div>
            <Button variant="secondary" size="sm">
              Enable 2FA
            </Button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Active Sessions</p>
              <p className="text-sm text-gray-500">Manage your active sessions</p>
            </div>
            <Button variant="secondary" size="sm">
              View Sessions
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};