const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSave() {
  console.log('--- Fetching Categories ---');
  const { data: categories, error: catError } = await supabase.from('categories').select('*');
  if (catError) {
    console.error('Error fetching categories:', catError);
  } else {
    console.log('Categories:', categories);
  }

  console.log('--- Testing Product Insertion ---');
  const testProduct = {
    name: 'Test Chair ' + Date.now(),
    description: 'A test chair created by the debug script',
    price: 99.99,
    stock: 5,
    image_url: 'https://hihlihmaeqguhoagnvuu.supabase.co/storage/v1/object/public/images/test.jpg',
    model_url: null,
    category_id: categories && categories.length > 0 ? categories[0].id : null,
    is_active: true
  };

  const { data, error: insertError } = await supabase.from('products').insert([testProduct]).select();
  if (insertError) {
    console.error('Error inserting product:', insertError);
  } else {
    console.log('Product inserted successfully:', data);
  }
}

testSave();
