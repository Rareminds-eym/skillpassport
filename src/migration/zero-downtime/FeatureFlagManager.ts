/**
 * Feature flag manager for incremental migration rollout
 */

import { MigrationFeatureFlag } from '@/shared/types/zero-downtime'

export class FeatureFlagManager {
  private flags: Map<string, MigrationFeatureFlag> = new Map()

  /**
   * Register a feature flag for migration control
   */
  registerFlag(flag: MigrationFeatureFlag): void {
    this.flags.set(flag.name, flag)
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagName: string): boolean {
    const flag = this.flags.get(flagName)
    if (!flag) {
      return false
    }

    if (!flag.enabled) {
      return false
    }

    // Check rollout percentage
    const random = Math.random() * 100
    return random < flag.rolloutPercentage
  }

  /**
   * Update rollout percentage for gradual cutover
   */
  updateRollout(flagName: string, percentage: number): void {
    const flag = this.flags.get(flagName)
    if (flag) {
      flag.rolloutPercentage = Math.max(0, Math.min(100, percentage))
    }
  }

  /**
   * Enable a feature flag
   */
  enable(flagName: string): void {
    const flag = this.flags.get(flagName)
    if (flag) {
      flag.enabled = true
    }
  }

  /**
   * Disable a feature flag
   */
  disable(flagName: string): void {
    const flag = this.flags.get(flagName)
    if (flag) {
      flag.enabled = false
    }
  }

  /**
   * Get all registered flags
   */
  getAllFlags(): MigrationFeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Get flag status
   */
  getFlag(flagName: string): MigrationFeatureFlag | undefined {
    return this.flags.get(flagName)
  }

  /**
   * Initialize default migration flags
   */
  initializeDefaultFlags(): void {
    const defaultFlags: MigrationFeatureFlag[] = [
      {
        name: 'use-entities-layer',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Enable new entities layer structure'
      },
      {
        name: 'use-widgets-layer',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Enable new widgets layer structure'
      },
      {
        name: 'use-new-import-paths',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Use standardized import paths'
      },
      {
        name: 'enable-performance-optimizations',
        enabled: false,
        rolloutPercentage: 0,
        description: 'Enable performance optimizations'
      }
    ]

    defaultFlags.forEach(flag => this.registerFlag(flag))
  }
}
