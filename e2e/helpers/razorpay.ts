import type { Page } from '@playwright/test';

/**
 * Drives Razorpay's hosted TEST checkout. This is third-party UI only: it creates no order, no
 * subscription and writes nothing to a database. The app already created the order before the
 * checkout opened, and the app verifies the payment and creates the subscription afterwards.
 *
 * Screens seen in a manual run: checkout iframe -> Net Banking -> HDFC Bank -> a separate window
 * "Razorpay Bank" (api.razorpay.com/.../mocksharp/payment) with Success and Failure buttons -> Success.
 * The caller then waits for the app's own success page.
 */
export async function payWithRazorpayTestCheckout(page: Page): Promise<void> {
  const checkout = page.frameLocator('iframe.razorpay-checkout-frame');

  await checkout.getByText(/net\s*banking/i).first().click();

  // The mock bank page opens in a new window when the bank is chosen. Listen before the click.
  const bankWindow = page.context().waitForEvent('page', { timeout: 60_000 });
  bankWindow.catch(() => undefined); // no unhandled rejection if an earlier step throws first
  await checkout.getByText('HDFC Bank', { exact: true }).first().click();

  // The manual run needed no extra button. If the window does not open, press Pay/Continue once.
  let bank = await Promise.race([
    bankWindow,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), 5_000)),
  ]);
  if (!bank) {
    await checkout.getByRole('button', { name: /^(pay|continue|proceed)/i }).first().click();
    bank = await bankWindow;
  }

  await bank.getByRole('button', { name: 'Success' }).click();
}
