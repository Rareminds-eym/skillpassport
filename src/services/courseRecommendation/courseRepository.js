/**
 * Course Repository
 * Handles all database operations for fetching courses.
 */

import { supabase } from '../../lib/supabaseClient';
import { parseEmbedding } from './utils';

/**
 * Fetch all active courses with embeddings from the database.
 * Only returns courses that have embeddings and are active.
 * 
 * @returns {Promise<Array>} - Array of courses with embeddings
 * 
 * Requirements: 3.3
 */
export const fetchCoursesWithEmbeddings = async () => {
  try {
    // Fetch active courses with embeddings
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status,
        embedding
      `)
      .eq('status', 'Active')
      .not('embedding', 'is', null)
      .is('deleted_at', null);

    if (error) {
      console.error('Failed to fetch courses with embeddings:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    // Fetch skills for each course
    const courseIds = courses.map(c => c.course_id);
    const { data: skillsData, error: skillsError } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    if (skillsError) {
      console.warn('Failed to fetch course skills:', skillsError.message);
    }

    // Group skills by course_id
    const skillsByCourse = {};
    if (skillsData) {
      skillsData.forEach(s => {
        if (!skillsByCourse[s.course_id]) {
          skillsByCourse[s.course_id] = [];
        }
        skillsByCourse[s.course_id].push(s.skill_name);
      });
    }

    // Combine courses with their skills and parse embeddings
    return courses.map(course => ({
      ...course,
      skills: skillsByCourse[course.course_id] || [],
      embedding: parseEmbedding(course.embedding)
    }));
  } catch (error) {
    console.error('Error fetching courses with embeddings:', error);
    throw error;
  }
};

/**
 * Fetch courses by skill type (technical or soft) with embeddings.
 * 
 * @param {string} skillType - 'technical' or 'soft'
 * @returns {Promise<Array>} - Array of courses with embeddings
 */
export const fetchCoursesBySkillType = async (skillType) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status,
        skill_type,
        embedding
      `)
      .eq('status', 'Active')
      .eq('skill_type', skillType)
      .not('embedding', 'is', null)
      .is('deleted_at', null);

    if (error) {
      console.error(`Failed to fetch ${skillType} courses:`, error.message);
      return [];
    }

    if (!courses || courses.length === 0) {
      return [];
    }

    // Fetch skills for each course
    const courseIds = courses.map(c => c.course_id);
    const { data: skillsData } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    // Group skills by course_id
    const skillsByCourse = {};
    if (skillsData) {
      skillsData.forEach(s => {
        if (!skillsByCourse[s.course_id]) {
          skillsByCourse[s.course_id] = [];
        }
        skillsByCourse[s.course_id].push(s.skill_name);
      });
    }

    return courses.map(course => ({
      ...course,
      skills: skillsByCourse[course.course_id] || [],
      embedding: parseEmbedding(course.embedding)
    }));
  } catch (error) {
    console.error(`Error fetching ${skillType} courses:`, error);
    return [];
  }
};

/**
 * Fetch basic course info without embeddings (for fallback).
 * 
 * @param {number} limit - Maximum courses to return
 * @returns {Promise<Array>} - Array of courses
 */
export const fetchBasicCourses = async (limit = 10) => {
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status
      `)
      .eq('status', 'Active')
      .is('deleted_at', null)
      .limit(limit);

    if (error || !courses) {
      console.error('Failed to fetch basic courses:', error?.message);
      return [];
    }

    // Fetch skills for courses
    const courseIds = courses.map(c => c.course_id);
    const { data: skillsData } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    // Group skills by course
    const skillsByCourse = {};
    (skillsData || []).forEach(s => {
      if (!skillsByCourse[s.course_id]) {
        skillsByCourse[s.course_id] = [];
      }
      skillsByCourse[s.course_id].push(s.skill_name);
    });

    return courses.map(course => ({
      ...course,
      skills: skillsByCourse[course.course_id] || []
    }));
  } catch (error) {
    console.error('Error fetching basic courses:', error);
    return [];
  }
};

/**
 * Fetch courses that match a skill name via course_skills table.
 * 
 * @param {string} skillName - The skill name to search for
 * @returns {Promise<Array>} - Array of matching courses with details
 */
export const fetchCoursesBySkillName = async (skillName) => {
  try {
    const skillLower = skillName.toLowerCase();
    
    // Query course_skills table for matching skills
    const { data: skillMatches, error: skillError } = await supabase
      .from('course_skills')
      .select('course_id, skill_name, proficiency_level')
      .ilike('skill_name', `%${skillLower}%`);

    if (skillError) {
      console.warn('Error querying course_skills:', skillError.message);
      return [];
    }

    if (!skillMatches || skillMatches.length === 0) {
      return [];
    }

    // Get unique course IDs
    const courseIds = [...new Set(skillMatches.map(s => s.course_id))];

    // Fetch course details for matching courses
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        course_id,
        title,
        code,
        description,
        duration,
        category,
        target_outcomes,
        status
      `)
      .in('course_id', courseIds)
      .eq('status', 'Active')
      .is('deleted_at', null);

    if (coursesError || !courses) {
      console.warn('Error fetching courses for skill matches:', coursesError?.message);
      return [];
    }

    // Fetch all skills for these courses
    const { data: allSkills } = await supabase
      .from('course_skills')
      .select('course_id, skill_name')
      .in('course_id', courseIds);

    // Group skills by course
    const skillsByCourse = {};
    (allSkills || []).forEach(s => {
      if (!skillsByCourse[s.course_id]) {
        skillsByCourse[s.course_id] = [];
      }
      skillsByCourse[s.course_id].push(s.skill_name);
    });

    // Return courses with skill match info
    return courses.map(course => {
      const matchedSkill = skillMatches.find(s => s.course_id === course.course_id);
      const courseSkills = skillsByCourse[course.course_id] || [];
      
      // Calculate match strength
      const exactMatch = courseSkills.some(s => s.toLowerCase() === skillLower);
      const partialMatch = courseSkills.some(s => 
        s.toLowerCase().includes(skillLower) || skillLower.includes(s.toLowerCase())
      );
      
      return {
        ...course,
        skills: courseSkills,
        match_type: 'direct',
        match_strength: exactMatch ? 1.0 : (partialMatch ? 0.8 : 0.6),
        matched_skill: matchedSkill?.skill_name,
        proficiency_level: matchedSkill?.proficiency_level
      };
    });
  } catch (error) {
    console.error('Error in fetchCoursesBySkillName:', error);
    return [];
  }
};
