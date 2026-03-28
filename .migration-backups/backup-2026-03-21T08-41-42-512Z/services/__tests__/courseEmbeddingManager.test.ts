/**
 * Unit tests for Course Embedding Manager
 * Tests the buildCourseText function and basic functionality
 * 
 * Feature: rag-course-recommendations
 * Requirements: 1.1, 1.4, 1.5
 */

import { describe, it, expect } from 'vitest';
import { buildCourseText } from '../courseEmbeddingManager';

describe('Course Embedding Manager', () => {
  describe('buildCourseText', () => {
    it('should build text with title only', () => {
      const course = { title: 'Introduction to JavaScript' };
      const result = buildCourseText(course);
      
      expect(result).toBe('Title: Introduction to JavaScript');
    });

    it('should build text with title and description', () => {
      const course = {
        title: 'Introduction to JavaScript',
        description: 'Learn the basics of JavaScript programming'
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Title: Introduction to JavaScript');
      expect(result).toContain('Description: Learn the basics of JavaScript programming');
    });

    it('should build text with skills array', () => {
      const course = {
        title: 'Web Development',
        skills: ['HTML', 'CSS', 'JavaScript']
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Title: Web Development');
      expect(result).toContain('Skills: HTML, CSS, JavaScript');
    });

    it('should build text with skillsCovered array (frontend format)', () => {
      const course = {
        title: 'Web Development',
        skillsCovered: ['React', 'TypeScript']
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Skills: React, TypeScript');
    });

    it('should build text with target_outcomes array', () => {
      const course = {
        title: 'Data Science',
        target_outcomes: ['Analyze data', 'Build ML models']
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Title: Data Science');
      expect(result).toContain('Target Outcomes: Analyze data; Build ML models');
    });

    it('should build text with targetOutcomes array (frontend format)', () => {
      const course = {
        title: 'Data Science',
        targetOutcomes: ['Analyze data', 'Build ML models']
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Target Outcomes: Analyze data; Build ML models');
    });

    it('should build complete text with all fields', () => {
      const course = {
        title: 'Full Stack Development',
        description: 'Comprehensive web development course',
        skills: ['Node.js', 'React', 'PostgreSQL'],
        target_outcomes: ['Build web apps', 'Deploy to cloud']
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Title: Full Stack Development');
      expect(result).toContain('Description: Comprehensive web development course');
      expect(result).toContain('Skills: Node.js, React, PostgreSQL');
      expect(result).toContain('Target Outcomes: Build web apps; Deploy to cloud');
    });

    it('should throw error for course without title', () => {
      expect(() => buildCourseText({})).toThrow('Course must have a title');
      expect(() => buildCourseText(null)).toThrow('Course must have a title');
      expect(() => buildCourseText(undefined)).toThrow('Course must have a title');
    });

    it('should handle empty arrays gracefully', () => {
      const course = {
        title: 'Test Course',
        skills: [],
        target_outcomes: []
      };
      const result = buildCourseText(course);
      
      expect(result).toBe('Title: Test Course');
      expect(result).not.toContain('Skills:');
      expect(result).not.toContain('Target Outcomes:');
    });

    it('should filter out empty strings from skills', () => {
      const course = {
        title: 'Test Course',
        skills: ['JavaScript', '', '  ', 'Python']
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Skills: JavaScript, Python');
    });

    it('should trim whitespace from description', () => {
      const course = {
        title: 'Test Course',
        description: '  Some description with whitespace  '
      };
      const result = buildCourseText(course);
      
      expect(result).toContain('Description: Some description with whitespace');
    });
  });
});
