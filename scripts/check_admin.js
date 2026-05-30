const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSignupFull() {
  console.log('--- Trying to signup with full metadata ---');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@gmail.com',
    password: 'Password123!',
    options: {
      data: {
        username: 'admin',
        email: 'admin@gmail.com',
        role: 'customer',
        is_admin: true,
        full_name: 'Admin User',
        avatar_url: ''
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error.message);
  } else {
    console.log('Signup successful!', data.user.id);
  }
}

testSignupFull();
