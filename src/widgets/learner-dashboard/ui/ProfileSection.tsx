import React from 'react';
import { User, Mail, MapPin, GraduationCap } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui';

interface ProfileSectionProps {
  profile: any;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({ profile }) => {
  if (!profile) return null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">
              {profile.full_name || profile.name}
            </h2>
            
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
              {profile.email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <span>{profile.email}</span>
                </div>
              )}
              
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
                </div>
              )}
              
              {profile.grade && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  <span>{profile.grade}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
