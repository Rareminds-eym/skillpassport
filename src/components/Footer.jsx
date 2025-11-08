import { Link } from 'react-router-dom';
import { Linkedin, Twitter, Youtube, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="relative bg-black text-white mt-auto overflow-hidden">
      {/* Futuristic Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(to right, rgb(168, 85, 247) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(168, 85, 247) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}></div>
      </div>

      {/* Glowing Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600 rounded-full opacity-10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500 rounded-full opacity-10 blur-3xl"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block mb-6 group">
              <div className="relative">
                <img 
                  src="/RareMinds.webp" 
                  alt="RareMinds Logo" 
                  className="h-16 w-auto transition-all duration-300 group-hover:scale-105 brightness-0 invert"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-amber-400 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
              </div>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              Empowering the next generation of talent with digital credentials that unlock infinite possibilities.
            </p>
            <div className="flex items-center space-x-1">
              <div className="h-1 w-12 bg-gradient-to-r from-purple-500 to-amber-400 rounded-full"></div>
              <div className="h-1 w-4 bg-purple-500 rounded-full opacity-50"></div>
              <div className="h-1 w-2 bg-amber-400 rounded-full opacity-30"></div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/about" 
                  className="group flex items-center text-gray-300 hover:text-white transition-all duration-200"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-gradient-to-r from-purple-400 to-amber-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  <span className="text-sm">About</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="https://rareminds.in/blogs" 
                  className="group flex items-center text-gray-300 hover:text-white transition-all duration-200"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-gradient-to-r from-purple-400 to-amber-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  <span className="text-sm">Blog</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="https://rareminds.in/contact" 
                  className="group flex items-center text-gray-300 hover:text-white transition-all duration-200"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-gradient-to-r from-purple-400 to-amber-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  <span className="text-sm">Support</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="https://rareminds.in/privacy-policy" 
                  className="group flex items-center text-gray-300 hover:text-white transition-all duration-200"
                >
                  <span className="w-0 group-hover:w-2 h-0.5 bg-gradient-to-r from-purple-400 to-amber-400 mr-0 group-hover:mr-2 transition-all duration-200"></span>
                  <span className="text-sm">Privacy Policy</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect Section */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white text-center">
              Connect With Us
            </h4>
            <div className="flex flex-row items-center justify-center gap-4 flex-nowrap">
               <a 
                href="https://www.linkedin.com/company/rareminds/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-purple-400 transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5 text-gray-300 group-hover:text-purple-400 transition-colors duration-200" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/20 group-hover:to-transparent rounded-xl transition-all duration-300"></div>
              </a>
              <a 
                href="https://www.facebook.com/raremindsgroup" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-blue-500 transition-all duration-300 hover:scale-110"
                aria-label="Facebook"
              >
                <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors duration-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:to-transparent rounded-xl transition-all duration-300"></div>
              </a>
              <a 
                href="https://x.com/minds_rare" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-blue-400 transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors duration-200" />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:to-transparent rounded-xl transition-all duration-300"></div>
              </a>
              <a 
                href="https://www.youtube.com/channel/UClkBtwJsScYxFzNoFdlifeA" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-red-400 transition-all duration-300 hover:scale-110"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5 text-gray-300 group-hover:text-red-400 transition-colors duration-200" />
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 to-red-500/0 group-hover:from-red-500/20 group-hover:to-transparent rounded-xl transition-all duration-300"></div>
              </a>
              <a 
                href="https://www.instagram.com/rareminds_eym/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group relative w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:border-pink-400 transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-gray-300 group-hover:text-pink-400 transition-colors duration-200" />
                <div className="absolute inset-0 bg-gradient-to-br from-pink-500/0 to-pink-500/0 group-hover:from-pink-500/20 group-hover:to-transparent rounded-xl transition-all duration-300"></div>
              </a>
            </div>
          </div>

          {/* Mission Statement */}
          <div>
            <h4 className="text-lg font-bold mb-6 text-white">
              Our Mission
            </h4>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">
              Building a future where skills speak louder than credentials, connecting extraordinary talent with transformative opportunities.
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="px-4 bg-gradient-to-r from-transparent via-slate-950 to-transparent">
              <div className="h-1 w-24 bg-gradient-to-r from-purple-500 via-purple-400 to-amber-400 rounded-full opacity-50"></div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>&copy; {new Date().getFullYear()} RareMinds SkillPassport.</span>
            <span className="hidden md:inline">•</span>
            <span>All rights reserved.</span>
          </div>
          
          <div className="flex items-center space-x-6 text-xs text-gray-400">
            <Link to="https://rareminds.in/terms" className="hover:text-purple-400 transition-colors duration-200">
              Terms of Service
            </Link>
            <span>•</span>
            <Link to="/cookies" className="hover:text-purple-400 transition-colors duration-200">
              Cookie Policy
            </Link>
            <span>•</span>
            <Link to="/accessibility" className="hover:text-purple-400 transition-colors duration-200">
              Accessibility
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
