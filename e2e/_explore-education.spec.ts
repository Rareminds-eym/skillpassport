import fs from 'node:fs';
import { expect, test } from '@playwright/test';
import { login, logoutLearner } from './helpers/auth';
import { createUserInbox, deleteInbox, getEmailLink } from './helpers/mailbox';
import { chooseLearnerType, learnerType } from './helpers/learner-type';
import { payWithRazorpayTestCheckout } from './helpers/razorpay';
import { buildUser } from './helpers/test-data';

// TEMPORARY exploration (deleted afterwards): same flow as learner.spec.ts, then records the Education card and modal.
const type = learnerType();

test(`EXPLORE education modal (${type})`, async ({ page }) => {
  test.setTimeout(420_000);
  const inbox = await createUserInbox('explore');
  const user = buildUser('learner', inbox.address);
  try {
    await page.goto('/signup');
    await page.locator('input[name="firstName"]').fill(user.firstName);
    await page.locator('input[name="lastName"]').fill(user.lastName);
    await page.getByText('Select date').click();
    await page.locator('button:not([disabled])').filter({ hasText: /^1$/ }).first().click();
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill(user.password);
    await page.locator('input[name="confirmPassword"]').fill(user.password);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Select your role' }).click();
    await page.getByRole('button', { name: 'Learner', exact: true }).click();
    await page.locator('select[name="country"]').selectOption({ label: 'India' });
    await expect(page.locator('select[name="state"] option')).not.toHaveCount(1);
    await page.locator('select[name="state"]').selectOption({ index: 1 });
    await expect(page.locator('select[name="city"] option')).not.toHaveCount(1);
    await page.locator('select[name="city"]').selectOption({ index: 1 });
    await page.locator('select[name="preferredLanguage"]').selectOption('en');
    await page.locator('input[name="agreeToTerms"]').check();
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page).toHaveURL(/verify-email/, { timeout: 60_000 });
    await page.goto(await getEmailLink(inbox, 'verify'));
    await expect(page.getByText('Email Verified!')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/subscription\/plans/, { timeout: 30_000 });
    await page.reload();
    const planName = page.getByRole('heading', { name: 'Career Accelerator', exact: true }).first();
    await expect(planName).toBeVisible();
    await planName.locator('xpath=ancestor::div[.//button[normalize-space()="Get Started"]][1]').getByRole('button', { name: 'Get Started' }).click();
    await expect(page).toHaveURL(/\/subscription\/payment(\?|$)/);
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveValue(user.email);
    const fullName = `${user.firstName} ${user.lastName}`;
    await page.locator('input[name="name"]').fill(fullName);
    await emailInput.fill(user.email);
    await page.locator('input[name="phone"]').fill(user.phone);
    await page.getByRole('button', { name: /Pay\s*₹\s*999\s*Securely/ }).click();
    await expect(page.locator('iframe.razorpay-checkout-frame')).toBeVisible({ timeout: 30_000 });
    await payWithRazorpayTestCheckout(page);
    await expect(page).toHaveURL(/subscription\/payment\/success/, { timeout: 60_000 });
    await page.goto('/learner/subscription/manage');
    await chooseLearnerType(page, type);
    await logoutLearner(page);
    await login(page, user, 'learner');
    await expect(page).toHaveURL(/\/learner\/dashboard/, { timeout: 60_000 });

    // ---------------- exploration ----------------
    const dir = 'test-results/explore';
    fs.mkdirSync(dir, { recursive: true });
    const report: Record<string, unknown> = {};
    const dump = async (label: string) => {
      await page.screenshot({ path: `${dir}/${label}.png` });
      report[label] = await page.evaluate(() => {
        const vis = (el: Element) => {
          const h = el as HTMLElement;
          const r = h.getBoundingClientRect();
          const st = getComputedStyle(h);
          return r.width > 0 && r.height > 0 && st.visibility !== 'hidden' && st.display !== 'none';
        };
        const buttons = [...document.querySelectorAll('button, [role=button]')].filter(vis).map((b) => ({
          text: (b.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60),
          title: b.getAttribute('title'),
          aria: b.getAttribute('aria-label'),
        }));
        const fields = [...document.querySelectorAll('input, select, textarea')].filter(vis).map((i) => {
          const f = i as HTMLInputElement;
          return { tag: i.tagName, name: f.name, type: f.type, placeholder: f.placeholder, id: i.id, value: f.value?.slice(0, 30) };
        });
        const dialogs = [...document.querySelectorAll('[role=dialog]')].filter(vis).map((d) => (d.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240));
        return { path: location.pathname, buttons, fields, dialogs };
      });
      fs.writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2));
    };
    const attempt = async (label: string, fn: () => Promise<void>) => {
      try { await fn(); } catch (e) { report[label + '-ERROR'] = String(e).slice(0, 300); fs.writeFileSync(`${dir}/report.json`, JSON.stringify(report, null, 2)); }
    };

    await page.waitForTimeout(3000);
    await dump('1-dashboard');
    await attempt('eye', async () => {
      const eye = page.getByTitle('View All Education');
      await eye.scrollIntoViewIfNeeded({ timeout: 10_000 });
      await dump('2-education-card-visible');
      await eye.click({ timeout: 10_000 });
      await page.waitForTimeout(2000);
      await dump('3-education-modal');
    });
    await attempt('add', async () => {
      await page.getByRole('button', { name: /add/i }).first().click({ timeout: 10_000 });
      await page.waitForTimeout(1500);
      await dump('4-after-add-click');
    });
    await attempt('fill', async () => {
      await page.getByPlaceholder('e.g., Bachelor of Science').fill('E2E Explore Degree');
      await page.getByPlaceholder('e.g., MIT').fill('E2E Explore University');
      await dump('5-form-filled');
    });
    await attempt('submit', async () => {
      await page.getByRole('button', { name: /^Add Education$/ }).click({ timeout: 10_000 });
      await page.waitForTimeout(3000);
      await dump('6-after-submit');
    });
    await attempt('reload', async () => {
      await page.reload();
      await page.waitForTimeout(4000);
      await dump('7-after-reload');
    });
  } finally {
    await deleteInbox(inbox);
  }
});
