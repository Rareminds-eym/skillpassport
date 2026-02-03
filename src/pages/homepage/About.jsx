import { Target, Heart, Award } from 'lucide-react';
import SEOHead from '../../components/SEO/SEOHead';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <SEOHead
        title="Skill Ecosystem - Educational Management & Career Development Platform"
        description="Learn about Skill Ecosystem's mission to revolutionize education through AI-powered career guidance and comprehensive management solutions for educational institutions."
        keywords="about skill ecosystem, educational technology, AI career guidance, student management platform, educational innovation, rareminds"
        url="https://skillpassport.rareminds.in/about"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">About SkillPassport</h1>
          <p className="text-xl text-gray-600">
            Empowering students and connecting them with career opportunities
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            SkillPassport was founded with a simple mission: to bridge the gap between talented students
            and forward-thinking recruiters. We understand that finding the right career opportunity can
            be challenging, and hiring the right talent is equally difficult.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Our platform provides a comprehensive solution that helps students showcase their skills,
            track their applications, and connect with recruiters who are actively looking for talent
            like them.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Mission</h3>
            <p className="text-gray-600">
              To create meaningful connections between students and recruiters, making career
              opportunities accessible to everyone.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Values</h3>
            <p className="text-gray-600">
              We believe in transparency, integrity, and equal opportunity for all students,
              regardless of their background.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Our Vision</h3>
            <p className="text-gray-600">
              To become the leading platform that transforms how students and recruiters connect
              in the digital age.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
