// @public-endpoint: Starts browser-bound campaign SSO; accepts no identity input.
import { startCampaignHandoff } from '../../lib/campaign-handoff';
export const onRequestGet = ({ request, env }: any) => startCampaignHandoff(request, env);
