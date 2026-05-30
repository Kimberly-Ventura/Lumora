import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('c:/Users/COMPUTER 26/E-Commerce/Lumora/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseAnonKeyMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
const supabaseServiceKeyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const supabaseKey = supabaseServiceKeyMatch ? supabaseServiceKeyMatch[1].trim() : (supabaseAnonKeyMatch ? supabaseAnonKeyMatch[1].trim() : '');

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeTestChair() {
  console.log('Attempting to delete test chair...');
  
  // First, we should find the ID of the test chair, just in case there are multiple or the name varies slightly
  const { data: testChairs, error: findError } = await supabase
    .from('products')
    .select('id, name')
    .ilike('name', '%Test Chair%');
    
  if (findError) {
    console.error('Error finding test chair:', findError);
    return;
  }
  
  if (!testChairs || testChairs.length === 0) {
    console.log('No test chairs found!');
    return;
  }
  
  console.log(`Found ${testChairs.length} test chairs to remove:`, testChairs);
  
  for (const chair of testChairs) {
    // Delete order_items first if any exist for this product (to avoid foreign key constraint errors)
    console.log(`Deleting related order items for ${chair.id}...`);
    await supabase.from('order_items').delete().eq('product_id', chair.id);
    
    // Delete the product
    console.log(`Deleting product ${chair.name} (${chair.id})...`);
    const { error: deleteError } = await supabase.from('products').delete().eq('id', chair.id);
    
    if (deleteError) {
      console.error(`Failed to delete ${chair.id}:`, deleteError);
      
      // Fallback: Archive it if deletion is blocked
      console.log('Falling back to archive...');
      await supabase.from('products').update({ is_active: false, is_archived: true }).eq('id', chair.id);
      console.log('Archived successfully instead.');
    } else {
      console.log(`Successfully deleted ${chair.name}.`);
    }
  }
}

removeTestChair();
