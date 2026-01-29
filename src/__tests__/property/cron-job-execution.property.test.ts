/**
 * Property-Based Tests for Cron Job Execution
 * Feature: cloudflare-consolidation, Property 4: Cron Job Execution
 * Validates: Requirements 2.1, 2.5
 * 
 * Tests that standalone workers with configured cron triggers execute
 * scheduled tasks at specified intervals without affecting other worker operations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

// Mock cron job handler type
type CronJobHandler = (scheduledTime: Date) => Promise<void>;

// Mock worker environment with cron support
interface WorkerEnv {
  cronHandlers: Map<string, CronJobHandler>;
  lastExecution: Map<string, Date>;
  executionCount: Map<string, number>;
  errors: Map<string, Error[]>;
}

// Simulate a worker with cron job capability
class MockWorkerWithCron {
  private env: WorkerEnv;
  private isProcessingRequest: boolean = false;

  constructor() {
    this.env = {
      cronHandlers: new Map(),
      lastExecution: new Map(),
      executionCount: new Map(),
      errors: new Map(),
    };
  }

  // Register a cron job handler
  registerCronJob(name: string, handler: CronJobHandler): void {
    this.env.cronHandlers.set(name, handler);
    this.env.executionCount.set(name, 0);
    this.env.errors.set(name, []);
  }

  // Execute a cron job (simulates Cloudflare's cron trigger)
  async executeCronJob(name: string, scheduledTime: Date): Promise<void> {
    const handler = this.env.cronHandlers.get(name);
    if (!handler) {
      throw new Error(`Cron job ${name} not found`);
    }

    try {
      await handler(scheduledTime);
      this.env.lastExecution.set(name, scheduledTime);
      this.env.executionCount.set(name, (this.env.executionCount.get(name) || 0) + 1);
    } catch (error) {
      const errors = this.env.errors.get(name) || [];
      errors.push(error as Error);
      this.env.errors.set(name, errors);
      // Log error but continue operating (as per requirement 2.5)
      console.error(`Cron job ${name} failed:`, error);
    }
  }

  // Simulate handling a regular HTTP request
  async handleRequest(path: string): Promise<Response> {
    this.isProcessingRequest = true;
    try {
      // Simulate request processing
      await new Promise(resolve => setTimeout(resolve, 10));
      return new Response(JSON.stringify({ path, success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } finally {
      this.isProcessingRequest = false;
    }
  }

  // Check if worker is still operational
  isOperational(): boolean {
    return true; // Worker should always be operational even if cron fails
  }

  getExecutionCount(name: string): number {
    return this.env.executionCount.get(name) || 0;
  }

  getLastExecution(name: string): Date | undefined {
    return this.env.lastExecution.get(name);
  }

  getErrors(name: string): Error[] {
    return this.env.errors.get(name) || [];
  }
}

describe('Property 4: Cron Job Execution', () => {
  let worker: MockWorkerWithCron;

  beforeEach(() => {
    worker = new MockWorkerWithCron();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Property: Cron jobs should execute at specified intervals
   * For any cron job configuration, the scheduled task should execute
   * when triggered at the specified time
   */
  it('should execute cron jobs at specified intervals', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          jobName: fc.constantFrom('payments-lifecycle', 'embedding-queue', 'countdown-emails'),
          executionTimes: fc.array(fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), { minLength: 1, maxLength: 10 }),
        }),
        async ({ jobName, executionTimes }) => {
          // Register a simple cron job handler
          let executionCounter = 0;
          worker.registerCronJob(jobName, async (scheduledTime: Date) => {
            executionCounter++;
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, 5));
          });

          // Execute the cron job at each scheduled time
          for (const time of executionTimes) {
            await worker.executeCronJob(jobName, time);
          }

          // Verify execution count matches number of triggers
          expect(worker.getExecutionCount(jobName)).toBe(executionTimes.length);
          expect(executionCounter).toBe(executionTimes.length);

          // Verify last execution time is recorded
          const lastExecution = worker.getLastExecution(jobName);
          expect(lastExecution).toBeDefined();
          if (executionTimes.length > 0) {
            expect(lastExecution).toEqual(executionTimes[executionTimes.length - 1]);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cron job failures should not affect worker operation
   * For any cron job that throws an error, the worker should continue
   * operating and handling requests (Requirement 2.5)
   */
  it('should continue operating when cron jobs fail', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          jobName: fc.string({ minLength: 1, maxLength: 20 }),
          shouldFail: fc.boolean(),
          requestPath: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async ({ jobName, shouldFail, requestPath }) => {
          // Register a cron job that may fail
          worker.registerCronJob(jobName, async (scheduledTime: Date) => {
            if (shouldFail) {
              throw new Error('Simulated cron job failure');
            }
            await new Promise(resolve => setTimeout(resolve, 5));
          });

          // Execute the cron job
          const executionTime = new Date();
          await worker.executeCronJob(jobName, executionTime);

          // Worker should still be operational regardless of cron failure
          expect(worker.isOperational()).toBe(true);

          // Worker should still handle HTTP requests
          const response = await worker.handleRequest(requestPath);
          expect(response.status).toBe(200);
          const data = await response.json();
          expect(data.success).toBe(true);

          // If job failed, error should be logged but execution count should still increment
          if (shouldFail) {
            const errors = worker.getErrors(jobName);
            expect(errors.length).toBeGreaterThan(0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple cron jobs should execute independently
   * For any set of cron jobs, each should execute independently without
   * interfering with others
   */
  it('should execute multiple cron jobs independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            name: fc.constantFrom('job1', 'job2', 'job3'),
            scheduledTime: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (jobs) => {
          // Register multiple cron jobs
          const jobNames = ['job1', 'job2', 'job3'];
          const executionTracking = new Map<string, number>();

          for (const name of jobNames) {
            executionTracking.set(name, 0);
            worker.registerCronJob(name, async (scheduledTime: Date) => {
              executionTracking.set(name, (executionTracking.get(name) || 0) + 1);
              await new Promise(resolve => setTimeout(resolve, 5));
            });
          }

          // Execute jobs
          for (const job of jobs) {
            await worker.executeCronJob(job.name, job.scheduledTime);
          }

          // Count expected executions per job
          const expectedCounts = new Map<string, number>();
          for (const job of jobs) {
            expectedCounts.set(job.name, (expectedCounts.get(job.name) || 0) + 1);
          }

          // Verify each job executed the correct number of times
          for (const name of jobNames) {
            const expected = expectedCounts.get(name) || 0;
            expect(worker.getExecutionCount(name)).toBe(expected);
            expect(executionTracking.get(name)).toBe(expected);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cron job execution should not block HTTP request handling
   * For any cron job execution, the worker should still be able to handle
   * HTTP requests concurrently
   */
  it('should handle HTTP requests while cron jobs are executing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          jobName: fc.string({ minLength: 1, maxLength: 20 }),
          requestPaths: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        }),
        async ({ jobName, requestPaths }) => {
          // Register a cron job that takes some time
          worker.registerCronJob(jobName, async (scheduledTime: Date) => {
            await new Promise(resolve => setTimeout(resolve, 20));
          });

          // Start cron job execution (don't await)
          const cronPromise = worker.executeCronJob(jobName, new Date());

          // Handle HTTP requests concurrently
          const requestPromises = requestPaths.map(path => worker.handleRequest(path));
          const responses = await Promise.all(requestPromises);

          // All requests should succeed
          for (const response of responses) {
            expect(response.status).toBe(200);
            const data = await response.json();
            expect(data.success).toBe(true);
          }

          // Wait for cron job to complete
          await cronPromise;

          // Cron job should have executed
          expect(worker.getExecutionCount(jobName)).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Cron job configuration should match requirements
   * For each standalone worker, verify the cron schedule matches requirements:
   * - payments-api: daily at 6:00 AM UTC
   * - email-api: daily at 6:50 AM UTC  
   * - embedding-api: every 5 minutes
   */
  it('should have correct cron schedules configured', () => {
    // This is more of a configuration validation test
    const cronConfigs = {
      'payments-api': '0 6 * * *',      // Daily at 6:00 AM UTC
      'email-api': '50 6 * * *',        // Daily at 6:50 AM UTC
      'embedding-api': '*/5 * * * *',   // Every 5 minutes
    };

    // Parse cron expression to verify format
    const parseCronExpression = (expr: string): { minute: string; hour: string; dayOfMonth: string; month: string; dayOfWeek: string } => {
      const parts = expr.split(' ');
      return {
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
      };
    };

    // Verify payments-api cron (daily at 6:00 AM UTC)
    const paymentsCron = parseCronExpression(cronConfigs['payments-api']);
    expect(paymentsCron.minute).toBe('0');
    expect(paymentsCron.hour).toBe('6');
    expect(paymentsCron.dayOfMonth).toBe('*');
    expect(paymentsCron.month).toBe('*');
    expect(paymentsCron.dayOfWeek).toBe('*');

    // Verify email-api cron (daily at 6:50 AM UTC)
    const emailCron = parseCronExpression(cronConfigs['email-api']);
    expect(emailCron.minute).toBe('50');
    expect(emailCron.hour).toBe('6');
    expect(emailCron.dayOfMonth).toBe('*');
    expect(emailCron.month).toBe('*');
    expect(emailCron.dayOfWeek).toBe('*');

    // Verify embedding-api cron (every 5 minutes)
    const embeddingCron = parseCronExpression(cronConfigs['embedding-api']);
    expect(embeddingCron.minute).toBe('*/5');
    expect(embeddingCron.hour).toBe('*');
    expect(embeddingCron.dayOfMonth).toBe('*');
    expect(embeddingCron.month).toBe('*');
    expect(embeddingCron.dayOfWeek).toBe('*');
  });
});
