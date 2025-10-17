import { useParams, useLocation } from 'react-router-dom';
import ProfileEditSection from '../../components/Students/components/ProfileEditSection';
import StudentPublicViewer from '../../components/Students/components/StudentPublicViewer';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { email } = useParams(); // Get email from URL if viewing someone else's profile
  const location = useLocation();
  const { user } = useAuth();
  
  // If accessed with email param and it's not the current user, show public viewer
  // This happens when QR code is scanned
  const isQRScan = email && email !== user?.email;
  
  if (isQRScan) {
    return <StudentPublicViewer />;
  }
  
  return <ProfileEditSection profileEmail={email} />;
};

export default Profile;

