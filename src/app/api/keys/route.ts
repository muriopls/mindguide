import { createClient } from '@/lib/supabase/server';
import { encryptApiKey, decryptApiKey } from '@/lib/crypto/keys';
import { NextResponse } from 'next/server';
import type { AIProvider } from '@/types';

function isValidProvider(p: unknown): p is AIProvider {
  return p === 'claude' || p === 'openai';
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await supabase
    .from('user_api_keys')
    .select('provider')
    .eq('user_id', user.id);

  const active = (data ?? []).map((row) => row.provider as AIProvider);
  return NextResponse.json({ active });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { provider?: unknown; key?: unknown };
  if (!isValidProvider(body.provider) || typeof body.key !== 'string' || !body.key.trim()) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const encrypted = encryptApiKey(body.key.trim());

  const { error } = await supabase
    .from('user_api_keys')
    .upsert(
      { user_id: user.id, provider: body.provider, encrypted_key: encrypted },
      { onConflict: 'user_id,provider' },
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { provider?: unknown };
  if (!isValidProvider(body.provider)) {
    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  }

  const { error } = await supabase
    .from('user_api_keys')
    .delete()
    .eq('user_id', user.id)
    .eq('provider', body.provider);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function getDecryptedUserKey(userId: string, provider: AIProvider): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('user_api_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .single();

  if (!data) return null;
  try {
    return decryptApiKey(data.encrypted_key);
  } catch {
    return null;
  }
}
