const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('--- Creating Admin Account ---');
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@gmail.com',
    password: 'Password123!',
    options: {
      data: {
        is_admin: true,
        username: 'admin',
      }
    }
  });

  if (error) {
    console.error('Error creating admin:', error.message);
  } else {
    console.log('Admin account created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: Password123!');
    console.log('You should now be able to log in to the admin dashboard.');
  }
}

createAdmin();
