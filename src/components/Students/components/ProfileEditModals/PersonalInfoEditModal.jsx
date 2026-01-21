import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Save, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AutocompleteInput } from '../ui/autocomplete';
import { searchUniversities, searchCollegesAndSchools } from '@/utils/educationSearch';

const PersonalInfoEditModal = ({ isOpen, onClose, data, onSave }) => {
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    contact_number: '',
    alternate_number: '',
    contact_number_dial_code: '91',
    date_of_birth: '',
    district_name: '',
    university: '',
    college_school_name: '',
    branch_field: '',
    registration_number: '',
    nm_id: '',
    github_link: '',
    portfolio_link: '',
    linkedin_link: '',
    twitter_link: '',
    instagram_link: '',
    facebook_link: '',
    other_social_links: [],
  });

  const [isSaving, setIsSaving] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (data && isOpen) {
      // Extract contact number from formatted phone string if needed
      const extractNumber = (formattedPhone) => {
        if (!formattedPhone) return '';
        // Remove +XX prefix and spaces
        return formattedPhone.replace(/^\+\d+\s*/, '').trim();
      };

      // Handle both raw data and transformed data structures
      const getName = () => data.name || '';
      const getAge = () => data.age || '';
      const getEmail = () => data.email || '';
      const getContactNumber = () => {
        // Try in order: contact_number (raw), phone (transformed)
        if (data.contact_number) return String(data.contact_number);
        if (data.phone) return extractNumber(data.phone);
        return '';
      };
      const getAlternateNumber = () => {
        // Try in order: alternate_number (raw), alternatePhone (transformed)
        if (data.alternate_number) return String(data.alternate_number);
        if (data.alternatePhone) return extractNumber(data.alternatePhone);
        return '';
      };
      const getDialCode = () => data.contact_number_dial_code || '91';
      const getDateOfBirth = () => {
        const dob = data.dateOfBirth || data.date_of_birth || '';
        return dob === '-' ? '' : dob;
      };
      const getDistrict = () => data.district || data.district_name || '';
      const getUniversity = () => data.university || '';
      const getCollege = () => data.college || data.college_school_name || '';
      const getBranch = () => data.department || data.branch_field || '';
      const getRegistration = () => {
        const reg = data.registrationNumber || data.registration_number || '';
        return String(reg);
      };
      const getNmId = () => {
        const nmId = data.nm_id || '';
        return nmId;
      };
      const getGithubLink = () => data.github_link || data.githubLink || '';
      const getPortfolioLink = () => data.portfolio_link || data.portfolioLink || '';
      const getLinkedinLink = () => data.linkedin_link || data.linkedinLink || '';
      const getTwitterLink = () => data.twitter_link || data.twitterLink || '';
      const getInstagramLink = () => data.instagram_link || data.instagramLink || '';
      const getFacebookLink = () => data.facebook_link || data.facebookLink || '';
      const getOtherSocialLinks = () => data.other_social_links || data.otherSocialLinks || [];

      const formValues = {
        name: getName(),
        age: getAge(),
        email: getEmail(),
        contact_number: getContactNumber(),
        alternate_number: getAlternateNumber(),
        contact_number_dial_code: getDialCode(),
        date_of_birth: getDateOfBirth(),
        district_name: getDistrict(),
        university: getUniversity(),
        college_school_name: getCollege(),
        branch_field: getBranch(),
        registration_number: getRegistration(),
        nm_id: getNmId(),
        github_link: getGithubLink(),
        portfolio_link: getPortfolioLink(),
        linkedin_link: getLinkedinLink(),
        twitter_link: getTwitterLink(),
        instagram_link: getInstagramLink(),
        facebook_link: getFacebookLink(),
        other_social_links: getOtherSocialLinks(),
      };

      setFormData(formValues);
    }
  }, [data, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.name?.trim() || !formData.email?.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in at least name and email fields.',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      await onSave(formData);
      toast({
        title: 'Success! ✅',
        description: 'Your personal information has been saved and updated.',
      });
      // Wait a moment for the refresh to complete before closing
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      console.error('❌ Error saving personal info:', error);
      toast({
        title: 'Error',
        description: 'Failed to save personal information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-blue-600" />
            Edit Personal Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', e.target.value)}
                placeholder="Enter your age"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                value={formData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                placeholder="DD-MM-YYYY or other format"
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_number_dial_code">Country Code</Label>
                <Input
                  id="contact_number_dial_code"
                  value={formData.contact_number_dial_code}
                  onChange={(e) => handleInputChange('contact_number_dial_code', e.target.value)}
                  placeholder="91"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_number">Primary Contact Number</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange('contact_number', e.target.value)}
                  placeholder="Enter primary contact number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alternate_number">Alternate Contact Number</Label>
                <Input
                  id="alternate_number"
                  type="tel"
                  value={formData.alternate_number}
                  onChange={(e) => handleInputChange('alternate_number', e.target.value)}
                  placeholder="Enter alternate contact number"
                />
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Location Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="district_name">District</Label>
                <Input
                  id="district_name"
                  value={formData.district_name}
                  onChange={(e) => handleInputChange('district_name', e.target.value)}
                  placeholder="Enter your district"
                />
              </div>
            </div>
          </div>

          {/* Educational Information */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Educational Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <AutocompleteInput
                  id="university"
                  label="University"
                  value={formData.university}
                  onChange={(e) => handleInputChange('university', e.target.value)}
                  placeholder="Enter your university"
                  searchFunction={searchUniversities}
                  displayField="name"
                  minChars={2}
                />
              </div>

              <div className="space-y-2">
                <AutocompleteInput
                  id="college_school_name"
                  label="College/School Name"
                  value={formData.college_school_name}
                  onChange={(e) => handleInputChange('college_school_name', e.target.value)}
                  placeholder="Enter your college or school name"
                  searchFunction={searchCollegesAndSchools}
                  displayField="name"
                  minChars={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch_field">Branch/Field of Study</Label>
                <Input
                  id="branch_field"
                  value={formData.branch_field}
                  onChange={(e) => handleInputChange('branch_field', e.target.value)}
                  placeholder="Enter your branch or field"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registration_number">Registration Number</Label>
                <Input
                  id="registration_number"
                  value={formData.registration_number}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                  placeholder="Enter your registration number"
                />
              </div>
            </div>
          </div>

          {/* Social Media & Professional Links */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Social Media & Professional Links
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="github_link">GitHub Profile</Label>
                <Input
                  id="github_link"
                  type="url"
                  value={formData.github_link}
                  onChange={(e) => handleInputChange('github_link', e.target.value)}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolio_link">Portfolio Website</Label>
                <Input
                  id="portfolio_link"
                  type="url"
                  value={formData.portfolio_link}
                  onChange={(e) => handleInputChange('portfolio_link', e.target.value)}
                  placeholder="https://yourportfolio.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_link">LinkedIn Profile</Label>
                <Input
                  id="linkedin_link"
                  type="url"
                  value={formData.linkedin_link}
                  onChange={(e) => handleInputChange('linkedin_link', e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="twitter_link">Twitter/X Profile</Label>
                <Input
                  id="twitter_link"
                  type="url"
                  value={formData.twitter_link}
                  onChange={(e) => handleInputChange('twitter_link', e.target.value)}
                  placeholder="https://twitter.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instagram_link">Instagram Profile</Label>
                <Input
                  id="instagram_link"
                  type="url"
                  value={formData.instagram_link}
                  onChange={(e) => handleInputChange('instagram_link', e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facebook_link">Facebook Profile</Label>
                <Input
                  id="facebook_link"
                  type="url"
                  value={formData.facebook_link}
                  onChange={(e) => handleInputChange('facebook_link', e.target.value)}
                  placeholder="https://facebook.com/yourusername"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Personal Information'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PersonalInfoEditModal;
