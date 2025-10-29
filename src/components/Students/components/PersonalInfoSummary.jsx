import React from 'react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Building,
  Calendar,
  Hash,
  Github,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Link as LinkIcon
} from 'lucide-react';

const PersonalInfoSummary = ({ data, isOwnProfile = true }) => {
  if (!data) return null;

  const infoItems = [
    {
      icon: User,
      label: 'Name',
      value: data.name,
      primary: true
    },
    {
      icon: Calendar,
      label: 'Age',
      value: data.age ? `${data.age} years` : null
    },
    {
      icon: Mail,
      label: 'Email',
      value: data.email,
      primary: true
    },
    {
      icon: Phone,
      label: 'Contact',
      value: data.contact_number || data.phone ? 
        `${data.contact_number || data.phone}` : null
    },
    {
      icon: Phone,
      label: 'Alternate Contact',
      value: data.alternate_number || data.alternatePhone ? 
        `${data.alternate_number || data.alternatePhone}` : null
    },
    {
      icon: Calendar,
      label: 'Date of Birth',
      value: (data.date_of_birth || data.dateOfBirth) && 
             (data.date_of_birth || data.dateOfBirth) !== '-' ? 
             (data.date_of_birth || data.dateOfBirth) : null
    },
    {
      icon: MapPin,
      label: 'District',
      value: data.district_name || data.district
    },
    {
      icon: GraduationCap,
      label: 'University',
      value: data.university
    },
    {
      icon: Building,
      label: 'College/School',
      value: data.college_school_name || data.college
    },
    {
      icon: GraduationCap,
      label: 'Branch/Field',
      value: data.branch_field || data.department
    },
    {
      icon: Hash,
      label: 'Registration Number',
      value: data.registration_number || data.registrationNumber
    },
    {
      icon: Hash,
      label: 'NM ID',
      value: data.nm_id
    }
  ];

  // Filter out items with no value
  const displayItems = infoItems.filter(item => item.value && item.value.toString().trim() !== '');

  // Social media links
  const socialLinks = [
    {
      icon: Github,
      label: 'GitHub',
      value: data.github_link || data.githubLink,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100'
    },
    {
      icon: Globe,
      label: 'Portfolio',
      value: data.portfolio_link || data.portfolioLink,
      color: 'text-blue-700',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: data.linkedin_link || data.linkedinLink,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Twitter,
      label: 'Twitter/X',
      value: data.twitter_link || data.twitterLink,
      color: 'text-sky-600',
      bgColor: 'bg-sky-100'
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: data.instagram_link || data.instagramLink,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100'
    },
    {
      icon: Facebook,
      label: 'Facebook',
      value: data.facebook_link || data.facebookLink,
      color: 'text-blue-800',
      bgColor: 'bg-blue-100'
    }
  ];

  const displaySocialLinks = socialLinks.filter(link => link.value && link.value.toString().trim() !== '');

  if (displayItems.length === 0 && displaySocialLinks.length === 0) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <p className="text-blue-500">
            {isOwnProfile
              ? 'No personal information available. Click "Edit Details" to add your information.'
              : 'No personal information available.'
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Current Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                item.primary
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-blue-100 bg-blue-50'
              }`}
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                item.primary
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-blue-50 text-blue-500'
              }`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-500 uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social Media Links Section - Enhanced Design */}
      {displaySocialLinks.length > 0 && (
        <div className="border-t border-blue-200 pt-6 mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-600" />
              Social & Professional Links
            </h3>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-blue-300 to-transparent"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displaySocialLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={index}
                  href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden flex items-center space-x-3 p-4 rounded-xl border border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-lg hover:scale-105 ${link.bgColor}`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 ${link.bgColor} ${link.color} group-hover:scale-110`}>
                    <IconComponent className="w-5 h-5 group-hover:rotate-12 transition-all duration-300" />
                  </div>
                  <div className="flex-1 min-w-0 relative z-10">
                    <p className={`text-sm font-bold ${link.color} group-hover:underline`}>
                      {link.label}
                    </p>
                    <p className="text-xs text-gray-500 truncate">View Profile</p>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Info Badge */}
      {data.imported_at && (
        <div className="flex justify-center">
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-600">
            Last updated: {new Date(data.imported_at).toLocaleDateString()}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSummary;