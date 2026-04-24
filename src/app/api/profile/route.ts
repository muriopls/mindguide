import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { AccountType } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('profiles')
    .select('account_type, parent_id')
    .eq('id', user.id)
    .single();

  return NextResponse.json({
    accountType: (data?.account_type ?? 'standalone') as AccountType,
    parentId: data?.parent_id ?? null,
  });
}
