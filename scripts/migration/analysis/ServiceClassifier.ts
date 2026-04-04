import * as fs from 'fs';
import * as path from 'path';

interface ServiceClassification {
  servicePath: string;
  serviceName: string;
  targetLayer: 'features' | 'entities' | 'shared';
  targetDomain: string;
  targetPath: string;
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;
  usageCount?: number;
  usedByFeatures?: string[];
}

export class ServiceClassifier {
  private servicesDir = 'src/services';
  private featuresDir = 'src/features';
  private entitiesDir = 'src/entities';

  // Feature-to-service mapping based on domain analysis
  private featureServicePatterns: Record<string, string[]> = {
    'auth': [
      'authService', 'adminAuthService', 'studentAuthService', 
      'unifiedAuthService', 'passwordResetService', 'otpService'
    ],
    'assessment': [
      'adaptiveAptitudeApiService', 'assessmentEnrichmentService',
      'assessmentResultTransformer', 'aptitudeScoreValidator',
      'riasecScoreValidator', 'certificateAssessmentService',
      'questionGeneratorService'
    ],
    'courses': [
      'courseApiService', 'courseEnrollmentService', 'courseProgressService',
      'courseRecommendationService', 'courseEmbeddingManager',
      'progressSyncManager', 'streamRecommendationService'
    ],
    'opportunities': [
      'opportunitiesService', 'aiJobMatchingService', 'appliedJobsService',
      'savedJobsService', 'searchHistoryService', 'savedSearchesService',
      'applicationTrackingService', 'interviewService', 'offerManagementService',
      'pipelineService', 'shortlistService'
    ],
    'placement': [
      'placementAnalyticsService', 'studentPipelineService'
    ],
    'college-admin': [
      'collegeAdminNotificationService', 'collegeAssignmentService',
      'collegeClassService', 'collegeService', 'csvImportService',
      'curriculumApprovalService', 'curriculumChangeFallbackService',
      'curriculumChangeRequestService', 'curriculumExportService',
      'curriculumService', 'facultyService', 'mentorAllocationService'
    ],
    'school-admin': [
      'schoolAdminNotificationService', 'schoolLibraryService', 'schoolService'
    ],
    'digital-portfolio': [
      'portfolioService', 'resumeDataService', 'resumeParserService',
      'badgeService', 'certificateService', 'studentDocumentService'
    ],
    'ai-tutor': [
      'tutorService', 'claudeService', 'videoSummarizerService',
      'aiRecommendationService'
    ],
    'counselling': [
      'aiCareerPathService', 'careerApiService', 'careerApiInterceptor',
      'programCareerPathsService'
    ],
    'messaging': [
      'messageService'
    ],
    'subscription': [
      'entitlementService', 'paymentsApiService'
    ],
    'educator-copilot': [
      'educatorProfile', 'educatorService', 'lessonPlanService',
      'lessonPlansService', 'assignmentsService'
    ],
    'recruiter-copilot': [
      'recruiterProfile', 'companyService'
    ],
    'university-ai': [
      'universityCollegeService', 'universityService'
    ]
  };

  // Entity-specific services (pure CRUD operations)
  private entityServicePatterns: Record<string, string[]> = {
    'user': [
      'userApiService', 'userManagementService', 'userSettingsService',
      'roleLookupService', 'permissionService'
    ],
    'organization': [
      'organizationService'
    ],
    'course': [],
    'student': [
      'studentService', 'studentManagementService', 'studentSettingsService',
      'studentEnrollmentService', 'studentClassService', 'studentExamService',
      'studentActivityService'
    ]
  };

  // Shared infrastructure services
  private sharedServicePatterns = [
    'analyticsService', 'notificationService', 'fileService',
    'fileUploadService', 'storageService', 'storageApiService',
    'realtimeService', 'settingsService', 'dashboardService',
    'optimizedQueryService', 'authenticatedMediaService',
    'migrationService', 'migrationNotificationService',
    'recentUpdatesService', 'usageStatisticsService',
    'alertsService', 'adminNotificationService',
    'studentNotificationService', 'addOnAnalyticsService',
    'addOnCatalogService', 'addOnPaymentService',
    'skillsAnalyticsService', 'streakApiService'
  ];

  // College-specific services (subdirectory)
  private collegeServices = [
    'assessmentService', 'budgetManagementService', 'courseMappingService',
    'curriculumService', 'departmentService', 'examinationService',
    'feeManagementService', 'financeService', 'lessonPlanService',
    'libraryService', 'markEntryService', 'reportsService',
    'studentAdmissionService', 'transcriptService', 'userManagementService'
  ];

  async classifyServices(): Promise<ServiceClassification[]> {
    const classifications: ServiceClassification[] = [];
    const serviceFiles = this.getAllServiceFiles();

    for (const serviceFile of serviceFiles) {
      const classification = await this.classifyService(serviceFile);
      classifications.push(classification);
    }

    return classifications;
  }

  private getAllServiceFiles(): string[] {
    const files: string[] = [];
    
    const scanDirectory = (dir: string): void => {
      if (!fs.existsSync(dir)) return;
      
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip test directories
          if (entry.name !== '__tests__' && entry.name !== 'embeddingCache') {
            scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          // Include .ts and .js files, exclude tests and README
          if ((entry.name.endsWith('.ts') || entry.name.endsWith('.js')) &&
              !entry.name.endsWith('.test.ts') &&
              !entry.name.endsWith('.test.js') &&
              !entry.name.includes('README')) {
            files.push(fullPath);
          }
        }
      }
    };

    scanDirectory(this.servicesDir);
    return files;
  }

  private async classifyService(servicePath: string): Promise<ServiceClassification> {
    const serviceName = path.basename(servicePath, path.extname(servicePath));
    const relativePath = path.relative(this.servicesDir, servicePath);
    
    // Check if it's in a subdirectory
    const subdirMatch = relativePath.match(/^([^/\\]+)[/\\]/);
    const subdir = subdirMatch ? subdirMatch[1] : null;

    // Handle college subdirectory services
    if (subdir === 'college') {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'high',
        reasoning: 'Service in college/ subdirectory belongs to college-admin feature'
      };
    }

    // Handle courseRecommendation subdirectory
    if (subdir === 'courseRecommendation') {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'courses',
        targetPath: `src/features/courses/api/${serviceName}.ts`,
        confidence: 'high',
        reasoning: 'Course recommendation service belongs to courses feature'
      };
    }

    // Handle educator subdirectory
    if (subdir === 'educator') {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'educator-copilot',
        targetPath: `src/features/educator-copilot/api/${serviceName}.ts`,
        confidence: 'high',
        reasoning: 'Educator service belongs to educator-copilot feature'
      };
    }

    // Handle organization subdirectory
    if (subdir === 'organization') {
      return {
        servicePath,
        serviceName,
        targetLayer: 'entities',
        targetDomain: 'organization',
        targetPath: `src/entities/organization/api/${serviceName}.ts`,
        confidence: 'high',
        reasoning: 'Organization service belongs to organization entity'
      };
    }

    // Handle Subscriptions subdirectory
    if (subdir === 'Subscriptions') {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'subscription',
        targetPath: `src/features/subscription/api/${serviceName}.ts`,
        confidence: 'high',
        reasoning: 'Subscription service belongs to subscription feature'
      };
    }

    // Check feature patterns
    for (const [feature, patterns] of Object.entries(this.featureServicePatterns)) {
      if (patterns.some(pattern => serviceName.includes(pattern))) {
        return {
          servicePath,
          serviceName,
          targetLayer: 'features',
          targetDomain: feature,
          targetPath: `src/features/${feature}/api/${serviceName}.ts`,
          confidence: 'high',
          reasoning: `Service name matches ${feature} feature pattern`
        };
      }
    }

    // Check entity patterns
    for (const [entity, patterns] of Object.entries(this.entityServicePatterns)) {
      if (patterns.some(pattern => serviceName.includes(pattern))) {
        return {
          servicePath,
          serviceName,
          targetLayer: 'entities',
          targetDomain: entity,
          targetPath: `src/entities/${entity}/api/${serviceName}.ts`,
          confidence: 'high',
          reasoning: `Service name matches ${entity} entity pattern`
        };
      }
    }

    // Check shared patterns
    if (this.sharedServicePatterns.some(pattern => serviceName.includes(pattern))) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'shared',
        targetDomain: 'api',
        targetPath: `src/shared/api/${serviceName}.ts`,
        confidence: 'high',
        reasoning: 'Infrastructure service used across multiple features'
      };
    }

    // Additional classification based on naming conventions
    if (serviceName.includes('class') || serviceName.includes('Class')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Class-related service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('exam') || serviceName.includes('Exam')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'assessment',
        targetPath: `src/features/assessment/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Exam-related service likely belongs to assessment'
      };
    }

    if (serviceName.includes('library') || serviceName.includes('Library')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Library service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('teacher') || serviceName.includes('Teacher')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'educator-copilot',
        targetPath: `src/features/educator-copilot/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Teacher service likely belongs to educator-copilot'
      };
    }

    if (serviceName.includes('circular') || serviceName.includes('Circular')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Circular service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('club') || serviceName.includes('Club')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Club service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('competition') || serviceName.includes('Competition')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Competition service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('factory') || serviceName.includes('Factory')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Factory visit service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('program') || serviceName.includes('Program')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'college-admin',
        targetPath: `src/features/college-admin/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Program service likely belongs to college-admin'
      };
    }

    if (serviceName.includes('profile') && serviceName.includes('Validation')) {
      return {
        servicePath,
        serviceName,
        targetLayer: 'features',
        targetDomain: 'student-profile',
        targetPath: `src/features/student-profile/api/${serviceName}.ts`,
        confidence: 'medium',
        reasoning: 'Profile validation service belongs to student-profile'
      };
    }

    // Default to shared if uncertain
    return {
      servicePath,
      serviceName,
      targetLayer: 'shared',
      targetDomain: 'api',
      targetPath: `src/shared/api/${serviceName}.ts`,
      confidence: 'low',
      reasoning: 'Unable to determine specific feature/entity ownership, defaulting to shared'
    };
  }

  generateReport(classifications: ServiceClassification[]): string {
    const byLayer = {
      features: classifications.filter(c => c.targetLayer === 'features'),
      entities: classifications.filter(c => c.targetLayer === 'entities'),
      shared: classifications.filter(c => c.targetLayer === 'shared')
    };

    const byConfidence = {
      high: classifications.filter(c => c.confidence === 'high'),
      medium: classifications.filter(c => c.confidence === 'medium'),
      low: classifications.filter(c => c.confidence === 'low')
    };

    let report = '# Service Classification Report\n\n';
    report += `Total Services: ${classifications.length}\n\n`;
    
    report += '## By Target Layer\n';
    report += `- Features: ${byLayer.features.length}\n`;
    report += `- Entities: ${byLayer.entities.length}\n`;
    report += `- Shared: ${byLayer.shared.length}\n\n`;

    report += '## By Confidence\n';
    report += `- High: ${byConfidence.high.length}\n`;
    report += `- Medium: ${byConfidence.medium.length}\n`;
    report += `- Low: ${byConfidence.low.length}\n\n`;

    // Group by target domain
    const byDomain = new Map<string, ServiceClassification[]>();
    for (const classification of classifications) {
      const domain = classification.targetDomain;
      if (!byDomain.has(domain)) {
        byDomain.set(domain, []);
      }
      byDomain.get(domain)!.push(classification);
    }

    report += '## Services by Domain\n\n';
    for (const [domain, services] of Array.from(byDomain.entries()).sort()) {
      report += `### ${domain} (${services.length} services)\n\n`;
      for (const service of services) {
        report += `- **${service.serviceName}** (${service.confidence})\n`;
        report += `  - Source: \`${service.servicePath}\`\n`;
        report += `  - Target: \`${service.targetPath}\`\n`;
        report += `  - Reasoning: ${service.reasoning}\n\n`;
      }
    }

    // Low confidence services need review
    if (byConfidence.low.length > 0) {
      report += '## Services Requiring Manual Review (Low Confidence)\n\n';
      for (const service of byConfidence.low) {
        report += `- **${service.serviceName}**\n`;
        report += `  - Source: \`${service.servicePath}\`\n`;
        report += `  - Suggested Target: \`${service.targetPath}\`\n`;
        report += `  - Reasoning: ${service.reasoning}\n\n`;
      }
    }

    return report;
  }

  async generateMigrationPlan(): Promise<void> {
    console.log('Analyzing services...');
    const classifications = await this.classifyServices();
    
    console.log('Generating report...');
    const report = this.generateReport(classifications);
    
    const reportPath = 'src/migration/reports/service-classification-report.md';
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, report);
    console.log(`Report generated: ${reportPath}`);
    
    // Also save JSON for programmatic use
    const jsonPath = 'src/migration/reports/service-classification.json';
    fs.writeFileSync(jsonPath, JSON.stringify(classifications, null, 2));
    console.log(`JSON data saved: ${jsonPath}`);
  }
}

// CLI execution
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  const classifier = new ServiceClassifier();
  classifier.generateMigrationPlan().catch(console.error);
}
