import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
        }
        catch (error) {
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
    return (_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Profile Settings" }), _jsx("p", { className: "mt-1 text-sm text-gray-600", children: "Manage your account information and professional details." })] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Profile Picture" }), _jsxs("div", { className: "flex items-center space-x-6", children: [_jsx("img", { className: "h-20 w-20 rounded-full object-cover", src: user?.imageUrl || '/default-avatar.png', alt: "Profile" }), _jsxs("div", { children: [_jsx(Button, { variant: "secondary", size: "sm", children: "Change Picture" }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "JPG, GIF or PNG. 1MB max." })] })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h2", { className: "text-lg font-medium text-gray-900", children: "Personal Information" }), !isEditing && (_jsx(Button, { variant: "secondary", size: "sm", onClick: () => setIsEditing(true), children: "Edit" }))] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "First Name" }), isEditing ? (_jsx("input", { type: "text", value: profile.firstName, onChange: (e) => setProfile(prev => ({ ...prev, firstName: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent" })) : (_jsx("p", { className: "text-gray-900", children: profile.firstName || 'Not provided' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Last Name" }), isEditing ? (_jsx("input", { type: "text", value: profile.lastName, onChange: (e) => setProfile(prev => ({ ...prev, lastName: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent" })) : (_jsx("p", { className: "text-gray-900", children: profile.lastName || 'Not provided' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Email" }), _jsx("p", { className: "text-gray-900", children: profile.email }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Email changes must be done through account security settings" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Phone Number" }), isEditing ? (_jsx("input", { type: "tel", value: profile.phone, onChange: (e) => setProfile(prev => ({ ...prev, phone: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent" })) : (_jsx("p", { className: "text-gray-900", children: profile.phone || 'Not provided' }))] })] }), isEditing && (_jsxs("div", { className: "flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200", children: [_jsx(Button, { variant: "secondary", onClick: handleCancel, children: "Cancel" }), _jsx(Button, { onClick: handleSave, children: "Save Changes" })] }))] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Professional Information" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Company" }), isEditing ? (_jsx("input", { type: "text", value: profile.company, onChange: (e) => setProfile(prev => ({ ...prev, company: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent" })) : (_jsx("p", { className: "text-gray-900", children: profile.company || 'Not provided' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Job Title" }), isEditing ? (_jsx("input", { type: "text", value: profile.title, onChange: (e) => setProfile(prev => ({ ...prev, title: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent", placeholder: "e.g., Insurance Agent" })) : (_jsx("p", { className: "text-gray-900", children: profile.title || 'Not provided' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "License Number" }), isEditing ? (_jsx("input", { type: "text", value: profile.licenseNumber, onChange: (e) => setProfile(prev => ({ ...prev, licenseNumber: e.target.value })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent" })) : (_jsx("p", { className: "text-gray-900", children: profile.licenseNumber || 'Not provided' }))] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "License State" }), isEditing ? (_jsx("input", { type: "text", value: profile.licenseState, onChange: (e) => setProfile(prev => ({ ...prev, licenseState: e.target.value.toUpperCase() })), className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[color:var(--color-primary)] focus:border-transparent", placeholder: "e.g., CA", maxLength: 2 })) : (_jsx("p", { className: "text-gray-900", children: profile.licenseState || 'Not provided' }))] })] })] }), _jsxs(Card, { children: [_jsx("h2", { className: "text-lg font-medium text-gray-900 mb-4", children: "Account Security" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between py-3 border-b border-gray-200", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Password" }), _jsx("p", { className: "text-sm text-gray-500", children: "Last updated 30 days ago" })] }), _jsx(Button, { variant: "secondary", size: "sm", children: "Change Password" })] }), _jsxs("div", { className: "flex items-center justify-between py-3 border-b border-gray-200", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Two-Factor Authentication" }), _jsx("p", { className: "text-sm text-gray-500", children: "Add an extra layer of security" })] }), _jsx(Button, { variant: "secondary", size: "sm", children: "Enable 2FA" })] }), _jsxs("div", { className: "flex items-center justify-between py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Active Sessions" }), _jsx("p", { className: "text-sm text-gray-500", children: "Manage your active sessions" })] }), _jsx(Button, { variant: "secondary", size: "sm", children: "View Sessions" })] })] })] })] }));
};
