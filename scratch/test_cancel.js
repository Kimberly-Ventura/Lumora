const URL = 'https://hihlihmaeqguhoagnvuu.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpaGxpaG1hZXFndWhvYWdudnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTIyNTksImV4cCI6MjA5NDM4ODI1OX0.A67RbWrCTgVk0YPLHth4VJE4oSEJK9Gbv6WRhcrvgsQ';

const HEADERS = {
  'apikey': KEY,
  'Authorization': `Bearer ${KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function testCancel() {
  try {
    console.log('1. Creating order...');
    const orderRes = await fetch(`${URL}/rest/v1/orders`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        customer_id: 'dcf3d697-39f7-4eb6-b06d-0505f8d965cb',
        total_amount: 1000,
        status: 'pending'
      })
    });
    console.log('Create status:', orderRes.status);
    const orderData = await orderRes.json();
    console.log('Create response:', orderData);
    
    if (orderRes.status !== 201 && orderRes.status !== 200) {
      console.error('Failed to create order');
      return;
    }
    const order = orderData[0];

    console.log('\n2. Creating order item...');
    const itemRes = await fetch(`${URL}/rest/v1/order_items`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        order_id: order.id,
        product_id: 'a53a251b-6354-4131-8657-79572408546a',
        quantity: 1,
        unit_price: 1000
      })
    });
    console.log('Create item status:', itemRes.status);
    const itemData = await itemRes.json();
    console.log('Create item response:', itemData);

    console.log('\n3. Patching order status to cancelled...');
    const cancelRes = await fetch(`${URL}/rest/v1/orders?id=eq.${order.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ status: 'cancelled' })
    });
    console.log('PATCH status:', cancelRes.status);
    const cancelData = await cancelRes.json();
    console.log('PATCH response:', cancelData);

    // Clean up
    console.log('\n4. Cleaning up...');
    if (itemData[0]) {
      await fetch(`${URL}/rest/v1/order_items?id=eq.${itemData[0].id}`, { method: 'DELETE', headers: HEADERS });
    }
    await fetch(`${URL}/rest/v1/orders?id=eq.${order.id}`, { method: 'DELETE', headers: HEADERS });
    console.log('Cleanup completed.');

  } catch (err) {
    console.error('Exception during testCancel:', err);
  }
}

testCancel();
