// Edge Function: create-user
//
// Creates a Supabase Auth user plus the matching profile/role record
// (students or faculty) on behalf of a Faculty or Admin caller.
//
// Security model:
// - Runs entirely server-side; the service role key never reaches the client.
// - Verifies the caller's JWT and looks up their role from `profiles`
//   using an ANON-scoped client bound to that JWT (so RLS applies).
// - Faculty may only create `role: "student"` accounts.
// - Admin may create `role: "student"` or `role: "faculty"` accounts.
// - Nobody can create `role: "admin"` through this function. Provision the
//   first admin manually (see README) and use Manage Roles afterward.
//
// Deploy: supabase functions deploy create-user
// Secrets required (set via `supabase secrets set`):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }
  });
}

function randomTempPassword() {
  return crypto.randomUUID() + crypto.randomUUID();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    // Client bound to the caller's JWT — RLS enforces what they can read.
    const callerClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const {
      data: { user: caller },
      error: userError
    } = await callerClient.auth.getUser();
    if (userError || !caller) return json({ error: 'Invalid session' }, 401);

    const { data: callerProfile, error: profileError } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();
    if (profileError || !callerProfile) return json({ error: 'Could not verify caller role' }, 403);

    const body = await req.json();
    const { role } = body;

    if (role === 'admin') return json({ error: 'Admin accounts cannot be self-provisioned' }, 403);
    if (role === 'faculty' && callerProfile.role !== 'admin') {
      return json({ error: 'Only admins can create faculty accounts' }, 403);
    }
    if (role === 'student' && !['faculty', 'admin'].includes(callerProfile.role)) {
      return json({ error: 'Only faculty or admins can register students' }, 403);
    }
    if (!['student', 'faculty'].includes(role)) {
      return json({ error: 'Invalid role' }, 400);
    }

    // Admin client — service role key stays in this server environment only.
    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const tempPassword = randomTempPassword();
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true
    });
    if (createError || !created.user) {
      return json({ error: createError?.message ?? 'Could not create the account' }, 400);
    }

    const newUserId = created.user.id;

    // The DB trigger already inserted a default 'student' profile row;
    // update it to the intended role, then attach the role-specific record.
    await adminClient.from('profiles').update({ role }).eq('id', newUserId);

    if (role === 'student') {
      const { error: insertError } = await adminClient.from('students').insert({
        id: newUserId,
        name: body.name,
        roll_no: body.roll_no,
        branch: body.branch,
        year: body.year,
        cgpa: body.cgpa || null,
        leetcode_handle: body.leetcode_handle || null
      });
      if (insertError) {
        await adminClient.auth.admin.deleteUser(newUserId);
        return json({ error: insertError.message }, 400);
      }
    } else if (role === 'faculty') {
      const { error: insertError } = await adminClient.from('faculty').insert({
        id: newUserId,
        name: body.name,
        department: body.department
      });
      if (insertError) {
        await adminClient.auth.admin.deleteUser(newUserId);
        return json({ error: insertError.message }, 400);
      }
    }

    // Send a password-setup email rather than returning the temp password.
    await adminClient.auth.resetPasswordForEmail(body.email, {
      redirectTo: `${req.headers.get('origin') ?? ''}/reset-password`
    });

    return json({ success: true, userId: newUserId });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500);
  }
});
