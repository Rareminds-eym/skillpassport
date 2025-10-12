import { useParams } from 'react-router-dom';
import ProfileEditSection from '../../components/Students/components/ProfileEditSection';

const Profile = () => {
  const { email } = useParams(); // Get email from URL if viewing someone else's profile
  
  return <ProfileEditSection profileEmail={email} />;
};

export default Profile;

