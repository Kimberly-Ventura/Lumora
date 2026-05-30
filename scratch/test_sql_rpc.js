const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODgxMjI1OSwiZXhwIjoyMDk0Mzg4MjU5fQ.MI97Th6NcbegP2TvZ3n5we8gn1NBEF-WHdpxWnjWyVU';
const supabase = createClient(supabaseUrl, serviceKey);

async function testRPC() {
  const commonNames = ['exec_sql', 'execute_sql', 'run_sql', 'sql'];
  for (const name of commonNames) {
    try {
      console.log(`Testing RPC: ${name}...`);
      const { data, error } = await supabase.rpc(name, { sql: 'SELECT 1;' });
      if (error) {
        console.log(`RPC ${name} returned error:`, error.message);
      } else {
        console.log(`RPC ${name} success! Data:`, data);
        return;
      }
    } catch (e) {
      console.log(`RPC ${name} exception:`, e.message);
    }
  }
}

testRPC();
