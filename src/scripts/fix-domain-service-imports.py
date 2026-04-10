#!/usr/bin/env python3
"""
Fix imports for domain-specific services moved from shared/api/ to feature api/ segments.
Task 7.4 of FSD Violations Cleanup
"""

import os
import re
from pathlib import Path

# Map old import paths to new import paths
IMPORT_MAPPINGS = {
    # College services (from shared/api/college/)
    '@/shared/api/college/libraryService': '@/features/library/api/libraryService',
    
    # Educator services
    '@/shared/api/educator/analyticsService': '@/features/educator/api/analyticsService',
    '@/shared/api/educator/assignmentsService': '@/features/educator/api/assignmentsService',
    '@/shared/api/educator/coursesService': '@/features/educator/api/coursesService',
    '@/shared/api/educator/dashboardApi': '@/features/educator/api/dashboardApi',
    '@/shared/api/educator/mentorNotes': '@/features/educator/api/mentorNotes',
    '@/shared/api/educator/mockApi': '@/features/educator/api/mockApi',
    
    # Subscription services
    '@/shared/api/addOnAnalyticsService': '@/features/subscription/api/addOnAnalyticsService',
    '@/shared/api/addOnCatalogService': '@/features/subscription/api/addOnCatalogService',
    '@/shared/api/addOnPaymentService': '@/features/subscription/api/addOnPaymentService',
    
    # Notification services
    '@/shared/api/adminNotificationService': '@/features/notifications/api/adminNotificationService',
    '@/shared/api/alertsService': '@/features/notifications/api/alertsService',
    '@/shared/api/migrationNotificationService': '@/features/notifications/api/migrationNotificationService',
    '@/shared/api/notificationService': '@/features/notifications/api/notificationService',
    '@/shared/api/recentUpdatesService': '@/features/notifications/api/recentUpdatesService',
    '@/shared/api/studentNotificationService': '@/features/notifications/api/studentNotificationService',
    
    # Analytics services
    '@/shared/api/analyticsService': '@/features/analytics/api/analyticsService',
    '@/shared/api/dashboardService': '@/features/analytics/api/dashboardService',
    '@/shared/api/optimizedQueryService': '@/features/analytics/api/optimizedQueryService',
    '@/shared/api/skillsAnalyticsService': '@/features/analytics/api/skillsAnalyticsService',
    '@/shared/api/usageStatisticsService': '@/features/analytics/api/usageStatisticsService',
    
    # Other domain services
    '@/shared/api/messageService': '@/features/messaging/api/messageService',
    '@/shared/api/pipelineService': '@/features/recruiter-pipeline/api/pipelineService',
    '@/shared/api/programService': '@/features/courses/api/programService',
    '@/shared/api/streakApiService': '@/features/student-profile/api/streakApiService',
    '@/shared/api/studentClassService': '@/features/myclass/api/studentClassService',
    '@/shared/api/studentExamService': '@/features/exams/api/studentExamService',
    '@/shared/api/migrationService': '@/features/admin/api/migrationService',
}

def fix_imports_in_file(file_path: Path, dry_run: bool = False):
    """Fix import statements in a single file."""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        changes_made = []
        
        for old_import, new_import in IMPORT_MAPPINGS.items():
            if old_import in content:
                content = content.replace(old_import, new_import)
                changes_made.append(f"{old_import} -> {new_import}")
        
        if content != original_content:
            if dry_run:
                print(f"Would update: {file_path}")
                for change in changes_made:
                    print(f"  - {change}")
                return True
            else:
                file_path.write_text(content, encoding='utf-8')
                print(f"✓ Updated: {file_path}")
                for change in changes_made:
                    print(f"  - {change}")
                return True
        
        return False
    except Exception as e:
        print(f"⚠️  Error processing {file_path}: {e}")
        return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Fix imports for moved domain services')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be done')
    args = parser.parse_args()
    
    src_root = Path('src')
    updated_count = 0
    
    print("=" * 80)
    print("Fixing imports for domain-specific services")
    print("=" * 80)
    print()
    
    for root, dirs, files in os.walk(src_root):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'dist', 'build']]
        
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                file_path = Path(root) / file
                if fix_imports_in_file(file_path, args.dry_run):
                    updated_count += 1
    
    print()
    print("=" * 80)
    print(f"Summary: {updated_count} files updated")
    if args.dry_run:
        print("(Dry run - no changes made)")
    print("=" * 80)

if __name__ == '__main__':
    main()
