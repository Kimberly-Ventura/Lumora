const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  console.log('--- Finding Test Chairs ---');
  const { data, error } = await supabase.from('products').select('*').ilike('name', 'Test Chair%');
  
  if (error) {
    console.error('Error fetching test chairs:', error);
    return;
  }
  
  if (!data || data.length === 0) {
    console.log('No Test Chairs found!');
    return;
  }

  console.log(`Found ${data.length} test chairs. Proceeding to delete...`);
  
  for (const product of data) {
    const { error: deleteError } = await supabase.from('products').delete().eq('id', product.id);
    if (deleteError) {
      console.error(`Error deleting product ${product.id}:`, deleteError);
    } else {
      console.log(`Deleted product: ${product.name} (ID: ${product.id})`);
    }
  }
  
  console.log('Cleanup finished.');
}

cleanup();
