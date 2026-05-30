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

async function checkProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Products:', JSON.stringify(data, null, 2));
  }
}

checkProducts();
