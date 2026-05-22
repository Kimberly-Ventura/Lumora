const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listProducts() {
  console.log('--- Fetching Products from Supabase ---');
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return;
  }
  console.log(`Found ${data.length} products:`);
  data.forEach(p => {
    console.log(`ID: ${p.id} | Name: ${p.name} | Price: ${p.price} | Active: ${p.is_active} | Image: ${p.image_url} | Model: ${p.model_url}`);
  });
}

listProducts();
