/**
 * Helper utilities for User API
 */

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
  const lastName = nameParts.length > 1 ? capitalizeFirstLetter(nameParts.slice(1).join(' ')) : '';
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
  if (isNaN(birthDate.getTime())) return null;
  
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if email exists in Supabase Auth
 */
export async function checkEmailExists(supabase: any, email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error listing users:', error);
      return false;
    }
    
    return data.users.some((user: any) => user.email === email.toLowerCase());
  } catch (error) {
    console.error('Check email exists error:', error);
    return false;
  }
}

/**
 * Delete auth user (for rollback on error)
 */
export async function deleteAuthUser(supabase: any, userId: string): Promise<void> {
  try {
    await supabase.auth.admin.deleteUser(userId);
  } catch (error) {
    console.error('Failed to delete auth user:', error);
  }
}
