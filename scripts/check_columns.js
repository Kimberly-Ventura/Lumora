const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  // Check current columns
  const { data, error } = await supabase.from('products').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
    return;
  }
  const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
  console.log('Current columns:', cols.join(', '));
  console.log('Has discount_percentage:', cols.includes('discount_percentage'));
}

main().catch(console.error);
