import type { SupabaseClient } from '@supabase/supabase-js';

/** Legacy attendance endpoints cannot read, mutate or insert delegated teaching sessions. */
export function legacyTeachingClient<T extends SupabaseClient>(client:T):T {
  const scoped=new Set(['college_attendance_sessions','college_attendance_records']);
  return new Proxy(client,{get(target,key){
    if(key!=='from'){const value=Reflect.get(target,key);return typeof value==='function'?value.bind(target):value;}
    return (table:string)=>{
      const query=target.from(table);if(!scoped.has(table))return query;
      return new Proxy(query,{get(builder,method){
        const value=Reflect.get(builder,method);
        if(typeof value!=='function')return value;
        return (...args:any[])=>{
          if(method==='insert'||method==='upsert'){
            const rows=Array.isArray(args[0])?args[0]:[args[0]];
            args[0]=rows.map(row=>({...row,...(table==='college_attendance_sessions'?{instructor_source:'legacy_college'}:{organization_staff_id:null})}));
          }
          const result=value.apply(builder,args);
          if(!['select','update','delete'].includes(String(method)))return result;
          if(table==='college_attendance_records')return result.is('organization_staff_id',null);
          return result.eq('instructor_source','legacy_college');
        };
      }});
    };
  }}) as T;
}
