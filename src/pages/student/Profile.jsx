import { useParams, useLocation } from 'react-router-dom';
import ProfileEditSection from '../../components/Students/components/ProfileEditSection';
import StudentPublicViewer from '../../components/Students/components/StudentPublicViewer';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { studentId } = useParams(); // Get studentId from URL if viewing someone else's profile
  const location = useLocation();
  const { user } = useAuth();

  // If accessed with studentId param, show public viewer (QR code scan)
  const isQRScan = studentId;

  if (isQRScan) {
    return <StudentPublicViewer />;
  }

  return <ProfileEditSection />;
};

export default Profile;
