import React from 'react';

const Footer = () => {
  const footerLinks = [
    { label: 'Help', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Privacy', href: '#' },
    { label: 'Contact', href: '#' }
  ];

  return (
    <footer className="bg-[#6A0DAD] text-white py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center space-y-4">
          <nav className="flex items-center space-x-6">
            {footerLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className="text-sm font-medium hover:text-[#FFD700] transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>
          
          <div className="text-center">
            <p className="text-sm text-gray-300">
              © 2024 Skill Passport. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Empowering students with verified digital credentials
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;