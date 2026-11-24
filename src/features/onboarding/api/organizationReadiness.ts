/** Wait for the existing projection; a timeout is a failure, never a dashboard success. */
export async function waitForOrganizationReadiness(check: () => Promise<boolean>) {
  for (let attempt = 0; attempt < 20; attempt++) {
    if (await check()) return;
    if (attempt < 19) await new Promise(resolve => setTimeout(resolve, 500));
  }
  throw new Error('Your organization was saved, but is not ready yet. Check its status again; do not create it again.');
}
