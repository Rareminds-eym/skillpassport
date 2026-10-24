import {describe,it,expect} from 'vitest';
import {careerResponseProfile} from '../response-profile';
describe('Career response depth',()=>{
 it.each([['Hi','concise'],['Explain data analyst careers','standard'],['Explain in detail with a step-by-step learning plan','detailed']])('maps %s to %s',(message,profile)=>{expect(careerResponseProfile(message)).toBe(profile);});
});
