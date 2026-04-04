#!/usr/bin/env python3
"""
Fix entity dependencies on stores by updating call sites to pass store data as parameters.
This script updates all files that call refactored entity hooks to pass required dependencies.
"""

from pathlib import Path
import re

def fix_use_recruitment_funnel():
    """Fix useRecruitmentFunnel to accept getRecruitmentFunnelStats as parameter"""
    
    # 1. Fix the entity hook to accept the function as parameter
    entity_file = Path('src/entities/user/model/useRecruitmentFunnel.ts')
    if entity_file.exists():
        content = entity_file.read_text(encoding='utf-8')
        
        # Add parameter to hook signature
        content = re.sub(
            r'export const useRecruitmentFunnel = \(\{ preset, startDate, endDate \}: UseRecruitmentFunnelOptions\)',
            r'export const useRecruitmentFunnel = (\n  { preset, startDate, endDate }: UseRecruitmentFunnelOptions,\n  getRecruitmentFunnelStats: (preset: FunnelRangePreset, startDate?: string, endDate?: string) => Promise<{ data: any }>\n)',
            content
        )
        
        entity_file.write_text(content, encoding='utf-8')
        print(f"✓ Fixed {entity_file}")
    
    # 2. Fix the call site in Analytics.tsx
    analytics_file = Path('src/pages/recruiter/Analytics.tsx')
    if analytics_file.exists():
        content = analytics_file.read_text(encoding='utf-8')
        
        # Add import for getRecruitmentFunnelStats
        if 'getRecruitmentFunnelStats' not in content:
            # Find the analytics imports section
            content = re.sub(
                r'(import \{ useAnalyticsKPIs, useSpeedAnalytics \} from \'@/features/analytics\';)',
                r"import { useAnalyticsKPIs, useSpeedAnalytics, getRecruitmentFunnelStats } from '@/features/analytics';\n\\1",
                content
            )
        
        # Update the hook call to pass the function
        content = re.sub(
            r'const \{ data: liveFunnel, isLoading: funnelLoading \} = useRecruitmentFunnel\(\{',
            r'const { data: liveFunnel, isLoading: funnelLoading } = useRecruitmentFunnel({',
            content
        )
        
        # Add the function parameter after the options object
        content = re.sub(
            r'(const \{ data: liveFunnel, isLoading: funnelLoading \} = useRecruitmentFunnel\(\{\s+preset: funnelPreset,\s+startDate: filters\.dateRange\.startDate \|\| undefined,\s+endDate: filters\.dateRange\.endDate \|\| undefined,\s+\})\)',
            r'\1, getRecruitmentFunnelStats)',
            content
        )
        
        analytics_file.write_text(content, encoding='utf-8')
        print(f"✓ Fixed {analytics_file}")

def fix_use_role_responsibilities():
    """Fix useRoleResponsibilities to accept counselling functions as parameters"""
    
    entity_file = Path('src/entities/user/model/useRoleResponsibilities.ts')
    if entity_file.exists():
        content = entity_file.read_text(encoding='utf-8')
        
        # The hook already has the pattern documented but calls undefined functions
        # Add the interface and parameter
        if 'interface CounsellingAPI' not in content:
            # Add interface before the hook
            interface_def = '''
/**
 * Counselling API interface for dependency injection
 */
interface CounsellingAPI {
  generateRoleResponsibilities: (roleName: string, clusterTitle: string) => Promise<string[]>;
  getFallbackResponsibilities: (roleName: string) => string[];
}

'''
            content = re.sub(
                r'(export function useRoleResponsibilities\()',
                interface_def + r'\1',
                content
            )
        
        # Update function signature to accept counsellingAPI parameter
        content = re.sub(
            r'export function useRoleResponsibilities\(\s+roleName: string \| null,\s+clusterTitle: string\s+\)',
            r'export function useRoleResponsibilities(\n  roleName: string | null,\n  clusterTitle: string,\n  counsellingAPI: CounsellingAPI\n)',
            content
        )
        
        # Update the function calls to use the injected API
        content = re.sub(
            r'const result = await generateRoleResponsibilities\(role, cluster\);',
            r'const result = await counsellingAPI.generateRoleResponsibilities(role, cluster);',
            content
        )
        
        content = re.sub(
            r'const fallback = getFallbackResponsibilities\(role\);',
            r'const fallback = counsellingAPI.getFallbackResponsibilities(role);',
            content
        )
        
        entity_file.write_text(content, encoding='utf-8')
        print(f"✓ Fixed {entity_file}")

def fix_use_requisitions():
    """Fix useRequisitions to accept getRequisitions as parameter"""
    
    entity_file = Path('src/entities/user/model/useRequisitions.ts')
    if entity_file.exists():
        content = entity_file.read_text(encoding='utf-8')
        
        # Update function signature
        content = re.sub(
            r'export const useRequisitions = \(\) => \{',
            r'export const useRequisitions = (\n  getRequisitions: () => Promise<{ data: any; error: any }>\n) => {',
            content
        )
        
        entity_file.write_text(content, encoding='utf-8')
        print(f"✓ Fixed {entity_file}")

def fix_use_user_role_calls():
    """Fix all call sites of useUserRole to pass user and role from stores"""
    
    files_to_fix = [
        'src/shared/ui/debug/RoleDebugger.tsx',
        'src/pages/admin/schoolAdmin/components/TimetableAllocation.tsx',
        'src/pages/admin/schoolAdmin/components/TeacherOnboarding.tsx',
        'src/pages/admin/schoolAdmin/components/TeacherManagementDashboard.tsx',
        'src/pages/admin/schoolAdmin/components/DocumentVerificationWorkflow.tsx',
    ]
    
    for file_path in files_to_fix:
        filepath = Path(file_path)
        if not filepath.exists():
            continue
            
        content = filepath.read_text(encoding='utf-8')
        
        # Check if useUser is already imported
        has_use_user = 'useUser' in content and '@/stores' in content
        
        # If useUser is not imported, add it
        if not has_use_user:
            # Find the imports section and add useUser
            content = re.sub(
                r'(import.*from [\'"]@/entities/user[\'"];)',
                r"import { useUser } from '@/stores';\n\1",
                content
            )
        
        # Find useUserRole calls and update them
        # Pattern: const { ... } = useUserRole();
        # Replace with: const user = useUser(); const { ... } = useUserRole(user, user?.role);
        
        # First, add user hook call if not present
        if 'const user = useUser()' not in content and 'const { user' not in content:
            content = re.sub(
                r'(const \{[^}]+\} = useUserRole\(\);)',
                r'const user = useUser();\n  \1',
                content
            )
        
        # Update useUserRole calls to pass parameters
        content = re.sub(
            r'useUserRole\(\)',
            r'useUserRole(user, user?.role)',
            content
        )
        
        filepath.write_text(content, encoding='utf-8')
        print(f"✓ Fixed {filepath}")

def remove_use_user_export_from_entity():
    """Remove the re-export of useUser from entities/user index"""
    
    entity_index = Path('src/entities/user/index.ts')
    if entity_index.exists():
        content = entity_index.read_text(encoding='utf-8')
        
        # Remove the useUser re-export and its comment
        content = re.sub(
            r'// Re-export useUser from stores for convenience\nexport \{ useUser \} from [\'"]@/stores/authStore[\'"];\n\n',
            '',
            content
        )
        
        entity_index.write_text(content, encoding='utf-8')
        print(f"✓ Removed useUser re-export from {entity_index}")

def main():
    print("Fixing entity store dependencies...")
    print()
    
    # Fix each entity hook
    fix_use_recruitment_funnel()
    fix_use_role_responsibilities()
    fix_use_requisitions()
    
    # Fix call sites
    fix_use_user_role_calls()
    
    # Remove store re-export from entity
    remove_use_user_export_from_entity()
    
    print()
    print("✓ All entity store dependencies fixed!")
    print()
    print("Next steps:")
    print("1. Run 'npm run build:dev' to verify the build")
    print("2. Check for any remaining import errors")

if __name__ == '__main__':
    main()
