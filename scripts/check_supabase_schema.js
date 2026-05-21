const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Fetching OpenAPI schema from PostgREST...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    if (!res.ok) {
      console.error('Failed to fetch:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log('Tables in OpenAPI schema:', Object.keys(data.paths || {}));
    console.log('Definitions:', Object.keys(data.definitions || {}));
  } catch (err) {
    console.error('Error fetching OpenAPI schema:', err);
  }
}

checkSchema();
