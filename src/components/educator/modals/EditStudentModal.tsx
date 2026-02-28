import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { updateStudent } from '../../../services/studentService';
import { Country, State, City } from 'country-state-city';
import pincodes from 'indian-pincodes';

interface UpdateStudentData {
  name?: string;
  email?: string;
  contact_number?: string;
  alternate_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  district_name?: string;
  university?: string;
  university_main?: string;
  branch_field?: string;
  college_school_name?: string;
  course_name?: string;
  registration_number?: string;
  github_link?: string;
  linkedin_link?: string;
  twitter_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  portfolio_link?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  contact_number?: string;
  phone?: string;
  alternate_number?: string;
  date_of_birth?: string;
  age?: number;
  gender?: string;
  district_name?: string;
  location?: string;
  university?: string;
  university_main?: string;
  branch_field?: string;
  dept?: string;
  college_school_name?: string;
  college?: string;
  course_name?: string;
  registration_number?: string;
  github_link?: string;
  linkedin_link?: string;
  twitter_link?: string;
  facebook_link?: string;
  instagram_link?: string;
  portfolio_link?: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface EditStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSuccess: () => void;
}

const EditStudentModal: React.FC<EditStudentModalProps> = ({
  isOpen,
  onClose,
  student,
  onSuccess
}) => {
  const [formData, setFormData] = useState<UpdateStudentData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Location dropdown states
  const [countries, setCountries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  
  // Searchable dropdown states for Country, State, City
  const [filteredCountries, setFilteredCountries] = useState<any[]>([]);
  const [filteredStates, setFilteredStates] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const countryDropdownRef = useRef<HTMLDivElement>(null);
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);
  
  // Pincode dropdown states (indian-pincodes)
  const [allPincodes, setAllPincodes] = useState<any[]>([]);
  const [filteredPincodes, setFilteredPincodes] = useState<any[]>([]);
  const [pincodeSearch, setPincodeSearch] = useState('');
  const [showPincodeDropdown, setShowPincodeDropdown] = useState(false);
  const pincodeDropdownRef = useRef<HTMLDivElement>(null);
  
  const [validationErrors, setValidationErrors] = useState<{
    contact_number?: string;
    alternate_number?: string;
    date_of_birth?: string;
    email?: string;
    registration_number?: string;
    pincode?: string;
    github_link?: string;
    linkedin_link?: string;
    portfolio_link?: string;
    twitter_link?: string;
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    district_name?: string;
    address?: string;
    college_school_name?: string;
    university?: string;
    branch_field?: string;
    course_name?: string;
  }>({});

  // Validation functions
  const validatePhone = (phone: string | undefined) => {
    if (!phone) return null; // Optional field
    
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number (10 digits starting with 6-9)
    if (cleanPhone.length !== 10) {
      return "Phone number must be exactly 10 digits";
    }
    
    if (!/^[6-9]/.test(cleanPhone)) {
      return "Phone number must start with 6, 7, 8, or 9";
    }
    
    return null;
  };

  const validateEmail = (email: string | undefined) => {
    if (!email) return null; // Optional field
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    
    return null;
  };

  const validateRegistrationNumber = (regNum: string | undefined) => {
    if (!regNum) return null; // Optional field
    
    if (regNum.length < 3) {
      return "Registration number must be at least 3 characters";
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(regNum)) {
      return "Only letters, numbers, dash and underscore allowed";
    }
    
    return null;
  };

  const validatePincode = (pincode: string | undefined) => {
    if (!pincode) return null; // Optional field
    
    const cleanPincode = pincode.replace(/\D/g, '');
    
    if (cleanPincode.length !== 6) {
      return "Pincode must be exactly 6 digits";
    }
    
    return null;
  };

  const validateGitHubLink = (url: string | undefined) => {
    if (!url) return null; // Optional field
    
    if (!url.startsWith('https://github.com/')) {
      return "GitHub URL must start with https://github.com/";
    }
    
    return null;
  };

  const validateLinkedInLink = (url: string | undefined) => {
    if (!url) return null; // Optional field
    
    if (!url.startsWith('https://linkedin.com/in/') && !url.startsWith('https://www.linkedin.com/in/')) {
      return "LinkedIn URL must start with https://linkedin.com/in/";
    }
    
    return null;
  };

  const validatePortfolioLink = (url: string | undefined) => {
    if (!url) return null; // Optional field
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return "URL must start with http:// or https://";
    }
    
    return null;
  };

  const validateTwitterLink = (url: string | undefined) => {
    if (!url) return null; // Optional field
    
    if (!url.startsWith('https://twitter.com/') && !url.startsWith('https://x.com/')) {
      return "Twitter URL must start with https://twitter.com/ or https://x.com/";
    }
    
    return null;
  };

  const validateBio = (bio: string | undefined) => {
    if (!bio) return null; // Optional field
    
    if (bio.length > 500) {
      return "Bio must not exceed 500 characters";
    }
    
    return null;
  };

  const validateTextOnly = (text: string | undefined, fieldName: string) => {
    if (!text) return null; // Optional field
    
    if (text.length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    
    if (!/^[a-zA-Z\s]+$/.test(text)) {
      return `${fieldName} can only contain letters and spaces`;
    }
    
    return null;
  };

  const validateAcademicField = (text: string | undefined, fieldName: string) => {
    if (!text) return null; // Optional field
    
    if (text.length < 2) {
      return `${fieldName} must be at least 2 characters`;
    }
    
    // Allow alphabets, spaces, dots, and hyphens only
    if (!/^[a-zA-Z\s.\-]+$/.test(text)) {
      return `${fieldName} can only contain letters, spaces, dots, and hyphens`;
    }
    
    return null;
  };

  const validateAddress = (address: string | undefined) => {
    if (!address) return null; // Optional field
    
    if (address.length > 200) {
      return "Address must not exceed 200 characters";
    }
    
    return null;
  };

  const validateDateOfBirth = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return null; // Optional field
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (birthDate > today) {
      return "Date of birth cannot be in the future";
    }
    
    if (age < 11) {
      return "Age must be at least 11 years";
    }
    
    if (age > 100) {
      return "Please enter a valid date of birth";
    }
    
    return null;
  };

  const calculateAge = (dateOfBirth: string | undefined): number | undefined => {
    if (!dateOfBirth) return undefined;
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    let age = today.getFullYear() - birthDate.getFullYear();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : undefined;
  };

  useEffect(() => {
    // Initialize countries list
    const allCountries = Country.getAllCountries();
    setCountries(allCountries);
    
    // Initialize pincodes list
    console.log('🔵 Loading Indian pincodes...');
    try {
      const pincodeData = pincodes.getAllPincodes();
      console.log('✅ Pincodes loaded:', pincodeData.length, 'entries');
      console.log('📦 Sample pincode data:', pincodeData.slice(0, 3));
      setAllPincodes(pincodeData);
      setFilteredPincodes(pincodeData.slice(0, 50)); // Show first 50 initially
    } catch (error) {
      console.error('❌ Error loading pincodes:', error);
    }
  }, []);
  
  // Handle click outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(event.target as Node)) {
        setShowStateDropdown(false);
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (pincodeDropdownRef.current && !pincodeDropdownRef.current.contains(event.target as Node)) {
        setShowPincodeDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && student) {
      // Get date of birth from student data
      const dob = student.date_of_birth || '';
      
      // Calculate age from date of birth if available
      const calculatedAge = dob ? calculateAge(dob) : (student.age || undefined);
      
      // Initialize form with student data
      setFormData({
        name: student.name || '',
        email: student.email || '',
        contact_number: student.contact_number || student.phone || '',
        alternate_number: student.alternate_number || '',
        date_of_birth: dob,
        age: calculatedAge,
        gender: student.gender || '',
        district_name: student.district_name || student.location || '',
        university: student.university || '',
        university_main: student.university_main || '',
        branch_field: student.branch_field || student.dept || '',
        college_school_name: student.college_school_name || student.college || '',
        course_name: student.course_name || '',
        registration_number: student.registration_number || '',
        github_link: student.github_link || '',
        linkedin_link: student.linkedin_link || '',
        twitter_link: student.twitter_link || '',
        facebook_link: student.facebook_link || '',
        instagram_link: student.instagram_link || '',
        portfolio_link: student.portfolio_link || '',
        bio: student.bio || '',
        address: student.address || '',
        city: student.city || '',
        state: student.state || '',
        country: student.country || '',
        pincode: student.pincode || ''
      });
      
      // Initialize location dropdowns based on existing data
      if (student.country) {
        const selectedCountry = Country.getAllCountries().find(c => c.name === student.country);
        if (selectedCountry) {
          const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
          setStates(countryStates);
          setFilteredStates(countryStates);
          
          if (student.state) {
            const selectedState = countryStates.find(s => s.name === student.state);
            if (selectedState) {
              const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
              setCities(stateCities);
              setFilteredCities(stateCities);
            }
          }
        }
      }
      
      // Set search fields to show existing data
      setCountrySearch(student.country || '');
      setStateSearch(student.state || '');
      setCitySearch(student.city || '');
      setPincodeSearch(student.pincode || '');
      
      // Reset filtered lists to show all options
      setFilteredCountries(countries);
      
      setError(null);
      setSuccessMessage(null);
      setValidationErrors({});
    }
  }, [isOpen, student, countries]);

  // Handle country search
  const handleCountrySearch = (searchValue: string) => {
    console.log('🌍 Searching countries for:', searchValue);
    setCountrySearch(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredCountries(countries);
      return;
    }
    
    const filtered = countries.filter((country) =>
      country.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    console.log('✅ Filtered countries:', filtered.length);
    setFilteredCountries(filtered);
  };
  
  // Handle state search
  const handleStateSearch = (searchValue: string) => {
    console.log('🏛️ Searching states for:', searchValue);
    setStateSearch(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredStates(states);
      return;
    }
    
    const filtered = states.filter((state) =>
      state.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    console.log('✅ Filtered states:', filtered.length);
    setFilteredStates(filtered);
  };
  
  // Handle city search
  const handleCitySearch = (searchValue: string) => {
    console.log('🏙️ Searching cities for:', searchValue);
    setCitySearch(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredCities(cities);
      return;
    }
    
    const filtered = cities.filter((city) =>
      city.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    console.log('✅ Filtered cities:', filtered.length);
    setFilteredCities(filtered);
  };

  // Handle pincode search
  const handlePincodeSearch = (searchValue: string) => {
    console.log('🔍 Searching pincodes for:', searchValue);
    setPincodeSearch(searchValue);
    
    if (!searchValue.trim()) {
      setFilteredPincodes(allPincodes.slice(0, 50));
      console.log('📋 Showing first 50 pincodes');
      return;
    }
    
    const filtered = allPincodes.filter((item) => {
      const matchesPincode = item.pincode.toString().includes(searchValue);
      const matchesName = item.name?.toLowerCase().includes(searchValue.toLowerCase());        // ← Fixed
      const matchesDistrict = item.district?.toLowerCase().includes(searchValue.toLowerCase()); // ← Fixed
      const matchesState = item.state?.toLowerCase().includes(searchValue.toLowerCase());       // ← Fixed
      return matchesPincode || matchesName || matchesDistrict || matchesState;
    }).slice(0, 100); // Limit to 100 results
    
    console.log('✅ Filtered pincodes:', filtered.length, 'results');
    setFilteredPincodes(filtered);
  };
  
  // Handle pincode selection
  const handlePincodeSelect = (pincodeData: any) => {
    console.log('📍 Pincode selected:', pincodeData);
    
    const newCountry = pincodeData.country || 'India';
    const newState = pincodeData.state || '';
    const newCity = pincodeData.name || '';
    const newDistrict = pincodeData.district || '';
    const newPincode = pincodeData.pincode.toString();
    
    // Update form data
    setFormData({
      ...formData,
      pincode: newPincode,
      city: newCity,
      district_name: newDistrict,
      state: newState,
      country: newCountry
    });
    
    // Update search fields to show selected values
    setPincodeSearch(newPincode);
    setCountrySearch(newCountry);
    setStateSearch(newState);
    setCitySearch(newCity);
    
    // Update location dropdowns
    const selectedCountry = countries.find(c => c.name === newCountry);
    if (selectedCountry) {
      const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
      setStates(countryStates);
      setFilteredStates(countryStates);
      
      const selectedState = countryStates.find(s => s.name === newState);
      if (selectedState) {
        const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
        setCities(stateCities);
        setFilteredCities(stateCities);
      }
    }
    
    setShowPincodeDropdown(false);
    
    console.log('✅ Location auto-filled from pincode');
    console.log('📋 Updated form data:', {
      pincode: newPincode,
      city: newCity,
      district: newDistrict,
      state: newState,
      country: newCountry
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    let newFormData = {
      ...formData,
      [name]: name === 'age' ? (value ? parseInt(value) : undefined) : value
    };

    // Auto-calculate age when date of birth changes
    if (name === 'date_of_birth') {
      const calculatedAge = calculateAge(value);
      newFormData.age = calculatedAge;
      const dobError = validateDateOfBirth(value);
      setValidationErrors(prev => ({ ...prev, date_of_birth: dobError || undefined }));
    }

    // Validate phone numbers
    if (name === 'contact_number') {
      const phoneError = validatePhone(value);
      setValidationErrors(prev => ({ ...prev, contact_number: phoneError || undefined }));
    }

    if (name === 'alternate_number') {
      const phoneError = validatePhone(value);
      setValidationErrors(prev => ({ ...prev, alternate_number: phoneError || undefined }));
    }

    // Validate email
    if (name === 'email') {
      const emailError = validateEmail(value);
      setValidationErrors(prev => ({ ...prev, email: emailError || undefined }));
    }

    // Validate registration number
    if (name === 'registration_number') {
      const regError = validateRegistrationNumber(value);
      setValidationErrors(prev => ({ ...prev, registration_number: regError || undefined }));
    }

    // Validate pincode
    if (name === 'pincode') {
      const pincodeError = validatePincode(value);
      setValidationErrors(prev => ({ ...prev, pincode: pincodeError || undefined }));
    }

    // Validate social links
    if (name === 'github_link') {
      const githubError = validateGitHubLink(value);
      setValidationErrors(prev => ({ ...prev, github_link: githubError || undefined }));
    }

    if (name === 'linkedin_link') {
      const linkedinError = validateLinkedInLink(value);
      setValidationErrors(prev => ({ ...prev, linkedin_link: linkedinError || undefined }));
    }

    if (name === 'portfolio_link') {
      const portfolioError = validatePortfolioLink(value);
      setValidationErrors(prev => ({ ...prev, portfolio_link: portfolioError || undefined }));
    }

    if (name === 'twitter_link') {
      const twitterError = validateTwitterLink(value);
      setValidationErrors(prev => ({ ...prev, twitter_link: twitterError || undefined }));
    }

    // Validate bio
    if (name === 'bio') {
      const bioError = validateBio(value);
      setValidationErrors(prev => ({ ...prev, bio: bioError || undefined }));
    }

    // Validate address
    if (name === 'address') {
      const addressError = validateAddress(value);
      setValidationErrors(prev => ({ ...prev, address: addressError || undefined }));
    }

    // Validate academic fields
    if (name === 'college_school_name') {
      const collegeError = validateAcademicField(value, 'College/School Name');
      setValidationErrors(prev => ({ ...prev, college_school_name: collegeError || undefined }));
    }

    if (name === 'university') {
      const universityError = validateAcademicField(value, 'University');
      setValidationErrors(prev => ({ ...prev, university: universityError || undefined }));
    }

    if (name === 'branch_field') {
      const branchError = validateAcademicField(value, 'Branch/Department');
      setValidationErrors(prev => ({ ...prev, branch_field: branchError || undefined }));
    }

    if (name === 'course_name') {
      const courseError = validateAcademicField(value, 'Course Name');
      setValidationErrors(prev => ({ ...prev, course_name: courseError || undefined }));
    }

    // Handle location cascading dropdowns
    if (name === 'country') {
      const selectedCountry = countries.find(c => c.name === value);
      if (selectedCountry) {
        const countryStates = State.getStatesOfCountry(selectedCountry.isoCode);
        setStates(countryStates);
        setCities([]);
        newFormData.state = '';
        newFormData.city = '';
        newFormData.district_name = '';
        newFormData.pincode = '';
      }
    }

    if (name === 'state') {
      const selectedCountry = countries.find(c => c.name === formData.country);
      const selectedState = states.find(s => s.name === value);
      if (selectedCountry && selectedState) {
        const stateCities = City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
        setCities(stateCities);
        newFormData.city = '';
        newFormData.district_name = '';
        newFormData.pincode = '';
      }
    }

    // Auto-fill district when city is selected
    if (name === 'city' && value) {
      console.log('🏙️ City selected:', value);
      console.log('📍 Auto-filling district with city name');
      newFormData.district_name = value; // Auto-fill district with city name
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔵 Form submitted');
    console.log('📋 Form data:', formData);
    console.log('👤 Student ID:', student?.id);
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Validate all fields before submission
    const contactError = validatePhone(formData.contact_number);
    const alternateError = validatePhone(formData.alternate_number);
    const dobError = validateDateOfBirth(formData.date_of_birth);
    const emailError = validateEmail(formData.email);
    const regError = validateRegistrationNumber(formData.registration_number);
    const pincodeError = validatePincode(formData.pincode);
    const githubError = validateGitHubLink(formData.github_link);
    const linkedinError = validateLinkedInLink(formData.linkedin_link);
    const portfolioError = validatePortfolioLink(formData.portfolio_link);
    const twitterError = validateTwitterLink(formData.twitter_link);
    const bioError = validateBio(formData.bio);
    const addressError = validateAddress(formData.address);
    const collegeError = validateAcademicField(formData.college_school_name, 'College/School Name');
    const universityError = validateAcademicField(formData.university, 'University');
    const branchError = validateAcademicField(formData.branch_field, 'Branch/Department');
    const courseError = validateAcademicField(formData.course_name, 'Course Name');

    console.log('🔍 Validation results:', {
      contactError,
      alternateError,
      dobError,
      emailError,
      regError,
      pincodeError,
      githubError,
      linkedinError,
      portfolioError,
      twitterError,
      bioError,
      addressError,
      collegeError,
      universityError,
      branchError,
      courseError
    });

    const errors = {
      contact_number: contactError || undefined,
      alternate_number: alternateError || undefined,
      date_of_birth: dobError || undefined,
      email: emailError || undefined,
      registration_number: regError || undefined,
      pincode: pincodeError || undefined,
      github_link: githubError || undefined,
      linkedin_link: linkedinError || undefined,
      portfolio_link: portfolioError || undefined,
      twitter_link: twitterError || undefined,
      bio: bioError || undefined,
      address: addressError || undefined,
      college_school_name: collegeError || undefined,
      university: universityError || undefined,
      branch_field: branchError || undefined,
      course_name: courseError || undefined
    };

    setValidationErrors(errors);

    // Check if there are any validation errors
    if (Object.values(errors).some(error => error !== undefined)) {
      console.log('❌ Validation failed, not submitting');
      setError('Please fix the validation errors before submitting');
      setLoading(false);
      return;
    }

    console.log('✅ Validation passed, calling updateStudent...');

    try {
      if (!student?.id) {
        throw new Error('Student ID is required');
      }

      console.log('📤 Calling updateStudent with:', { studentId: student.id, updates: formData });
      const result = await updateStudent(student.id, formData);
      console.log('📥 updateStudent result:', result);
      
      if (result.success) {
        console.log('✅ Update successful');
        setSuccessMessage('Student profile updated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        console.log('❌ Update failed:', result.error);
        setError(result.error || 'Failed to update student');
      }
    } catch (err) {
      console.error('❌ Error updating student:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
      console.log('🔵 Form submission complete');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Edit Student Profile</h3>
              <p className="text-sm text-gray-500 mt-1">
                Update information for <span className="font-medium">{student?.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md flex items-center">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.email
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.email && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.contact_number
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.contact_number && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.contact_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Number
                  </label>
                  <input
                    type="tel"
                    name="alternate_number"
                    value={formData.alternate_number}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.alternate_number
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.alternate_number && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.alternate_number}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.date_of_birth
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.date_of_birth && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.date_of_birth}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Age <span className="text-xs text-gray-500">(Auto-calculated)</span>
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ''}
                    readOnly
                    disabled
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Academic Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    College/School Name
                  </label>
                  <input
                    type="text"
                    name="college_school_name"
                    value={formData.college_school_name}
                    onChange={handleChange}
                    placeholder="e.g., St. Mary's College"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.college_school_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.college_school_name && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.college_school_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    placeholder="e.g., Bangalore University"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.university
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.university && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.university}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Branch/Department
                  </label>
                  <input
                    type="text"
                    name="branch_field"
                    value={formData.branch_field}
                    onChange={handleChange}
                    placeholder="e.g., Computer Science"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.branch_field
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.branch_field && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.branch_field}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Course Name
                  </label>
                  <input
                    type="text"
                    name="course_name"
                    value={formData.course_name}
                    onChange={handleChange}
                    placeholder="e.g., B.Tech"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.course_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.course_name && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.course_name}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    placeholder="e.g., REG-2024-001"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.registration_number
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.registration_number && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.registration_number}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Location</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Country Dropdown with Keyboard Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <div className="relative" ref={countryDropdownRef}>
                    <input
                      type="text"
                      value={countrySearch}
                      onChange={(e) => {
                        handleCountrySearch(e.target.value);
                        setShowCountryDropdown(true);
                      }}
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholder="Search countries..."
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        validationErrors.country
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    
                    {showCountryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCountries.length > 0 ? (
                          filteredCountries.map((country) => (
                            <div
                              key={country.isoCode}
                              onClick={() => {
                                handleChange({ target: { name: 'country', value: country.name } } as any);
                                setShowCountryDropdown(false);
                                setCountrySearch(country.name);
                              }}
                              className="px-3 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <span className="text-gray-900">{country.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            {countrySearch ? `No countries found for "${countrySearch}"` : 'Start typing to search...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.country && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.country}</p>
                  )}
                </div>

                {/* State Dropdown with Keyboard Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <div className="relative" ref={stateDropdownRef}>
                    <input
                      type="text"
                      value={stateSearch}
                      onChange={(e) => {
                        handleStateSearch(e.target.value);
                        setShowStateDropdown(true);
                      }}
                      onFocus={() => formData.country && states.length > 0 && setShowStateDropdown(true)}
                      disabled={!formData.country || states.length === 0}
                      placeholder="Search states..."
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        validationErrors.state
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    
                    {showStateDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredStates.length > 0 ? (
                          filteredStates.map((state) => (
                            <div
                              key={state.isoCode}
                              onClick={() => {
                                handleChange({ target: { name: 'state', value: state.name } } as any);
                                setShowStateDropdown(false);
                                setStateSearch(state.name);
                              }}
                              className="px-3 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <span className="text-gray-900">{state.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            {stateSearch ? `No states found for "${stateSearch}"` : 'Start typing to search...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.state && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.state}</p>
                  )}
                </div>

                {/* City Dropdown with Keyboard Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <div className="relative" ref={cityDropdownRef}>
                    <input
                      type="text"
                      value={citySearch}
                      onChange={(e) => {
                        handleCitySearch(e.target.value);
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => formData.state && cities.length > 0 && setShowCityDropdown(true)}
                      disabled={!formData.state || cities.length === 0}
                      placeholder="Search cities..."
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        validationErrors.city
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    
                    {showCityDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((city) => (
                            <div
                              key={city.name}
                              onClick={() => {
                                handleChange({ target: { name: 'city', value: city.name } } as any);
                                setShowCityDropdown(false);
                                setCitySearch(city.name);
                              }}
                              className="px-3 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <span className="text-gray-900">{city.name}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            {citySearch ? `No cities found for "${citySearch}"` : 'Start typing to search...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.city && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district_name"
                    value={formData.district_name}
                    onChange={handleChange}
                    placeholder="Enter district name"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.district_name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.district_name && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.district_name}</p>
                  )}
                </div>

                {/* Pincode Dropdown with Keyboard Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pincode
                  </label>
                  <div className="relative" ref={pincodeDropdownRef}>
                    <input
                      type="text"
                      value={pincodeSearch}
                      onChange={(e) => {
                        handlePincodeSearch(e.target.value);
                        setShowPincodeDropdown(true);
                      }}
                      onFocus={() => setShowPincodeDropdown(true)}
                      placeholder="Search pincode, city, or district..."
                      className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                        validationErrors.pincode
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300'
                      }`}
                    />
                    
                    {showPincodeDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredPincodes.length > 0 ? (
                          filteredPincodes.map((item, index) => (
                            <div
                              key={`${item.pincode}-${index}`}
                              onClick={() => handlePincodeSelect(item)}
                              className="px-3 py-2 hover:bg-primary-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <span className="font-medium text-gray-900">{item.pincode}</span>
                                  <span className="text-gray-600 ml-2">- {item.name}</span>
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {item.district}, {item.state}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-sm text-gray-500 text-center">
                            {pincodeSearch ? `No pincodes found for "${pincodeSearch}"` : 'Start typing to search...'}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {validationErrors.pincode && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.pincode}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address <span className="text-xs text-gray-500">(Max 200 characters)</span>
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    maxLength={200}
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.address
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.address && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.address}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{formData.address?.length || 0}/200 characters</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">Social Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub
                  </label>
                  <input
                    type="url"
                    name="github_link"
                    value={formData.github_link}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.github_link
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.github_link && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.github_link}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="linkedin_link"
                    value={formData.linkedin_link}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.linkedin_link
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.linkedin_link && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.linkedin_link}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Portfolio
                  </label>
                  <input
                    type="url"
                    name="portfolio_link"
                    value={formData.portfolio_link}
                    onChange={handleChange}
                    placeholder="https://yourportfolio.com"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.portfolio_link
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.portfolio_link && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.portfolio_link}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="twitter_link"
                    value={formData.twitter_link}
                    onChange={handleChange}
                    placeholder="https://twitter.com/username"
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.twitter_link
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.twitter_link && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.twitter_link}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio <span className="text-xs text-gray-500">(Max 500 characters)</span>
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    maxLength={500}
                    placeholder="Brief description about the student..."
                    className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      validationErrors.bio
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {validationErrors.bio && (
                    <p className="text-xs text-red-600 mt-1">{validationErrors.bio}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/500 characters</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors inline-flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStudentModal;

