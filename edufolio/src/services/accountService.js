import { supabase } from '../lib/supabaseClient';

/**
 * Calls the `create-user` Edge Function, which runs with the service role
 * key on the server only. The function verifies the caller's JWT and role
 * (faculty may only create students; admin may create students or faculty)
 * before creating the Auth user and corresponding profile/role record.
 */
export async function createManagedAccount(payload) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: payload
  });
  if (error) throw error;
  return data;
}
