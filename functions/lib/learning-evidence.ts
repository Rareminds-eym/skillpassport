/** Presentation aliases preserve the existing review contract. The assessed
 * snapshot is immutable; current profile evidence remains in its source table. */
export function presentLearningEvidence(item:any){
 if(!item||item.evidence_format!==2)return item;
 const snapshot=item.assessed_evidence;
 const expired=snapshot?.expiresOn&&snapshot.expiresOn<new Date().toISOString().slice(0,10);
 return {...item,...(expired&&['pending','approved'].includes(item.status)?{status:'expired'}:{}),title:snapshot?.title||'Evidence',description:snapshot?.content||'',evidence_url:snapshot?.url||null,evidence_content:snapshot?.content||null};
}
export function learningEvidenceContent(item:any):string{
 return item?.evidence_format===2?item.assessed_evidence?.content||'':item?.evidence_content||'';
}
