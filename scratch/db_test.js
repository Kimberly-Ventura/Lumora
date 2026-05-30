const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProducts() {
  console.log('Querying Supabase products table...');
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    // Let's try selecting without updated_at just in case
    console.log('Attempting fetch with fallback order (created_at)...');
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (fallbackError) {
      console.error('Fallback error:', fallbackError);
    } else {
      console.log(`Success! Found ${fallbackData.length} products (fallback).`);
      printProducts(fallbackData);
    }
  } else {
    console.log(`Success! Found ${data.length} products.`);
    printProducts(data);
  }
}

function printProducts(products) {
  products.forEach((p, idx) => {
    console.log(`\n[${idx + 1}] ID: ${p.id}`);
    console.log(`    Name:        ${p.name}`);
    console.log(`    Stock:       ${p.stock}`);
    console.log(`    Is Active:   ${p.is_active}`);
    console.log(`    Is Archived: ${p.is_archived}`);
    console.log(`    Created At:  ${p.created_at}`);
    console.log(`    Updated At:  ${p.updated_at}`);
    console.log(`    On Sale:     ${p.on_sale}`);
  });
}

checkProducts();
