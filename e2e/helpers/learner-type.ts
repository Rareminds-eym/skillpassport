import { expect, type Page } from '@playwright/test';

/** Learner types offered by the "Welcome! Tell us about yourself" pop-up, and the label of each button. */
const LEARNER_TYPES = {
  school_student: 'School Student',
  college_student: 'College Student',
  teacher: 'Teacher',
} as const;

export type LearnerType = keyof typeof LEARNER_TYPES;

/** Reads E2E_LEARNER_TYPE (default school_student). Throws at once, listing the valid values, if it is invalid. */
export function learnerType(): LearnerType {
  const value = process.env.E2E_LEARNER_TYPE?.trim() || 'school_student';
  if (!Object.hasOwn(LEARNER_TYPES, value)) {
    throw new Error(`E2E_LEARNER_TYPE is "${value}". Valid values: ${Object.keys(LEARNER_TYPES).join(', ')}.`);
  }
  return value as LearnerType;
}

/**
 * Answers the pop-up the app shows a new learner on the first learner page (their type is still empty).
 * It cannot be closed, so the type must be chosen before the page can be used.
 */
export async function chooseLearnerType(page: Page, type: LearnerType): Promise<void> {
  const title = page.getByText('Welcome! Tell us about yourself').first();
  await expect(title).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: new RegExp(`^${LEARNER_TYPES[type]}`) }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(title).toBeHidden({ timeout: 30_000 });
}
