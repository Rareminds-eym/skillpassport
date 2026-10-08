import { expect, type Page } from '@playwright/test';
import type { TestUser } from './test-data';

/**
 * Logs out through the learner header's profile menu (the real UI), then waits for the login page.
 * The profile button is an icon without a label: it is the last VISIBLE round button in the header
 * (after the bell). A hidden round button follows it: the mobile menu toggle, which is not shown on desktop.
 */
export async function logoutLearner(page: Page): Promise<void> {
  await page.locator('header button.rounded-full:visible').last().click();
  await page.getByRole('button', { name: 'Logout' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
}

/**
 * Logs in through the real login form: email, password and the role the user wants to log in as
 * (the option value of the "Select Role" dropdown, for example 'learner').
 * The caller checks where the app sends the user afterwards.
 */
export async function login(page: Page, user: Pick<TestUser, 'email' | 'password'>, role: string): Promise<void> {
  await page.locator('input[name="email"]').fill(user.email);
  await page.locator('input[name="password"]').fill(user.password);
  await page.locator('select[name="role"]').selectOption(role);
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
}
