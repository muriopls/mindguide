import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';
import { UserMenu } from './UserMenu';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let displayName = '';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();
    displayName =
      profile?.display_name ??
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split('@')[0] ??
      '';
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
          <Image src="/icon.png" alt="" width={28} height={28} className="rounded-lg" />
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--logo-color-a), var(--logo-color-b))' }}
          >
            MindGuide
          </span>
        </a>
        <nav className="flex items-center gap-1">
          <LocaleSwitcher />
          <ThemeSwitcher />
          {user && <UserMenu displayName={displayName} />}
        </nav>
      </div>
    </header>
  );
}
