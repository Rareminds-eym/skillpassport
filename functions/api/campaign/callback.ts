// @public-endpoint: Validates receiver state before exchanging a one-use SSO code.
import { completeCampaignHandoff } from '../../lib/campaign-handoff';
export const onRequestGet = ({ request, env }: any) => completeCampaignHandoff(request, env);
