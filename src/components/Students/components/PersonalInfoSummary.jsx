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
  Building2,
  Calendar,
  Hash,
  Github,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Link as LinkIcon,
} from 'lucide-react';

const PersonalInfoSummary = ({ data, studentData, isOwnProfile = true }) => {
  // Determine institution from studentData
  const institution = React.useMemo(() => {
    // Priority: school_id takes precedence if both exist
    if (studentData?.school_id && studentData?.school) {
      return {
        type: 'School',
        name: studentData.school.name,
        code: studentData.school.code,
        city: studentData.school.city,
        state: studentData.school.state,
      };
    } else if (studentData?.university_college_id && studentData?.universityCollege) {
      // University college with parent university info
      const college = studentData.universityCollege;
      const university = college.universities; // nested university data
      return {
        type: 'University College',
        name: college.name,
        code: college.code,
        universityName: university?.name,
        city: university?.district, // Location comes from parent university
        state: university?.state,
      };
    }
    return null;
  }, [studentData]);

  if (!data) return null;

  const infoItems = [
    {
      icon: User,
      label: 'Name',
      value: data.name,
      primary: true,
    },
    {
      icon: Calendar,
      label: 'Age',
      value: data.age ? `${data.age} years` : null,
    },
    {
      icon: Mail,
      label: 'Email',
      value: data.email,
      primary: true,
    },
    {
      icon: Phone,
      label: 'Contact',
      value: data.contact_number || data.phone ? `${data.contact_number || data.phone}` : null,
    },
    {
      icon: Phone,
      label: 'Alternate Contact',
      value:
        data.alternate_number || data.alternatePhone
          ? `${data.alternate_number || data.alternatePhone}`
          : null,
    },
    {
      icon: Calendar,
      label: 'Date of Birth',
      value:
        (data.date_of_birth || data.dateOfBirth) && (data.date_of_birth || data.dateOfBirth) !== '-'
          ? data.date_of_birth || data.dateOfBirth
          : null,
    },
    {
      icon: MapPin,
      label: 'District',
      value: data.district_name || data.district,
    },
    {
      icon: GraduationCap,
      label: 'University',
      value: data.university,
    },
    {
      icon: Building,
      label: 'College/School',
      value: data.college_school_name || data.college,
    },
    {
      icon: GraduationCap,
      label: 'Branch/Field',
      value: data.branch_field || data.department,
    },
    {
      icon: Hash,
      label: 'Registration Number',
      value: data.registration_number || data.registrationNumber,
    },
    // COMMENTED OUT FOR NOW - RM ID not required
    // {
    //   icon: Hash,
    //   label: 'RM ID',
    //   value: data.nm_id
    // }
  ];

  // Filter out items with no value
  const displayItems = infoItems.filter(
    (item) => item.value && item.value.toString().trim() !== ''
  );

  // Social media links
  const socialLinks = [
    {
      icon: Github,
      label: 'GitHub',
      value: data.github_link || data.githubLink,
    },
    {
      icon: Globe,
      label: 'Portfolio',
      value: data.portfolio_link || data.portfolioLink,
    },
    {
      icon: Linkedin,
      label: 'LinkedIn',
      value: data.linkedin_link || data.linkedinLink,
    },
    {
      icon: Twitter,
      label: 'Twitter/X',
      value: data.twitter_link || data.twitterLink,
    },
    {
      icon: Instagram,
      label: 'Instagram',
      value: data.instagram_link || data.instagramLink,
    },
    {
      icon: Facebook,
      label: 'Facebook',
      value: data.facebook_link || data.facebookLink,
    },
  ];

  const displaySocialLinks = socialLinks.filter(
    (link) => link.value && link.value.toString().trim() !== ''
  );

  if (displayItems.length === 0 && displaySocialLinks.length === 0) {
    return (
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50">
        <CardContent className="p-6 text-center">
          <User className="w-12 h-12 text-blue-300 mx-auto mb-3" />
          <p className="text-blue-500">
            {isOwnProfile
              ? 'No personal information available. Click "Edit Details" to add your information.'
              : 'No personal information available.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Institution Card */}
      {institution && (
        <div className="mb-6">
          <Card className="border border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    {institution.type}
                  </p>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{institution.name}</h3>
                  {institution.universityName && (
                    <p className="text-sm text-gray-600 mb-2">{institution.universityName}</p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                    {institution.code && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        <span className="font-medium">{institution.code}</span>
                      </div>
                    )}
                    {(institution.city || institution.state) && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>
                          {[institution.city, institution.state].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-800">Current Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayItems.map((item, index) => {
          const IconComponent = item.icon;
          return (
            <div
              key={index}
              className="flex items-center space-x-3 p-4 rounded-lg border border-blue-200 bg-blue-50"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                  {item.label}
                </p>
                <p className="text-sm font-semibold text-gray-900 truncate">{item.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Social Media Links Section - Modern Design */}
      {displaySocialLinks.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <LinkIcon className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Social & Professional Links</h3>
            </div>
            <p className="text-sm text-gray-600 ml-11">Connect and explore professional profiles</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displaySocialLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <a
                  key={index}
                  href={link.value.startsWith('http') ? link.value : `https://${link.value}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center group-hover:bg-blue-700 transition-colors duration-200">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-200">
                        {link.label}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        View Profile
                        <svg
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </p>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Info Badge */}
      {data.imported_at && (
        <div className="flex justify-center pt-4">
          <Badge variant="outline" className="text-xs border-blue-200 text-blue-600 bg-blue-50">
            Last updated: {new Date(data.imported_at).toLocaleDateString()}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default PersonalInfoSummary;
