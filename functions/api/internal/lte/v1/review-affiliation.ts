/** University-college row ids are never interchangeable with organization ids. */
export async function resolveReviewCollege(db:{query<T=unknown>(path:string):Promise<T[]>},learner:{college_id?:string|null;university_college_id?:string|null}):Promise<string|null>{
 if(!learner.university_college_id)return learner.college_id||null;
 const rows=await db.query<{college_id:string|null}>(`university_colleges?id=eq.${learner.university_college_id}&account_status=eq.active&select=college_id&limit=2`);
 if(rows.length!==1||!rows[0]?.college_id)throw new Error('Institution reviewer mapping requires administrator correction.');
 if(learner.college_id&&learner.college_id!==rows[0].college_id)throw new Error('Institution reviewer mapping is ambiguous.');
 return rows[0].college_id;
}
