const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStorage() {
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error fetching buckets:', bucketsError);
    return;
  }
  console.log('Buckets:', buckets.map(b => b.name));

  for (const bucket of buckets) {
    const { data: files, error: filesError } = await supabase.storage.from(bucket.name).list();
    if (filesError) {
      console.error(`Error fetching files for bucket ${bucket.name}:`, filesError);
      continue;
    }
    console.log(`Files in ${bucket.name}:`, files.map(f => f.name));
  }
}

checkStorage();
