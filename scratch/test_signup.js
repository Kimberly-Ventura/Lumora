import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = 'test_trigger@lumora.com';
  const password = 'Password123!';

  console.log('Attempting sign up with full_name...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: 'test_trigger',
        full_name: 'Test Trigger',
        name: 'Test Trigger'
      }
    }
  });
  
  if (signUpError) {
    console.error('Sign up failed:', signUpError.message);
  } else {
    console.log('Sign up successful!');
  }
}

main();
