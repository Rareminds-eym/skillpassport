/**
 * Helper utility functions
 */

import { corsHeaders } from '../constants';

/**
 * Create a JSON response with CORS headers
 */
export function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * Generate a random password
 */
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Split a full name into first and last name
 */
export function splitName(fullName: string): { firstName: string; lastName: string } {
  const nameParts = fullName.trim().split(' ');
  const firstName = capitalizeFirstLetter(nameParts[0] || fullName);
  const lastName = capitalizeFirstLetter(nameParts.slice(1).join(' ') || '');
  return { firstName, lastName };
}

/**
 * Capitalize the first letter of a name
 */
export function capitalizeFirstLetter(name: string): string {
  if (!name || typeof name !== 'string') return '';
  return name.trim().charAt(0).toUpperCase() + name.trim().slice(1).toLowerCase();
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  return today.getFullYear() - birthDate.getFullYear();
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
