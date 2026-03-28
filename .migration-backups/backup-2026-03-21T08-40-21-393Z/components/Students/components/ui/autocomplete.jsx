import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { ChevronDown, Search } from "lucide-react";

export const AutocompleteInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
  required = false,
  searchFunction,
  displayField = "name",
  minChars = 2,
  debounceMs = 300,
  maxResults = 10,
  ...props
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const debounceRef = useRef(null);

  // Update search term when value prop changes
  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Debounced search function
  const debouncedSearch = async (term) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (term.length >= minChars && searchFunction) {
        setIsLoading(true);
        try {
          const results = await searchFunction(term);
          setSuggestions(results.slice(0, maxResults));
          setIsOpen(true);
        } catch (error) {
          console.error("Search error:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, debounceMs);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(e); // Call parent onChange
    debouncedSearch(newValue);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    const displayValue = typeof suggestion === 'string' ? suggestion : suggestion[displayField];
    setSearchTerm(displayValue);
    setIsOpen(false);
    setSuggestions([]);
    
    // Create synthetic event for parent onChange
    const syntheticEvent = {
      target: {
        value: displayValue,
        name: id,
        id: id
      },
      preventDefault: () => {},
      stopPropagation: () => {}
    };
    
    // Call onChange immediately
    onChange(syntheticEvent);
  };

  // Handle input focus
  const handleFocus = () => {
    if (searchTerm.length >= minChars) {
      debouncedSearch(searchTerm);
    }
  };

  // Handle input blur (with delay to allow clicking suggestions)
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      {label && (
        <Label htmlFor={id}>
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          id={id}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`${className} pr-8`}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (suggestions.length > 0 || isLoading) && (
        <div
          ref={dropdownRef}
          className="absolute z-[60] w-full mt-2 bg-white border border-gray-300 rounded-xl shadow-xl max-h-64 overflow-auto"
          style={{ 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
          }}
        >
          {isLoading && (
            <div className="px-4 py-4 text-sm text-gray-600 flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
              <span className="font-medium">Searching institutions...</span>
            </div>
          )}
          
          {!isLoading && suggestions.length === 0 && searchTerm.length >= minChars && (
            <div className="px-4 py-6 text-center">
              <div className="text-gray-400 mb-2">
                <Search className="w-8 h-8 mx-auto" />
              </div>
              <div className="text-sm text-gray-600 font-medium">No institutions found</div>
              <div className="text-xs text-gray-500 mt-1">Try a different search term</div>
            </div>
          )}

          {!isLoading && suggestions.map((suggestion, index) => {
            const displayValue = typeof suggestion === 'string' ? suggestion : suggestion[displayField];
            const location = suggestion.city && suggestion.state 
              ? `${suggestion.city}, ${suggestion.state}` 
              : suggestion.state || suggestion.district || '';
            const institutionType = suggestion.type || '';
            
            return (
              <div
                key={index}
                className="px-4 py-3 cursor-pointer hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 group"
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur on click
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 group-hover:text-blue-900 truncate">
                      {displayValue}
                    </div>
                    {location && (
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{location}</span>
                      </div>
                    )}
                  </div>
                  {institutionType && (
                    <span className={`text-xs px-2.5 py-1 rounded-full ml-3 font-medium flex-shrink-0 ${
                      institutionType === 'University' 
                        ? 'bg-purple-100 text-purple-700' 
                        : institutionType === 'College'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {institutionType}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};