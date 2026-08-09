import { supabaseAdmin } from './db/supabase';

async function testFlow() {
  const email = 'oniebenezer1@gmail.com';
  // Let's test signing in via supabaseAdmin auth
  // Wait, does the user have this email registered in auth?
  // Let's try to sign in with a dummy/expected password
  // (We don't know the exact password, but we can verify the authData response if we trigger it,
  // or we can mock/simulate the database lookups)
  
  // Let's look up the auth user to see their ID
  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  const targetUser = users.find(u => u.email === email);
  if (!targetUser) {
    console.log('No user with email', email);
    return;
  }
  
  console.log('Target User ID:', targetUser.id);
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, auth_id, email, full_name, role, status, avatar_url')
    .eq('auth_id', targetUser.id)
    .single();

  console.log('Profile query error:', error);
  console.log('Profile query user:', user);
}

testFlow();
