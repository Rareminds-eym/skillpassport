# Requirements Document

## Introduction

This document outlines the requirements for consolidating 15 separate Cloudflare Workers into a hybrid architecture consisting of 3 standalone workers and Cloudflare Pages Functions. The goal is to simplify deployment, reduce maintenance overhead, and improve code sharing while maintaining performance and reliability for critical services.

## Glossary

- **Cloudflare Worker**: A serverless function that runs on Cloudflare's edge network
- **Cloudflare Pages Functions**: File-based serverless functions deployed alongside a Cloudflare Pages site
- **Service Binding**: A mechanism for worker-to-worker communication within Cloudflare
- **Cron Job**: A scheduled task that runs at specified intervals
- **Webhook**: An HTTP endpoint that receives callbacks from external services
- **Pages Functions**: Serverless functions that are part of a Cloudflare Pages deployment
- **Standalone Worker**: A separately deployed Cloudflare Worker with its own wrangler.toml configuration
- **API Endpoint**: An HTTP route that handles specific requests
- **Zero-Downtime Migration**: A deployment strategy that maintains service availability during updates
- **Consolidated System**: The hybrid architecture consisting of Pages Functions and Standalone Workers
- **Migration Process**: The transition from separate workers to the consolidated architecture
- **Original Worker**: A worker that existed before the consolidation
- **Pages Application**: The Cloudflare Pages deployment hosting the frontend and Pages Functions

## Requirements

### Requirement 1

**User Story:** As a developer, I want to consolidate multiple workers into Cloudflare Pages Functions, so that I can reduce deployment complexity and improve code maintainability.

#### Acceptance Criteria

1. WHEN the Consolidated System is deployed THEN the Cloudflare Pages Application SHALL host the frontend and consolidated API functions
2. WHEN a request is made to a consolidated API endpoint THEN the Pages Function SHALL respond with the same functionality as the Original Worker
3. WHEN code is shared between functions THEN the Pages Functions SHALL access common utilities and types from shared modules
4. WHEN environment variables are configured THEN all Pages Functions SHALL access the same environment configuration
5. WHEN the Pages Application is built THEN the build process SHALL bundle the frontend and all Pages Functions together

### Requirement 2

**User Story:** As a system architect, I want to keep workers with cron jobs as standalone workers, so that scheduled tasks continue to run reliably.

#### Acceptance Criteria

1. WHEN a Cron Job trigger is configured THEN the Standalone Worker SHALL execute the scheduled task at the specified interval
2. WHEN the payments-api Cron Job runs THEN the Standalone Worker SHALL process entitlement lifecycle tasks daily at 6:00 AM UTC
3. WHEN the embedding-api Cron Job runs THEN the Standalone Worker SHALL process the embedding queue every 5 minutes
4. WHEN the email-api Cron Job runs THEN the Standalone Worker SHALL send scheduled countdown emails daily at 6:50 AM UTC
5. IF a Cron Job fails THEN the Standalone Worker SHALL log the error and continue operating

### Requirement 3

**User Story:** As a payment system administrator, I want to keep the payments-api as a standalone worker, so that the webhook URL remains stable for Razorpay integration.

#### Acceptance Criteria

1. WHEN Razorpay sends a Webhook THEN the payments-api Standalone Worker SHALL receive the request at a stable URL
2. WHEN the Webhook signature is verified THEN the payments-api Standalone Worker SHALL process the payment event
3. WHEN the payments-api Standalone Worker is redeployed THEN the Webhook URL SHALL remain unchanged
4. WHEN the payments-api Standalone Worker communicates with other services THEN the Consolidated System SHALL use Service Bindings for email-api and storage-api
5. WHEN payment processing completes THEN the payments-api Standalone Worker SHALL send confirmation emails via the email-api Service Binding

### Requirement 4

**User Story:** As a developer, I want to migrate 12 workers to Pages Functions, so that I can simplify the deployment pipeline and reduce configuration overhead.

#### Acceptance Criteria

1. WHEN the Migration Process is complete THEN the Consolidated System SHALL consolidate assessment-api, career-api, course-api, fetch-certificate, otp-api, storage-api, streak-api, user-api, adaptive-aptitude-api, analyze-assessment-api, question-generation-api, and role-overview-api into Pages Functions
2. WHEN a Pages Function is deployed THEN the Consolidated System SHALL maintain the same API routes as the Original Worker
3. WHEN frontend code calls an API Endpoint THEN the Consolidated System SHALL route requests to the appropriate Pages Function
4. WHEN a Pages Function needs to call another function THEN the Consolidated System SHALL use internal function calls instead of HTTP requests
5. WHEN the Pages Application is deployed THEN all consolidated functions SHALL deploy atomically with the frontend

### Requirement 5

**User Story:** As a DevOps engineer, I want to implement a zero-downtime migration strategy, so that users experience no service interruption during the transition.

#### Acceptance Criteria

1. WHEN the Migration Process begins THEN both Original Workers and new Pages Functions SHALL run in parallel
2. WHEN traffic is shifted THEN the Consolidated System SHALL gradually route requests from Original Workers to Pages Functions
3. IF an error occurs in a Pages Function THEN the Consolidated System SHALL fall back to the Original Worker
4. WHEN all traffic is migrated THEN the Consolidated System SHALL monitor for errors before decommissioning Original Workers
5. WHEN the Migration Process is complete THEN the Original Workers SHALL be decommissioned only after verification

### Requirement 6

**User Story:** As a developer, I want to maintain service bindings between standalone workers, so that worker-to-worker communication remains efficient.

#### Acceptance Criteria

1. WHEN payments-api Standalone Worker needs to send an email THEN the Consolidated System SHALL use the email-api Service Binding
2. WHEN payments-api Standalone Worker needs to upload a receipt THEN the Consolidated System SHALL use the storage-api Service Binding
3. WHEN a Service Binding is invoked THEN the Consolidated System SHALL communicate directly without HTTP overhead
4. IF a Service Binding fails THEN the Consolidated System SHALL fall back to HTTP requests
5. WHEN Service Bindings are configured THEN the wrangler.toml configuration file SHALL define all required bindings

### Requirement 7

**User Story:** As a frontend developer, I want to update API service files to point to Pages Functions, so that the frontend seamlessly uses the new architecture.

#### Acceptance Criteria

1. WHEN the frontend makes an API call THEN the service file SHALL route to the Pages Function API Endpoint
2. IF a Pages Function is not available THEN the Consolidated System SHALL fall back to the Standalone Worker URL
3. WHEN environment variables are configured THEN the frontend SHALL use the correct API base URL
4. WHILE the Migration Process is active THEN the frontend service SHALL handle both old and new API response formats
5. WHEN the Migration Process is complete THEN the frontend SHALL use only Pages Function API Endpoints

### Requirement 8

**User Story:** As a system administrator, I want to configure environment variables for Pages and standalone workers, so that all services have access to required secrets and configuration.

#### Acceptance Criteria

1. WHEN Pages Functions are deployed THEN the Consolidated System SHALL provide access to all required environment variables
2. WHEN Standalone Workers are deployed THEN each Standalone Worker SHALL have access to its specific secrets
3. WHEN a secret is updated THEN the Consolidated System SHALL propagate the change to all affected services
4. IF environment variables are missing THEN the Consolidated System SHALL fail gracefully with clear error messages
5. WHEN development and production environments differ THEN the Consolidated System SHALL use environment-specific configuration

### Requirement 9

**User Story:** As a developer, I want to organize Pages Functions using file-based routing, so that the API structure is clear and maintainable.

#### Acceptance Criteria

1. WHEN a Pages Function is created THEN the file path SHALL determine the API Endpoint route
2. WHEN the functions directory is organized THEN each API SHALL have its own subdirectory
3. WHEN shared code is needed THEN the Consolidated System SHALL provide a common utilities directory
4. WHEN a function is added THEN the Consolidated System SHALL automatically register the API Endpoint route
5. THE Consolidated System SHALL organize the project structure so that developers can easily understand the API organization

### Requirement 10

**User Story:** As a quality assurance engineer, I want to test both standalone workers and Pages Functions, so that I can verify functionality before production deployment.

#### Acceptance Criteria

1. WHEN tests are run THEN the Consolidated System SHALL test all API Endpoints for both Standalone Workers and Pages Functions
2. WHEN a Pages Function is tested locally THEN the Consolidated System SHALL use Wrangler's local development server
3. WHEN integration tests run THEN the Consolidated System SHALL verify Service Bindings between Standalone Workers
4. WHEN performance tests run THEN the Consolidated System SHALL measure response times for all API Endpoints
5. WHEN tests complete THEN the Consolidated System SHALL report any failures or performance degradation

### Requirement 11

**User Story:** As a DevOps engineer, I want to clean up deprecated workers and configuration files after migration, so that the codebase remains maintainable and deployment costs are minimized.

#### Acceptance Criteria

1. WHEN the Migration Process is verified complete THEN the DevOps engineer SHALL decommission all Original Workers that have been migrated to Pages Functions
2. WHEN Original Workers are decommissioned THEN the Consolidated System SHALL remove the corresponding wrangler.toml configuration files
3. WHEN worker directories are removed THEN the Consolidated System SHALL delete all source code, dependencies, and build artifacts for migrated workers
4. WHEN cleanup is complete THEN the Consolidated System SHALL update deployment scripts to remove references to decommissioned workers
5. WHEN GitHub workflows are updated THEN the Consolidated System SHALL remove CI/CD jobs for decommissioned workers and update deployment workflows for the new architecture
6. WHEN documentation is updated THEN the Consolidated System SHALL reflect the new architecture and remove references to deprecated workers
