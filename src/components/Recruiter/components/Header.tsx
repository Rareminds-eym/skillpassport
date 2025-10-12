import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  BellIcon, 
  UserCircleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { savedSearches } from '../../../data/sampleData'
import { HeaderProps } from '../../../types/recruiter'
import { useAuth } from '../../../context/AuthContext'

const Header: React.FC<HeaderProps> = ({ onMenuToggle, showMobileMenu }) => {
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [showSavedSearches, setShowSavedSearches] = useState<boolean>(false)
  const { user } = useAuth()

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and mobile menu */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {showMobileMenu ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
            
            {/* Logo */}
            <div className="flex-shrink-0 ml-2 md:ml-0">
              <img
                src="/RareMinds ISO Logo-01.png"
                alt="RareMinds Logo"
                className="h-12 w-auto"
              />
            </div>
          </div>

          {/* Center - Search */}
          <div className="flex-1 max-w-2xl mx-4 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSavedSearches(true)}
                onBlur={() => setTimeout(() => setShowSavedSearches(false), 200)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                placeholder="Search candidates, skills, locations..."
              />
            </div>
            
            {/* Saved searches dropdown */}
            {showSavedSearches && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white shadow-lg border border-gray-200 rounded-lg z-50">
                <div className="p-3">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Saved Searches
                  </p>
                  <div className="space-y-1">
                    {savedSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(search)
                          setShowSavedSearches(false)
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button className="flex items-center space-x-3 text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-gray-700 font-medium">{user?.name || "Recruiter"}</span>
                  <span className="text-xs text-gray-500">{user?.email}</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header