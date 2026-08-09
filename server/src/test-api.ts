import { supabaseAdmin } from './db/supabase';
import { config } from './config';
import jwt from 'jsonwebtoken';

async function test() {
  const { data, error, count } = await supabaseAdmin
    .from('users')
    .select('id, email, full_name, role, status', { count: 'exact' })
    .eq('role', 'instructor');

  console.log('DB instructors count:', count);
  console.log('DB error:', error);
  console.log('DB data:', JSON.stringify(data, null, 2));

  const payload = { sub: '49e33887-3fa7-4a4b-8d62-c21c4ebc82ac', email: 'oniebenezer1@gmail.com', role: 'admin', status: 'active' };
  const token = jwt.sign(payload, config.jwt.secret, { expiresIn: '1h' });
  
  try {
    const res = await fetch('http://localhost:4000/api/v1/users?role=instructor&page=1&limit=20', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const body = await res.json();
    console.log('\nHTTP Status:', res.status);
    console.log('HTTP Response:', JSON.stringify(body, null, 2));
  } catch (e: any) {
    console.error('HTTP Error:', e.message);
  }
  
  process.exit(0);
}
test();
