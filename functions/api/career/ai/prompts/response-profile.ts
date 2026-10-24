import type {CareerResponseProfile} from '@rareminds-eym/ai-protocol';
/** Product-owned intent policy; never an arbitrary caller-supplied token limit. */
export function careerResponseProfile(message:string):CareerResponseProfile{
 if(/\b(in detail|detailed|comprehensive|step[ -]by[ -]step|explain more|thorough|elaborate|long answer)\b/i.test(message))return 'detailed';
 if(/\b(explain|compare|walk me through)\b/i.test(message))return 'standard';
 return 'concise';
}
