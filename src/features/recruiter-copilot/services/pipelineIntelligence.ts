import { supabase } from '../../../lib/supabaseClient';

/**
 * Pipeline Intelligence Service
 *
 * Analyzes recruitment pipeline data from pipeline_candidates table
 * Provides insights on:
 * - Candidate progression through stages
 * - Bottlenecks in the hiring process
 * - Stage conversion rates
 * - Time-to-hire metrics
 * - Candidate engagement
 */

export interface PipelineStageMetrics {
  stage: string;
  count: number;
  avg_days_in_stage: number;
  conversion_rate: number;
  drop_off_rate: number;
}

export interface CandidatePipelineStatus {
  candidate_id: string;
  candidate_name: string;
  current_stage: string;
  previous_stage: string | null;
  days_in_current_stage: number;
  days_since_added: number;
  next_action: string | null;
  next_action_date: string | null;
  status: string;
  opportunity_title: string;
  recruiter_rating: number | null;
  risk_level: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface PipelineInsights {
  overview: {
    total_candidates: number;
    active_candidates: number;
    avg_time_to_hire: number;
    overall_conversion_rate: number;
  };
  stage_metrics: PipelineStageMetrics[];
  bottlenecks: Array<{
    stage: string;
    issue: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
  }>;
  at_risk_candidates: CandidatePipelineStatus[];
  success_patterns: string[];
}

class PipelineIntelligenceService {
  /**
   * Get comprehensive pipeline insights
   */
  async getPipelineInsights(recruiterId?: string): Promise<PipelineInsights> {
    try {
      // Build query for recruiter's opportunities
      let opportunitiesQuery = supabase.from('opportunities').select('id');

      if (recruiterId) {
        opportunitiesQuery = opportunitiesQuery.eq('recruiter_id', recruiterId);
      }

      const { data: opportunities } = await opportunitiesQuery;
      const opportunityIds = opportunities?.map((o) => o.id) || [];

      if (opportunityIds.length === 0) {
        return this.getEmptyInsights();
      }

      // Fetch all pipeline candidates
      const { data: pipelineCandidates, error } = await supabase
        .from('pipeline_candidates')
        .select('*')
        .in('opportunity_id', opportunityIds);

      if (error || !pipelineCandidates) {
        console.error('Error fetching pipeline candidates:', error);
        return this.getEmptyInsights();
      }

      // Calculate metrics
      const overview = this.calculateOverview(pipelineCandidates);
      const stage_metrics = this.calculateStageMetrics(pipelineCandidates);
      const bottlenecks = this.identifyBottlenecks(stage_metrics, pipelineCandidates);
      const at_risk_candidates = await this.identifyAtRiskCandidates(pipelineCandidates);
      const success_patterns = this.identifySuccessPatterns(pipelineCandidates);

      return {
        overview,
        stage_metrics,
        bottlenecks,
        at_risk_candidates,
        success_patterns,
      };
    } catch (error) {
      console.error('Error getting pipeline insights:', error);
      return this.getEmptyInsights();
    }
  }

  /**
   * Get pipeline status for specific opportunity
   */
  async getPipelineForOpportunity(opportunityId: number): Promise<CandidatePipelineStatus[]> {
    try {
      const { data: pipelineCandidates, error } = await supabase
        .from('pipeline_candidates')
        .select(
          `
          *,
          opportunities:opportunity_id (
            job_title,
            company_name
          )
        `
        )
        .eq('opportunity_id', opportunityId)
        .order('stage_changed_at', { ascending: false });

      if (error || !pipelineCandidates) {
        console.error('Error fetching pipeline:', error);
        return [];
      }

      return this.enrichPipelineStatus(pipelineCandidates);
    } catch (error) {
      console.error('Error getting opportunity pipeline:', error);
      return [];
    }
  }

  /**
   * Get candidates stuck in a stage
   */
  async getStuckCandidates(
    stage: string,
    daysThreshold: number = 7
  ): Promise<CandidatePipelineStatus[]> {
    try {
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

      const { data: candidates, error } = await supabase
        .from('pipeline_candidates')
        .select(
          `
          *,
          opportunities:opportunity_id (
            job_title,
            company_name
          )
        `
        )
        .eq('stage', stage)
        .eq('status', 'active')
        .lt('stage_changed_at', thresholdDate.toISOString());

      if (error || !candidates) {
        return [];
      }

      return this.enrichPipelineStatus(candidates);
    } catch (error) {
      console.error('Error getting stuck candidates:', error);
      return [];
    }
  }

  /**
   * Get candidates requiring action
   */
  async getCandidatesNeedingAction(): Promise<CandidatePipelineStatus[]> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: candidates, error } = await supabase
        .from('pipeline_candidates')
        .select(
          `
          *,
          opportunities:opportunity_id (
            job_title,
            company_name
          )
        `
        )
        .eq('status', 'active')
        .or(`next_action_date.lte.${today},next_action_date.is.null`)
        .not('next_action', 'is', null);

      if (error || !candidates) {
        return [];
      }

      return this.enrichPipelineStatus(candidates);
    } catch (error) {
      console.error('Error getting candidates needing action:', error);
      return [];
    }
  }

  /**
   * Calculate overview metrics
   */
  private calculateOverview(candidates: any[]): PipelineInsights['overview'] {
    const activeCandidates = candidates.filter((c) => c.status === 'active');
    const hiredCandidates = candidates.filter((c) => c.stage === 'hired');

    // Calculate average time to hire for hired candidates
    let avgTimeToHire = 0;
    if (hiredCandidates.length > 0) {
      const totalDays = hiredCandidates.reduce((sum, c) => {
        const addedDate = new Date(c.added_at);
        const hiredDate = new Date(c.stage_changed_at);
        const days = Math.floor(
          (hiredDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0);
      avgTimeToHire = Math.round(totalDays / hiredCandidates.length);
    }

    const conversionRate =
      candidates.length > 0 ? (hiredCandidates.length / candidates.length) * 100 : 0;

    return {
      total_candidates: candidates.length,
      active_candidates: activeCandidates.length,
      avg_time_to_hire: avgTimeToHire,
      overall_conversion_rate: Math.round(conversionRate * 10) / 10,
    };
  }

  /**
   * Calculate metrics per stage
   */
  private calculateStageMetrics(candidates: any[]): PipelineStageMetrics[] {
    const stages = ['sourced', 'screening', 'interview', 'assessment', 'offer', 'hired'];
    const metrics: PipelineStageMetrics[] = [];

    stages.forEach((stage, idx) => {
      const candidatesInStage = candidates.filter((c) => c.stage === stage);
      const count = candidatesInStage.length;

      // Calculate avg days in stage
      let avgDaysInStage = 0;
      if (count > 0) {
        const totalDays = candidatesInStage.reduce((sum, c) => {
          const stageDate = new Date(c.stage_changed_at);
          const now = new Date();
          const days = Math.floor((now.getTime() - stageDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        avgDaysInStage = Math.round(totalDays / count);
      }

      // Calculate conversion rate (to next stage)
      let conversionRate = 0;
      if (idx < stages.length - 1) {
        const candidatesMoved = candidates.filter(
          (c) => c.previous_stage === stage && stages.indexOf(c.stage) > idx
        );
        conversionRate = count > 0 ? (candidatesMoved.length / count) * 100 : 0;
      }

      // Calculate drop-off rate
      const droppedOff = candidates.filter((c) => c.stage === stage && c.status !== 'active');
      const dropOffRate = count > 0 ? (droppedOff.length / count) * 100 : 0;

      metrics.push({
        stage,
        count,
        avg_days_in_stage: avgDaysInStage,
        conversion_rate: Math.round(conversionRate * 10) / 10,
        drop_off_rate: Math.round(dropOffRate * 10) / 10,
      });
    });

    return metrics;
  }

  /**
   * Identify bottlenecks in the pipeline
   */
  private identifyBottlenecks(
    stageMetrics: PipelineStageMetrics[],
    candidates: any[]
  ): PipelineInsights['bottlenecks'] {
    const bottlenecks: PipelineInsights['bottlenecks'] = [];

    stageMetrics.forEach((metric) => {
      // High time in stage
      if (metric.avg_days_in_stage > 10 && metric.count > 3) {
        bottlenecks.push({
          stage: metric.stage,
          issue: `Candidates spending average ${metric.avg_days_in_stage} days in ${metric.stage}`,
          impact: metric.count > 10 ? 'high' : 'medium',
          recommendation: `Review ${metric.stage} process to reduce time. Consider automating or streamlining steps.`,
        });
      }

      // Low conversion rate
      if (metric.conversion_rate < 30 && metric.count > 5) {
        bottlenecks.push({
          stage: metric.stage,
          issue: `Low conversion rate from ${metric.stage} (${metric.conversion_rate}%)`,
          impact: 'high',
          recommendation: `Improve candidate quality at ${metric.stage} or adjust evaluation criteria.`,
        });
      }

      // High drop-off rate
      if (metric.drop_off_rate > 40 && metric.count > 3) {
        bottlenecks.push({
          stage: metric.stage,
          issue: `High candidate drop-off at ${metric.stage} (${metric.drop_off_rate}%)`,
          impact: 'high',
          recommendation: `Investigate why candidates are leaving at ${metric.stage}. Consider improving communication or offer competitiveness.`,
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Identify at-risk candidates
   */
  private async identifyAtRiskCandidates(candidates: any[]): Promise<CandidatePipelineStatus[]> {
    const activeCandidates = candidates.filter((c) => c.status === 'active');
    const atRisk: any[] = [];

    const now = new Date();

    activeCandidates.forEach((candidate) => {
      const stageChangedDate = new Date(candidate.stage_changed_at);
      const daysInStage = Math.floor(
        (now.getTime() - stageChangedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Candidate is at risk if:
      // 1. Been in stage > 14 days
      // 2. Has overdue action item
      // 3. Low recruiter rating

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      let recommendation = 'Monitor progress';

      if (daysInStage > 14) {
        riskLevel = 'high';
        recommendation = `Urgent: Candidate has been in ${candidate.stage} for ${daysInStage} days. Take immediate action.`;
      } else if (daysInStage > 7) {
        riskLevel = 'medium';
        recommendation = `Follow up soon: ${daysInStage} days in ${candidate.stage}.`;
      }

      if (candidate.next_action_date) {
        const actionDate = new Date(candidate.next_action_date);
        if (actionDate < now) {
          riskLevel = 'high';
          recommendation = `Overdue action: "${candidate.next_action}" was due ${Math.floor((now.getTime() - actionDate.getTime()) / (1000 * 60 * 60 * 24))} days ago.`;
        }
      }

      if (candidate.recruiter_rating && candidate.recruiter_rating <= 2) {
        riskLevel = riskLevel === 'high' ? 'high' : 'medium';
        recommendation += ' Low recruiter rating - may not be strong fit.';
      }

      if (riskLevel !== 'low') {
        atRisk.push({
          ...candidate,
          risk_level: riskLevel,
          recommendation,
          days_in_stage: daysInStage,
        });
      }
    });

    return this.enrichPipelineStatus(atRisk);
  }

  /**
   * Identify success patterns
   */
  private identifySuccessPatterns(candidates: any[]): string[] {
    const patterns: string[] = [];
    const hiredCandidates = candidates.filter((c) => c.stage === 'hired');

    if (hiredCandidates.length === 0) return patterns;

    // Analyze common traits
    const avgRating =
      hiredCandidates.reduce((sum, c) => sum + (c.recruiter_rating || 0), 0) /
      hiredCandidates.length;
    if (avgRating > 4) {
      patterns.push(
        `Hired candidates typically have high recruiter ratings (avg ${avgRating.toFixed(1)}/5)`
      );
    }

    // Analyze source
    const sources = hiredCandidates.map((c) => c.source).filter(Boolean);
    if (sources.length > 0) {
      const sourceCount = new Map<string, number>();
      sources.forEach((s) => sourceCount.set(s, (sourceCount.get(s) || 0) + 1));
      const topSource = Array.from(sourceCount.entries()).sort((a, b) => b[1] - a[1])[0];
      if (topSource && topSource[1] > hiredCandidates.length * 0.3) {
        patterns.push(
          `${topSource[0]} has been the most successful source (${topSource[1]} hires)`
        );
      }
    }

    // Analyze time to hire
    const fastHires = hiredCandidates.filter((c) => {
      const addedDate = new Date(c.added_at);
      const hiredDate = new Date(c.stage_changed_at);
      const days = Math.floor((hiredDate.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
      return days <= 14;
    });

    if (fastHires.length > hiredCandidates.length * 0.5) {
      patterns.push('Fast-tracked candidates (< 14 days) have high success rate');
    }

    return patterns;
  }

  /**
   * Enrich pipeline status with computed fields
   */
  private enrichPipelineStatus(candidates: any[]): CandidatePipelineStatus[] {
    const now = new Date();

    return candidates.map((c) => {
      const stageChangedDate = new Date(c.stage_changed_at);
      const addedDate = new Date(c.added_at);

      const daysInCurrentStage = Math.floor(
        (now.getTime() - stageChangedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysSinceAdded = Math.floor(
        (now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (daysInCurrentStage > 14 || (c.next_action_date && new Date(c.next_action_date) < now)) {
        riskLevel = 'high';
      } else if (daysInCurrentStage > 7) {
        riskLevel = 'medium';
      }

      const recommendation = this.generateRecommendation(c, daysInCurrentStage);

      return {
        candidate_id: c.student_id,
        candidate_name: c.candidate_name,
        current_stage: c.stage,
        previous_stage: c.previous_stage,
        days_in_current_stage: daysInCurrentStage,
        days_since_added: daysSinceAdded,
        next_action: c.next_action,
        next_action_date: c.next_action_date,
        status: c.status,
        opportunity_title: c.opportunities?.job_title || 'Unknown',
        recruiter_rating: c.recruiter_rating,
        risk_level: riskLevel,
        recommendation,
      };
    });
  }

  /**
   * Generate recommendation for candidate
   */
  private generateRecommendation(candidate: any, daysInStage: number): string {
    if (candidate.status !== 'active') {
      return `Candidate is ${candidate.status}`;
    }

    if (daysInStage > 14) {
      return `🚨 Urgent: Move forward or close out. ${daysInStage} days in ${candidate.stage}.`;
    }

    if (daysInStage > 7) {
      return `⚠️ Action needed: Follow up on ${candidate.stage} stage progress.`;
    }

    if (candidate.next_action) {
      const actionDate = candidate.next_action_date ? new Date(candidate.next_action_date) : null;
      if (actionDate && actionDate < new Date()) {
        return `⏰ Overdue: "${candidate.next_action}" needs attention.`;
      }
      return `📋 Upcoming: ${candidate.next_action}`;
    }

    if (candidate.recruiter_rating >= 4) {
      return `⭐ High-potential candidate - prioritize moving forward.`;
    }

    return `✅ On track - continue normal process.`;
  }

  /**
   * Get empty insights structure
   */
  private getEmptyInsights(): PipelineInsights {
    return {
      overview: {
        total_candidates: 0,
        active_candidates: 0,
        avg_time_to_hire: 0,
        overall_conversion_rate: 0,
      },
      stage_metrics: [],
      bottlenecks: [],
      at_risk_candidates: [],
      success_patterns: [],
    };
  }
}

export const pipelineIntelligence = new PipelineIntelligenceService();
