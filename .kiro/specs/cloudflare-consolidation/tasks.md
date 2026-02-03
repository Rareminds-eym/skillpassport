# Implementation Plan

- [x] 1. Set up project structure and shared utilities
  - Create `src/functions-lib/` directory for shared code
  - Implement CORS utilities (`cors.ts`)
  - Implement response helpers (`response.ts`)
  - Implement Supabase client factory (`supabase.ts`)
  - Define shared TypeScript types (`types.ts`)
  - _Requirements: 1.3, 1.4_

- [x] 1.1 Write property test for shared utilities
  - **Property 3: Shared Module Consistency**
  - **Validates: Requirements 1.3**

- [x] 2. Configure standalone workers with service bindings
  - Update `payments-api/wrangler.toml` with service bindings for email-api and storage-api
  - Update `email-api/wrangler.toml` with cron configuration
  - Update `embedding-api/wrangler.toml` with cron configuration
  - Verify cron triggers are properly configured
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.4, 6.5_

- [x] 2.1 Write property test for cron job execution
  - **Property 4: Cron Job Execution**
  - **Validates: Requirements 2.1, 2.5**

- [x] 2.2 Write property test for service binding communication
  - **Property 6: Service Binding Communication**
  - **Validates: Requirements 3.4, 6.1, 6.2, 6.3, 6.4**

- [x] 3. Create Pages Functions directory structure
  - Create `functions/api/` directory
  - Create subdirectories for each of the 12 APIs to be migrated
  - Create `functions/_middleware.ts` for global CORS handling
  - _Requirements: 9.1, 9.2, 9.3_

- [x] 4. Migrate assessment-api to Pages Function
  - Copy assessment-api code to `functions/api/assessment/[[path]].ts`
  - Update imports to use shared utilities from `src/functions-lib/`
  - Test locally with `wrangler pages dev`
  - Verify all endpoints work correctly
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 4.1 Write property test for API endpoint parity
  - **Property 1: API Endpoint Parity**
  - **Validates: Requirements 1.2, 4.2**

- [x] 4.2 Write property test for file-based routing
  - **Property 13: File-Based Routing**
  - **Validates: Requirements 9.1, 9.4**

- [x] 5. Migrate career-api to Pages Function
  - Copy career-api code to `functions/api/career/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 6. Migrate course-api to Pages Function
  - Copy course-api code to `functions/api/course/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 7. Migrate fetch-certificate to Pages Function
  - Copy fetch-certificate code to `functions/api/fetch-certificate/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 8. Migrate otp-api to Pages Function
  - Copy otp-api code to `functions/api/otp/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 9. Migrate storage-api to Pages Function
  - Copy storage-api code to `functions/api/storage/[[path]].ts`
  - Update imports to use shared utilities
  - Update payments-api to use storage-api via service binding
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2, 6.2_

- [x] 10. Migrate streak-api to Pages Function
  - Copy streak-api code to `functions/api/streak/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 11. Migrate user-api to Pages Function
  - Copy user-api code to `functions/api/user/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 12. Migrate adaptive-aptitude-api to Pages Function
  - Copy adaptive-aptitude-api code to `functions/api/adaptive-aptitude/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 13. Migrate analyze-assessment-api to Pages Function
  - Copy analyze-assessment-api code to `functions/api/analyze-assessment/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 14. Migrate question-generation-api to Pages Function
  - Copy question-generation-api code to `functions/api/question-generation/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 15. Migrate role-overview-api to Pages Function
  - Copy role-overview-api code to `functions/api/role-overview/[[path]].ts`
  - Update imports to use shared utilities
  - Test locally and verify functionality
  - _Requirements: 1.2, 4.1, 4.2_

- [x] 16. Configure environment variables in Cloudflare Pages
  - Add all required environment variables to Cloudflare Pages dashboard
  - Verify Pages Functions can access environment variables
  - Configure separate development and production environments
  - _Requirements: 1.4, 8.1, 8.5_

- [x] 16.1 Write property test for environment variable accessibility
  - **Property 2: Environment Variable Accessibility**
  - **Validates: Requirements 1.4, 8.1**

- [x] 16.2 Write property test for environment-specific configuration
  - **Property 15: Environment-Specific Configuration**
  - **Validates: Requirements 8.5**

- [x] 16.3 Write property test for graceful error handling
  - **Property 16: Graceful Error Handling**
  - **Validates: Requirements 8.4**

- [x] 17. Update frontend service files
  - Update `src/services/assessmentApiService.ts` to use Pages Function endpoint with fallback
  - Update `src/services/careerApiService.ts` to use Pages Function endpoint with fallback
  - Update `src/services/courseApiService.ts` to use Pages Function endpoint with fallback
  - Update all other service files for migrated APIs
  - Implement fallback logic for all services
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 17.1 Write property test for frontend routing
  - **Property 8: Frontend Routing**
  - **Validates: Requirements 4.3, 7.1**

- [x] 17.2 Write property test for migration fallback
  - **Property 11: Migration Fallback**
  - **Validates: Requirements 5.3, 7.2**

- [x] 17.3 Write property test for backward compatibility
  - **Property 14: Backward Compatibility During Migration**
  - **Validates: Requirements 7.4**

- [ ] 18. Deploy to staging environment
  - Deploy Pages Application with all 12 migrated functions to staging
  - Deploy standalone workers (payments-api, email-api, embedding-api) to staging
  - Verify all environment variables are configured correctly
  - _Requirements: 1.1, 4.5_

- [ ] 18.1 Write property test for atomic deployment
  - **Property 10: Atomic Deployment**
  - **Validates: Requirements 4.5**

- [ ] 19. Run integration tests in staging
  - Test all API endpoints for Pages Functions
  - Test service bindings between standalone workers
  - Test cron job execution
  - Test frontend integration with Pages Functions
  - Verify fallback behavior works correctly
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 20. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Deploy to production with gradual traffic shift
  - Deploy Pages Application to production with 0% traffic
  - Monitor for 24 hours to ensure deployment is stable
  - Shift 10% of traffic to Pages Functions, monitor for 24 hours
  - Shift 25% of traffic to Pages Functions, monitor for 24 hours
  - Shift 50% of traffic to Pages Functions, monitor for 24 hours
  - Shift 100% of traffic to Pages Functions, monitor for 48 hours
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 21.1 Write property test for gradual traffic shifting
  - **Property 12: Gradual Traffic Shifting**
  - **Validates: Requirements 5.2**

- [ ] 22. Monitor production deployment
  - Monitor error rates for all Pages Functions
  - Monitor response times and compare to Original Workers
  - Monitor cron job execution for standalone workers
  - Monitor service binding usage and fallback occurrences
  - Set up alerts for error rate > 1%, response time > 2 seconds
  - _Requirements: 5.4_

- [ ] 23. Verify webhook stability for payments-api
  - Verify Razorpay webhook URL remains unchanged after deployment
  - Test webhook signature verification
  - Test payment event processing
  - Verify email sending via service binding
  - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [ ] 23.1 Write property test for webhook URL stability
  - **Property 5: Webhook URL Stability**
  - **Validates: Requirements 3.1, 3.3**

- [ ] 24. Checkpoint - Verify production stability
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Decommission Original Workers
  - Verify 100% of traffic is on Pages Functions with no errors
  - Remove Original Worker deployments from Cloudflare
  - Remove worker directories from codebase (assessment-api, career-api, course-api, etc.)
  - Remove wrangler.toml files for decommissioned workers
  - _Requirements: 5.5, 11.1, 11.2, 11.3_

- [ ] 26. Update GitHub workflows
  - Remove CI/CD jobs for decommissioned workers from `.github/workflows/deploy-workers.yml`
  - Update deployment workflow to deploy Pages Application
  - Update workflow to deploy only the 3 standalone workers (payments-api, email-api, embedding-api)
  - Test GitHub Actions workflow
  - _Requirements: 11.5_

- [ ] 27. Update documentation
  - Update `cloudflare-workers/README.md` to reflect new architecture
  - Update architecture diagrams in documentation
  - Update API documentation with new endpoint URLs
  - Remove references to decommissioned workers
  - Add Pages Functions development guide
  - Document shared utilities usage
  - _Requirements: 11.6_

- [ ] 28. Remove fallback code from frontend
  - Remove fallback URLs from all frontend service files
  - Update environment variables to remove old worker URLs
  - Test frontend with only Pages Function endpoints
  - _Requirements: 7.5_

- [ ] 29. Final verification
  - Run full test suite
  - Verify all Pages Functions are working correctly
  - Verify all standalone workers are working correctly
  - Verify cron jobs are executing on schedule
  - Verify service bindings are working
  - Verify no references to decommissioned workers remain
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5_
