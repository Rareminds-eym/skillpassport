import { useParams, useLocation } from 'react-router-dom';
import { ProfileEditSection } from '@/widgets/learner-dashboard';
import { LearnerPublicViewer } from '@/features/learner-profile';
import { useUser } from '@/shared/model/authStore';


const Profile = () => {
  const { learnerId } = useParams(); // Get learnerId from URL if viewing someone else's profile
  const location = useLocation();
  const user = useUser();
  
  // If accessed with learnerId param, show public viewer (QR code scan)
  const isQRScan = learnerId;
  
  if (isQRScan) {
    return <LearnerPublicViewer />;
  }
  
  return <ProfileEditSection />;
};

export default Profile;

