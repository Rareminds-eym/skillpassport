/**
 * Get the latest reset token for testing
 */

async function getLatestToken() {
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    'https://dpooleduinyyzxgrcwko.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTk5NDY5OCwiZXhwIjoyMDc1NTcwNjk4fQ.WIrwkA_-2oCjwmD6WpCf9N38hYXEwrIIXXHB4x5km10'
  );
  
  try {
    const { data: tokens, error } = await supabase
      .from('reset_tokens')
      .select('*')
      .eq('email', 'test@example.com')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    if (tokens && tokens.length > 0) {
      const token = tokens[0];
      console.log('Latest token:', token.token);
      console.log('Email:', token.email);
      console.log('Expires:', new Date(token.expires_at).toLocaleString());
      console.log('Reset URL:', `http://localhost:3000/password-reset?token=${token.token}`);
    } else {
      console.log('No tokens found');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

getLatestToken();