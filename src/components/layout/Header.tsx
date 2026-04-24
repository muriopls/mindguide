import Image from 'next/image';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { ThemeSwitcher } from './ThemeSwitcher';
import { LocaleSwitcher } from './LocaleSwitcher';
import { UserMenu } from './UserMenu';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getLocale();

  let displayName = '';
  let isParent = false;
  let unreviewedFlagCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, account_type')
      .eq('id', user.id)
      .single();

    displayName =
      profile?.display_name ??
      (user.user_metadata?.display_name as string | undefined) ??
      user.email?.split('@')[0] ??
      '';

    isParent = profile?.account_type === 'parent';

    if (isParent) {
      const { count } = await supabase
        .from('misuse_flags')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', user.id)
        .eq('reviewed', false);
      unreviewedFlagCount = count ?? 0;
    }
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
          {isParent && (
            <Link
              href={`/${locale}/dashboard`}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              {unreviewedFlagCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-mg-error" />
              )}
            </Link>
          )}
          <LocaleSwitcher />
          <ThemeSwitcher />
          {user && <UserMenu displayName={displayName} />}
        </nav>
      </div>
    </header>
  );
}
