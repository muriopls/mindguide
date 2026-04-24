import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (profile?.account_type !== 'parent') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const serviceClient = createServiceClient();
  const { data: children } = await serviceClient
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true });

  // Fetch emails from auth.users for each child
  const childrenWithEmail = await Promise.all(
    (children ?? []).map(async (child) => {
      const { data } = await serviceClient.auth.admin.getUserById(child.id);
      return {
        id: child.id,
        displayName: child.display_name,
        email: data.user?.email ?? '',
        createdAt: child.created_at,
      };
    }),
  );

  return NextResponse.json({ children: childrenWithEmail });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { displayName?: unknown; email?: unknown; password?: unknown };

  if (
    typeof body.displayName !== 'string' || !body.displayName.trim() ||
    typeof body.email !== 'string' || !body.email.trim() ||
    typeof body.password !== 'string' || body.password.length < 8
  ) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Create Supabase auth user for the child
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: body.email.trim(),
    password: body.password,
    email_confirm: true,
    user_metadata: { display_name: body.displayName.trim() },
  });

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Failed to create user';
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const childId = authData.user.id;

  // The auth trigger already created the profile row — update it with child fields
  const { error: profileError } = await serviceClient
    .from('profiles')
    .update({
      display_name: body.displayName.trim(),
      account_type: 'child',
      parent_id: user.id,
    })
    .eq('id', childId);

  if (profileError) {
    // Rollback: delete the auth user
    await serviceClient.auth.admin.deleteUser(childId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Upgrade parent's account_type to 'parent' if standalone
  await supabase
    .from('profiles')
    .update({ account_type: 'parent' })
    .eq('id', user.id)
    .eq('account_type', 'standalone');

  return NextResponse.json({ childId });
}
