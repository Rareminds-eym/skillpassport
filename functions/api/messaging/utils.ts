// Utility functions for messaging

async function convertApplicationId(supabase: any, applicationId: number | string | undefined): Promise<number | undefined> {
  if (!applicationId) return undefined;
  if (typeof applicationId === 'string' && applicationId.includes('-')) {
    const { data } = await supabase.from('applied_jobs').select('id_old').eq('id', applicationId).maybeSingle();
    return data?.id_old;
  }
  return typeof applicationId === 'string' ? parseInt(applicationId) : applicationId;
}

async function convertOpportunityId(supabase: any, opportunityId: number | string | undefined): Promise<number | undefined> {
  if (!opportunityId) return undefined;
  if (typeof opportunityId === 'string' && opportunityId.includes('-')) {
    const { data } = await supabase.from('opportunities').select('id_old').eq('id', opportunityId).maybeSingle();
    return data?.id_old;
  }
  return typeof opportunityId === 'string' ? parseInt(opportunityId) : opportunityId;
}

async function fetchEducatorDetailsForConversations(supabase: any, conversations: any[]): Promise<any[]> {
  if (!conversations || conversations.length === 0) return conversations;
  const schoolEducatorConvs = conversations.filter((c: any) => c.conversation_type === 'learner_educator');
  const collegeEducatorConvs = conversations.filter((c: any) => c.conversation_type === 'learner_college_educator');

  if (schoolEducatorConvs.length > 0) {
    const ids = schoolEducatorConvs.map((c: any) => c.educator_id).filter(Boolean);
    if (ids.length > 0) {
      const { data: educators } = await supabase.from('school_educators').select('id, user_id, first_name, last_name, email, phone_number, photo_url').in('id', ids);
      if (educators) {
        schoolEducatorConvs.forEach((conv: any) => { const e = educators.find((x: any) => x.id === conv.educator_id); if (e) conv.educator = e; });
      }
    }
  }

  if (collegeEducatorConvs.length > 0) {
    const ids = collegeEducatorConvs.map((c: any) => c.educator_id).filter(Boolean);
    if (ids.length > 0) {
      const { data: lecturers } = await supabase.from('college_lecturers').select('id, user_id, first_name, last_name, email, phone, department, specialization').in('id', ids);
      if (lecturers) {
        collegeEducatorConvs.forEach((conv: any) => { const e = lecturers.find((x: any) => x.id === conv.educator_id); if (e) conv.educator = e; });
      }
    }
  }

  return conversations;
}

export { convertApplicationId, convertOpportunityId, fetchEducatorDetailsForConversations };
