/**
 * GET /api/opportunities/facets
 *
 * Returns distinct filter values and counts actually present in active, open opportunities
 * so the learner filter UI shows options with dynamic counts matching real data.
 *
 * Response shape:
 *   {
 *     success: true,
 *     data: {
 *       departments: string[],
 *       experienceLevels: string[],
 *       counts: {
 *         employmentType: Record<string, number>,
 *         experienceLevel: Record<string, number>,
 *         mode: Record<string, number>,
 *         department: Record<string, number>,
 *         skills: Record<string, number>
 *       }
 *     }
 *   }
 */
import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiDbError, apiSuccess } from '../../lib/response';
import { stringSkills } from '../../lib/job-recommendations';

export const onRequestGet = withAuth(async (context) => {
  const db = getServiceClient(context.env);

  // Fetch active, non-expired, non-factory-visit jobs
  const { data: rows, error } = await db
    .from('opportunities')
    .select('employment_type, experience_level, mode, department, skills_required, location')
    .eq('is_active', true)
    .eq('status', 'open')
    .neq('employment_type', 'factory_visit')
    .or(`deadline.is.null,deadline.gt.${new Date().toISOString()}`);

  if (error) return apiDbError(error, context.request);

  const jobRows = rows || [];

  // 1. Employment Type counts
  const employmentTypeCounts: Record<string, number> = {};
  const canonicalEmploymentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary',
  ];
  canonicalEmploymentTypes.forEach((t) => {
    employmentTypeCounts[t] = 0;
  });

  // 2. Experience Level counts
  const experienceLevelCounts: Record<string, number> = {};

  // 3. Work Mode counts
  const modeCounts: Record<string, number> = {
    'On-site': 0,
    Remote: 0,
    Hybrid: 0,
  };

  // 4. Department counts
  const departmentCounts: Record<string, number> = {};

  // 5. Skills counts
  const skillsCounts: Record<string, number> = {};

  // 6. Location counts
  const locationCounts: Record<string, number> = {};

  for (const job of jobRows) {
    // Employment Type
    const rawEmp = (job.employment_type || '').trim();
    if (rawEmp) {
      const matched = canonicalEmploymentTypes.find(
        (c) => c.toLowerCase() === rawEmp.toLowerCase(),
      );
      const key = matched || rawEmp;
      employmentTypeCounts[key] = (employmentTypeCounts[key] || 0) + 1;
    }

    // Experience Level
    const rawExp = (job.experience_level || '').trim();
    if (rawExp) {
      experienceLevelCounts[rawExp] = (experienceLevelCounts[rawExp] || 0) + 1;
    }

    // Work Mode
    const rawMode = (job.mode || '').trim().toLowerCase();
    if (rawMode) {
      if (rawMode.includes('on-site') || rawMode.includes('onsite') || rawMode.includes('on site')) {
        modeCounts['On-site'] = (modeCounts['On-site'] || 0) + 1;
      } else if (rawMode.includes('remote')) {
        modeCounts['Remote'] = (modeCounts['Remote'] || 0) + 1;
      } else if (rawMode.includes('hybrid')) {
        modeCounts['Hybrid'] = (modeCounts['Hybrid'] || 0) + 1;
      } else {
        const capitalized = rawMode.charAt(0).toUpperCase() + rawMode.slice(1);
        modeCounts[capitalized] = (modeCounts[capitalized] || 0) + 1;
      }
    }

    // Department
    const rawDept = (job.department || '').trim();
    if (rawDept) {
      departmentCounts[rawDept] = (departmentCounts[rawDept] || 0) + 1;
    }

    // Location
    const rawLoc = (job.location || '').trim();
    if (rawLoc) {
      const primaryLoc = rawLoc.split(',')[0].trim();
      if (primaryLoc) {
        const formattedLoc = primaryLoc
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
        locationCounts[formattedLoc] = (locationCounts[formattedLoc] || 0) + 1;
      }
    }

    // Skills
    const skills = stringSkills(job.skills_required);
    for (const skill of skills) {
      const cleanSkill = skill.trim();
      if (cleanSkill) {
        skillsCounts[cleanSkill] = (skillsCounts[cleanSkill] || 0) + 1;
      }
    }
  }

  const departments = Object.keys(departmentCounts).sort();
  const experienceLevels = Object.keys(experienceLevelCounts).sort();
  const locations = Object.keys(locationCounts).sort();

  const response = apiSuccess(
    {
      departments,
      experienceLevels,
      locations,
      counts: {
        employmentType: employmentTypeCounts,
        experienceLevel: experienceLevelCounts,
        mode: modeCounts,
        department: departmentCounts,
        skills: skillsCounts,
        location: locationCounts,
      },
    },
    context.request,
  );

  // Short cache: 3 minutes
  response.headers.set('Cache-Control', 'private, max-age=180');
  return response;
});
