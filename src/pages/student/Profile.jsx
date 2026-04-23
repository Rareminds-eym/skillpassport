import { useParams, useLocation } from 'react-router-dom';
import { ProfileEditSection, StudentPublicViewer } from '@/widgets/student-dashboard';
import { useUser } from '@/shared/model/authStore';


const Profile = () => {
  const { studentId } = useParams(); // Get studentId from URL if viewing someone else's profile
  const location = useLocation();
  const user = useUser();
  
  // If accessed with studentId param, show public viewer (QR code scan)
  const isQRScan = studentId;
  
  if (isQRScan) {
    return <StudentPublicViewer />;
  }
  
  return <ProfileEditSection />;
};

export default Profile;

