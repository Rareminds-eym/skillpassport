import React from 'react';
import { Navigate } from 'react-router-dom';

const SettingsPage: React.FC = () => {
  // Redirect to theme settings instead of profile (profile settings commented out)
  return <Navigate to="/settings/theme" replace />;
};

export default SettingsPage;
