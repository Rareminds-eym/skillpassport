import { generateLteCode } from '../api/lteSsoApi';

const LTE_SSO_STATE_KEY = 'lte_sso_state';

export async function navigateToLTE(): Promise<void> {
  try {
    const { redirectUrl } = await generateLteCode();
    const url = new URL(redirectUrl);
    const state = url.searchParams.get('state');

    if (state) {
      sessionStorage.setItem(LTE_SSO_STATE_KEY, state);
    }

    window.location.href = redirectUrl;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to navigate to LTE');
  }
}
