import { expect, test } from '@playwright/test';
import { login, logoutLearner } from './helpers/auth';
import { createUserInbox, deleteInbox, getEmailLink } from './helpers/mailbox';
import { chooseLearnerType, learnerType } from './helpers/learner-type';
import { payWithRazorpayTestCheckout } from './helpers/razorpay';
import { buildUser, recordInManifest } from './helpers/test-data';

// Which learner type to pick in the first-login pop-up: E2E_LEARNER_TYPE (default school_student).
// Read at load time, so an invalid value stops the run straight away.
const type = learnerType();

// Phase 1: real learner signup, real email verification and a real test payment.
// Signup UI -> existing SSO / email worker / SES -> mailbox -> read the email -> open the link -> verified,
// then choose Career Accelerator, pay in Razorpay's test checkout and confirm the subscription exists.
// Then logout and a real login, which must land on the learner dashboard.
// The feature steps and the final logout/login are added next.
test(`learner (${type}) signs up and verifies the email with the real verification email`, async ({ page }) => {
  test.setTimeout(300_000); // signup + email + payment + login is longer than the 120 s default
  console.log(`[e2e] learner type: ${type}`);
  const inbox = await createUserInbox('learner');
  const user = buildUser('learner', inbox.address);
  recordInManifest(user);

  try {
    // ---- Signup, step 1 ----
    await page.goto('/signup');
    await page.locator('input[name="firstName"]').fill(user.firstName);
    await page.locator('input[name="lastName"]').fill(user.lastName);
    await page.getByText('Select date').click();
    await page.locator('button:not([disabled])').filter({ hasText: /^1$/ }).first().click();
    await page.locator('input[name="email"]').fill(user.email);
    await page.locator('input[name="password"]').fill(user.password);
    await page.locator('input[name="confirmPassword"]').fill(user.password);
    await page.getByRole('button', { name: 'Continue' }).click();

    // ---- Signup, step 2 ----
    await page.getByRole('button', { name: 'Select your role' }).click();
    await page.getByRole('button', { name: 'Learner', exact: true }).click();
    await page.locator('select[name="country"]').selectOption({ label: 'India' });
    await expect(page.locator('select[name="state"] option')).not.toHaveCount(1);
    await page.locator('select[name="state"]').selectOption({ index: 1 });
    await expect(page.locator('select[name="city"] option')).not.toHaveCount(1);
    await page.locator('select[name="city"]').selectOption({ index: 1 });
    await page.locator('select[name="preferredLanguage"]').selectOption('en'); // English
    await page.locator('input[name="agreeToTerms"]').check();
    await page.getByRole('button', { name: 'Create Account' }).click();

    // ---- The account exists but is unverified: the app holds the user on /verify-email ----
    await expect(page).toHaveURL(/verify-email/, { timeout: 60_000 });
    await expect(page.getByText('Email Verification Required')).toBeVisible();

    // ---- The existing flow sent a real email; read the link from the mailbox and open it once ----
    const link = await getEmailLink(inbox, 'verify');
    await page.goto(link);
    await expect(page.getByText('Email Verified!')).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/subscription\/plans/, { timeout: 30_000 });

    // The login token the browser holds was issued just before the email was verified and still says
    // "not verified"; the payment API rejects it (403 Email verification required) until it is renewed.
    // A reload renews it from the session cookie, like any user coming back to the page.
    await page.reload();

    // ---- Plan: Career Accelerator (the free "Discover" card has the same button, so scope to the card) ----
    const planName = page.getByRole('heading', { name: 'Career Accelerator', exact: true }).first();
    await expect(planName).toBeVisible();
    await planName
      .locator('xpath=ancestor::div[.//button[normalize-space()="Get Started"]][1]')
      .getByRole('button', { name: 'Get Started' })
      .click();

    // ---- Payment page (the app's own form; the order is created when we submit it) ----
    await expect(page).toHaveURL(/\/subscription\/payment(\?|$)/);
    await expect(page.getByRole('heading', { name: 'Complete Payment' })).toBeVisible();
    // The page pre-fills the form from the user's profile a moment after it opens and replaces all three fields.
    // Wait for that (the email appears) so it cannot overwrite what we type next.
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveValue(user.email);
    const fullName = `${user.firstName} ${user.lastName}`;
    await page.locator('input[name="name"]').fill(fullName);
    await emailInput.fill(user.email);
    await page.locator('input[name="phone"]').fill(user.phone);
    await expect(page.locator('input[name="name"]')).toHaveValue(fullName);
    await page.getByRole('button', { name: /Pay\s*₹\s*999\s*Securely/ }).click();

    // ---- Razorpay checkout opens (the app asked Razorpay for a real test order first) ----
    await expect(page.locator('iframe.razorpay-checkout-frame')).toBeVisible({ timeout: 30_000 });

    // ---- Complete the test payment in Razorpay's own checkout (third-party UI only) ----
    await payWithRazorpayTestCheckout(page);

    // The app verifies the payment with Razorpay and creates the subscription, then shows its success page.
    await expect(page).toHaveURL(/subscription\/payment\/success/, { timeout: 60_000 });

    // The success page also appears when verification fails, so prove the subscription really exists:
    // the learner's manage page must show the plan.
    await page.goto('/learner/subscription/manage');

    // A new learner has no type yet, so the app asks on the first learner page. Answer it before anything else.
    await chooseLearnerType(page, type);
    await expect(page.getByText('Career Accelerator').first()).toBeVisible({ timeout: 30_000 });

    // ---- Logout, then the real login form (signup logged us in automatically, so this is the first real login) ----
    await logoutLearner(page);
    await login(page, user, 'learner');

    // A fresh login must bring the learner back to the learner dashboard.
    await expect(page).toHaveURL(/\/learner\/dashboard/, { timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Dashboard' }).first()).toBeVisible();
  } finally {
    await deleteInbox(inbox);
  }
});
