import {createContext,useContext} from 'react';
export interface TeachingContext {
  external:true;
  delegatedAccess:boolean;
  retainExpiredAssignments?:boolean;
  staff:{id:string;name:string;first_name:string;last_name:string};
  mappings:Array<{id:string;college_id:string;college_name:string;section_id:string;program_name:string;semester:number;section:string;course_id:string;course_title:string}>;
}
export const AssignedTeachingContext=createContext<TeachingContext|null>(null);
export const useAssignedTeaching=()=>useContext(AssignedTeachingContext);
