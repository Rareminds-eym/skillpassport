import { describe, it, expect, vi } from 'vitest';
import { getRouteForRole, redirectToRoleDashboard, isValidRouteForRole } from '../roleBasedRouter';
import { UserRole } from '../../services/unifiedAuthService';

describe('roleBasedRouter', () => {
  describe('getRouteForRole', () => {
    it('should return correct route for student role', () => {
      const route = getRouteForRole('student');
      expect(route).toBe('/student/dashboard');
    });

    it('should return correct route for recruiter role', () => {
      const route = getRouteForRole('recruiter');
      expect(route).toBe('/recruitment/overview');
    });

    it('should return correct route for educator role', () => {
      const route = getRouteForRole('educator');
      expect(route).toBe('/educator/dashboard');
    });

    it('should return correct route for school_admin role', () => {
      const route = getRouteForRole('school_admin');
      expect(route).toBe('/school-admin/dashboard');
    });

    it('should return correct route for college_admin role', () => {
      const route = getRouteForRole('college_admin');
      expect(route).toBe('/college-admin/dashboard');
    });

    it('should return correct route for university_admin role', () => {
      const route = getRouteForRole('university_admin');
      expect(route).toBe('/university-admin/dashboard');
    });

    it('should return all routes starting with /', () => {
      const roles: UserRole[] = [
        'student',
        'recruiter',
        'educator',
        'school_admin',
        'college_admin',
        'university_admin'
      ];

      roles.forEach(role => {
        const route = getRouteForRole(role);
        expect(route.startsWith('/')).toBe(true);
      });
    });

    it('should return valid route string for any role', () => {
      const roles: UserRole[] = [
        'student',
        'recruiter',
        'educator',
        'school_admin',
        'college_admin',
        'university_admin'
      ];

      roles.forEach(role => {
        const route = getRouteForRole(role);
        expect(typeof route).toBe('string');
        expect(route.length).toBeGreaterThan(0);
      });
    });
  });

  describe('redirectToRoleDashboard', () => {
    it('should call navigate with correct route and replace option', () => {
      const mockNavigate = vi.fn();
      
      redirectToRoleDashboard('student', mockNavigate);
      
      expect(mockNavigate).toHaveBeenCalledWith('/student/dashboard', { replace: true });
    });

    it('should call navigate for all role types', () => {
      const roles: UserRole[] = [
        'student',
        'recruiter',
        'educator',
        'school_admin',
        'college_admin',
        'university_admin'
      ];

      roles.forEach(role => {
        const mockNavigate = vi.fn();
        redirectToRoleDashboard(role, mockNavigate);
        expect(mockNavigate).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/'),
          { replace: true }
        );
      });
    });
  });

  describe('isValidRouteForRole', () => {
    it('should return true for valid student routes', () => {
      expect(isValidRouteForRole('student', '/student/dashboard')).toBe(true);
      expect(isValidRouteForRole('student', '/student/profile')).toBe(true);
    });

    it('should return false for invalid student routes', () => {
      expect(isValidRouteForRole('student', '/recruiter/overview')).toBe(false);
      expect(isValidRouteForRole('student', '/educator/dashboard')).toBe(false);
    });

    it('should return true for valid recruiter routes', () => {
      expect(isValidRouteForRole('recruiter', '/recruitment/overview')).toBe(true);
      expect(isValidRouteForRole('recruiter', '/recruitment/pipelines')).toBe(true);
    });

    it('should return false for invalid recruiter routes', () => {
      expect(isValidRouteForRole('recruiter', '/student/dashboard')).toBe(false);
    });

    it('should return true for valid educator routes', () => {
      expect(isValidRouteForRole('educator', '/educator/dashboard')).toBe(true);
      expect(isValidRouteForRole('educator', '/educator/students')).toBe(true);
    });

    it('should return true for valid admin routes', () => {
      expect(isValidRouteForRole('school_admin', '/school-admin/dashboard')).toBe(true);
      expect(isValidRouteForRole('college_admin', '/college-admin/dashboard')).toBe(true);
      expect(isValidRouteForRole('university_admin', '/university-admin/dashboard')).toBe(true);
    });
  });
});
