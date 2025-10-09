import { Link } from 'react-router-dom';
import Button from '../../components/Button';
import { GraduationCap, Briefcase, TrendingUp, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">Welcome to SkillPassport</h1>
            <p className="text-xl mb-8 text-blue-100">
              Connecting talented students with leading recruiters and career opportunities
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/login/student">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  Student Login
                </Button>
              </Link>
              <Link to="/login/recruiter">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
                  Recruiter Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">Why Choose SkillPassport?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Students</h3>
              <p className="text-gray-600">Build your profile and showcase your skills to top recruiters</p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">For Recruiters</h3>
              <p className="text-gray-600">Find qualified candidates and post job opportunities</p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Career Growth</h3>
              <p className="text-gray-600">Track your applications and grow your professional network</p>
            </div>

            <div className="text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Community</h3>
              <p className="text-gray-600">Join thousands of students and recruiters in our network</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Create your account today and take the first step towards your career goals
          </p>
          <Link to="/register">
            <Button size="lg">Register Now</Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
