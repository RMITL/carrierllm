import { UserProfile } from '@clerk/clerk-react';

export const ProfilePage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "shadow-lg",
          }
        }}
      />
    </div>
  );
};