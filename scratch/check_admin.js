import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const email = 'admin@lumora.com';
  const password = 'Password123!';

  // Try to sign in first
  console.log('Attempting sign in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in failed:', signInError.message);
    
    // If sign in fails, try to sign up
    console.log('Attempting sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: 'admin_unique_' + Date.now(), // Random username
        }
      }
    });
    
    if (signUpError) {
      console.error('Sign up failed:', signUpError.message);
    } else {
      console.log('Sign up successful! Please log in with email:', email, 'and password:', password);
      // Wait a moment and sign in again
      const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError2) {
         console.error('Second sign in failed:', signInError2.message);
      } else {
         console.log('Second sign in successful!');
      }
    }
  } else {
    console.log('Sign in successful! Admin account already exists and works with the password.');
  }
}

main();
