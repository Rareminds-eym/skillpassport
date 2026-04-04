#!/usr/bin/env python3
"""
Move domain-specific services from shared/api/ to appropriate feature api/ segments.
Task 7.4 of FSD Violations Cleanup
"""

import os
import shutil
from pathlib import Path
import re

# Define service to feature mappings
SERVICE_MAPPINGS = {
    # College-specific services - NOTE: Most already exist in college-admin from previous tasks
    # These will be REMOVED from shared/api/college (duplicates, older versions)
    # The newer versions in features/college-admin/api will be kept
    
    # Services that need to be moved (not duplicates)
    'shared/api/college/libraryService.ts': 'features/library/api/libraryService.ts',
    
    # Educator-specific services
    'shared/api/educator/analyticsService.js': 'features/educator/api/analyticsService.js',
    'shared/api/educator/assignmentsService.js': 'features/educator/api/assignmentsService.js',
    'shared/api/educator/coursesService.ts': 'features/educator/api/coursesService.ts',
    'shared/api/educator/dashboardApi.ts': 'features/educator/api/dashboardApi.ts',
    'shared/api/educator/mentorNotes.ts': 'features/educator/api/mentorNotes.ts',
    'shared/api/educator/mockApi.ts': 'features/educator/api/mockApi.ts',
    
    # Domain-specific services in root shared/api/
    'shared/api/addOnAnalyticsService.ts': 'features/subscription/api/addOnAnalyticsService.ts',
    'shared/api/addOnCatalogService.ts': 'features/subscription/api/addOnCatalogService.ts',
    'shared/api/addOnPaymentService.ts': 'features/subscription/api/addOnPaymentService.ts',
    'shared/api/adminNotificationService.ts': 'features/notifications/api/adminNotificationService.ts',
    'shared/api/alertsService.ts': 'features/notifications/api/alertsService.ts',
    'shared/api/analyticsService.ts': 'features/analytics/api/analyticsService.ts',
    'shared/api/dashboardService.ts': 'features/analytics/api/dashboardService.ts',
    'shared/api/messageService.ts': 'features/messaging/api/messageService.ts',
    'shared/api/migrationNotificationService.ts': 'features/notifications/api/migrationNotificationService.ts',
    'shared/api/notificationService.ts': 'features/notifications/api/notificationService.ts',
    'shared/api/pipelineService.ts': 'features/recruiter-pipeline/api/pipelineService.ts',
    'shared/api/programService.ts': 'features/courses/api/programService.ts',
    'shared/api/recentUpdatesService.ts': 'features/notifications/api/recentUpdatesService.ts',
    'shared/api/skillsAnalyticsService.ts': 'features/analytics/api/skillsAnalyticsService.ts',
    'shared/api/streakApiService.ts': 'features/student-profile/api/streakApiService.ts',
    'shared/api/studentClassService.ts': 'features/myclass/api/studentClassService.ts',
    'shared/api/studentExamService.ts': 'features/exams/api/studentExamService.ts',
    'shared/api/studentNotificationService.ts': 'features/notifications/api/studentNotificationService.ts',
    'shared/api/usageStatisticsService.ts': 'features/analytics/api/usageStatisticsService.ts',
    
    # Also move .js duplicates
    'shared/api/addOnAnalyticsService.js': 'features/subscription/api/addOnAnalyticsService.js',
    'shared/api/addOnCatalogService.js': 'features/subscription/api/addOnCatalogService.js',
    'shared/api/addOnPaymentService.js': 'features/subscription/api/addOnPaymentService.js',
    'shared/api/dashboardService.js': 'features/analytics/api/dashboardService.js',
    'shared/api/migrationNotificationService.js': 'features/notifications/api/migrationNotificationService.js',
    'shared/api/optimizedQueryService.js': 'features/analytics/api/optimizedQueryService.js',
    'shared/api/optimizedQueryService.ts': 'features/analytics/api/optimizedQueryService.ts',
    'shared/api/recentUpdatesService.js': 'features/notifications/api/recentUpdatesService.js',
    'shared/api/skillsAnalyticsService.js': 'features/analytics/api/skillsAnalyticsService.js',
    'shared/api/studentNotificationService.js': 'features/notifications/api/studentNotificationService.js',
    'shared/api/usageStatisticsService.js': 'features/analytics/api/usageStatisticsService.js',
    'shared/api/migrationService.js': 'features/admin/api/migrationService.js',
    'shared/api/migrationService.ts': 'features/admin/api/migrationService.ts',
}

# Services that are duplicates (already moved in previous tasks) - will be DELETED
DUPLICATE_SERVICES = [
    'shared/api/college/assessmentService.ts',
    'shared/api/college/budgetManagementService.ts',
    'shared/api/college/courseMappingService.ts',
    'shared/api/college/curriculumService.ts',
    'shared/api/college/departmentService.ts',
    'shared/api/college/examinationService.ts',
    'shared/api/college/feeManagementService.ts',
    'shared/api/college/financeService.ts',
    'shared/api/college/lessonPlanService.ts',
    'shared/api/college/markEntryService.ts',
    'shared/api/college/reportsService.ts',
    'shared/api/college/studentAdmissionService.ts',
    'shared/api/college/transcriptService.ts',
    'shared/api/college/userManagementService.ts',
]

# Services that should stay in shared (truly generic infrastructure)
KEEP_IN_SHARED = [
    'api.js',
    'apiUtils.ts',
    'authenticatedMediaService.ts',
    'authUtils.ts',
    'constants.ts',
    'fileService.js',
    'fileService.ts',
    'fileUploadService.ts',
    'httpClient.ts',
    'index.ts',
    'realtimeService.ts',
    'settingsService.ts',
    'storageApiService.ts',
    'storageService.ts',
    'supabase.ts',
    'supabaseClient.ts',
    'types.ts',
]

def move_service(src_path: Path, dest_path: Path, dry_run: bool = False):
    """Move a service file and create necessary directories."""
    if not src_path.exists():
        print(f"⚠️  Source not found: {src_path}")
        return False
    
    if dry_run:
        print(f"Would move: {src_path} -> {dest_path}")
        return True
    
    # Create destination directory
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Move the file
    shutil.move(str(src_path), str(dest_path))
    print(f"✓ Moved: {src_path.name} -> {dest_path}")
    return True

def find_import_references(service_path: str, src_dir: Path):
    """Find all files that import from this service."""
    # Convert path to import patterns
    old_import_patterns = []
    
    # Pattern 1: @/shared/api/serviceName
    service_name = Path(service_path).stem
    old_import_patterns.append(f"@/shared/api/{service_name}")
    
    # Pattern 2: @/shared/api/college/serviceName or @/shared/api/educator/serviceName
    if '/college/' in service_path or '/educator/' in service_path:
        parts = service_path.split('/')
        if 'college' in parts:
            idx = parts.index('college')
            old_import_patterns.append(f"@/shared/api/college/{service_name}")
        if 'educator' in parts:
            idx = parts.index('educator')
            old_import_patterns.append(f"@/shared/api/educator/{service_name}")
    
    references = []
    for root, dirs, files in os.walk(src_dir):
        # Skip node_modules and other non-source directories
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = Path(root) / file
                try:
                    content = file_path.read_text(encoding='utf-8')
                    for pattern in old_import_patterns:
                        if pattern in content:
                            references.append(file_path)
                            break
                except Exception as e:
                    pass
    
    return references

def update_imports(file_path: Path, old_path: str, new_path: str, dry_run: bool = False):
    """Update import statements in a file."""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Extract service name
        service_name = Path(old_path).stem
        
        # Build old import patterns
        old_patterns = []
        if '/college/' in old_path:
            old_patterns.append(f"@/shared/api/college/{service_name}")
        elif '/educator/' in old_path:
            old_patterns.append(f"@/shared/api/educator/{service_name}")
        else:
            old_patterns.append(f"@/shared/api/{service_name}")
        
        # Build new import path
        new_feature = new_path.split('/')[1]  # Extract feature name
        new_import = f"@/features/{new_feature}/api/{service_name}"
        
        # Replace all old patterns with new import
        for old_pattern in old_patterns:
            content = content.replace(old_pattern, new_import)
        
        if content != original_content:
            if dry_run:
                print(f"  Would update imports in: {file_path}")
                return True
            else:
                file_path.write_text(content, encoding='utf-8')
                print(f"  ✓ Updated imports in: {file_path}")
                return True
        
        return False
    except Exception as e:
        print(f"  ⚠️  Error updating {file_path}: {e}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Move domain-specific services from shared/api/ to features')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done without making changes')
    parser.add_argument('--update-imports', action='store_true', help='Update import statements in all files')
    args = parser.parse_args()
    
    src_root = Path('src')
    moved_count = 0
    deleted_count = 0
    updated_files = 0
    
    print("=" * 80)
    print("Moving domain-specific services from shared/api/ to feature api/ segments")
    print("=" * 80)
    print()
    
    # First, handle duplicates (delete them)
    print("Removing duplicate services (already moved in previous tasks):")
    print("-" * 80)
    for dup_path in DUPLICATE_SERVICES:
        dup_file = src_root / dup_path
        if dup_file.exists():
            if args.dry_run:
                print(f"Would delete duplicate: {dup_path}")
            else:
                dup_file.unlink()
                print(f"✓ Deleted duplicate: {dup_path}")
            deleted_count += 1
    print()
    
    # Then move the remaining services
    print("Moving services to feature api/ segments:")
    print("-" * 80)
    for old_path, new_path in SERVICE_MAPPINGS.items():
        src_file = src_root / old_path
        dest_file = src_root / new_path
        
        if src_file.exists():
            print(f"\n📦 Processing: {old_path}")
            
            # Find references before moving
            if args.update_imports:
                references = find_import_references(old_path, src_root)
                print(f"   Found {len(references)} files importing this service")
            
            # Move the file
            if move_service(src_file, dest_file, args.dry_run):
                moved_count += 1
                
                # Update imports
                if args.update_imports and not args.dry_run:
                    for ref_file in references:
                        if update_imports(ref_file, old_path, new_path, args.dry_run):
                            updated_files += 1
    
    print()
    print("=" * 80)
    print(f"Summary:")
    print(f"  Duplicate services deleted: {deleted_count}")
    print(f"  Services moved: {moved_count}")
    if args.update_imports:
        print(f"  Files with updated imports: {updated_files}")
    if args.dry_run:
        print(f"  (Dry run - no changes made)")
    print("=" * 80)
    
    # List services that will remain in shared
    print()
    print("Services remaining in shared/api/ (generic infrastructure):")
    for service in KEEP_IN_SHARED:
        service_path = src_root / 'shared' / 'api' / service
        if service_path.exists():
            print(f"  ✓ {service}")

if __name__ == '__main__':
    main()
