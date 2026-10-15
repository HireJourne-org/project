// Seeds the Golden Sample demo account and resets its Company Strategy drafts.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DEMO_USER_PASSWORD=... npm run seed:demo
//
// Safe to re-run before every demo: it reuses the demo user and replaces its
// strategies with fresh `pending_review` drafts, ready to approve live.
// Uses the service role key, so run it from a trusted machine only, never the browser.

import { createClient } from '@supabase/supabase-js';
import { demoProfile, demoStrategies } from './demo/goldenSample.js';

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_USER_EMAIL || 'demo.veteran@hirejourne.com';
const password = process.env.DEMO_USER_PASSWORD;

if (!url || !serviceRoleKey || !password) {
  console.error('Required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_PASSWORD (optional: DEMO_USER_EMAIL)');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const userMetadata = {
  full_name: demoProfile.full_name,
  headline: demoProfile.headline,
  career_evidence: demoProfile.career_evidence,
  demo: true,
};

async function findUserByEmail(target) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === target.toLowerCase());
    if (match || data.users.length < 200) return match ?? null;
  }
}

async function ensureDemoUser() {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, { password, user_metadata: userMetadata });
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: userMetadata,
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const userId = await ensureDemoUser();
  console.log(`Demo user: ${email} (${userId})`);

  const { error: usersError } = await supabase
    .from('users')
    .upsert({ id: userId, email }, { onConflict: 'id', ignoreDuplicates: true });
  if (usersError) console.warn(`Skipped public.users row: ${usersError.message}`);

  const { error: deleteError } = await supabase.from('company_strategies').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;

  // The insert trigger forces status = pending_review, so these are always drafts.
  const rows = demoStrategies.map(({ company_name, inputs, strategy }) => ({
    user_id: userId,
    company_name,
    fit_score: strategy.fit_score,
    fit_tier: strategy.fit_tier,
    strategy,
    inputs,
    model: 'golden-sample',
  }));

  const { data, error } = await supabase
    .from('company_strategies')
    .insert(rows)
    .select('company_name, fit_score, status');
  if (error) throw error;

  console.table(data);
  console.log(`Seeded ${data.length} draft strategies. Sign in as ${email} to approve them live.`);
}

main().catch((error) => {
  console.error('Demo seed failed:', error.message ?? error);
  process.exit(1);
});
