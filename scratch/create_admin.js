import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve('c:/Users/COMPUTER 26/E-Commerce/Lumora/.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrlMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const supabaseAnonKeyMatch = envContent.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

const supabaseUrl = supabaseUrlMatch ? supabaseUrlMatch[1].trim() : '';
const supabaseKey = supabaseAnonKeyMatch ? supabaseAnonKeyMatch[1].trim() : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
  console.log('Re-creating admin account...');
  
  const { data, error } = await supabase.auth.signUp({
    email: 'admin@gmail.com',
    password: 'admin1',
    options: {
      data: {
        is_admin: true,
        username: 'Admin'
      }
    }
  });

  if (error) {
    console.error('Failed to create admin:', error.message);
  } else {
    console.log('Successfully re-created admin account! You can now sign in.');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin1');
  }
}

createAdmin();
