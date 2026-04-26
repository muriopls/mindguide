'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Menu, X, Settings, LogOut, Moon, Sun, LayoutDashboard, MessageSquare, FlaskConical } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { ConversationSummary } from '@/types';

interface MobileMenuProps {
  displayName: string;
  isParent: boolean;
  unreviewedFlagCount: number;
}

export function MobileMenu({ displayName, isParent, unreviewedFlagCount }: MobileMenuProps) {
  const tNav = useTranslations('nav');
  const tChat = useTranslations('chat');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [open, setOpen] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(false);
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    if (conversations !== null) return;
    setLoadingConvs(true);
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json() as { conversations: ConversationSummary[] };
      setConversations(data.conversations ?? []);
    } finally {
      setLoadingConvs(false);
    }
  };

  const handleClose = () => setOpen(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  };

  const toggleLocale = () => {
    const next = locale === 'de' ? 'en' : 'de';
    router.push(pathname.replace(`/${locale}`, `/${next}`));
  };

  return (
    <>
      {/* Hamburger trigger */}
      <button
        onClick={handleOpen}
        aria-label="Menü öffnen"
        className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
        {unreviewedFlagCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-mg-error" />
        )}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-dvh w-72 max-w-[85vw] border-l border-border/60 shadow-2xl flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ backgroundColor: 'var(--background)', backgroundImage: 'none' }}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 shrink-0 h-14">
          <span className="text-sm font-medium truncate max-w-[160px]">{displayName}</span>
          <button
            onClick={handleClose}
            aria-label="Menü schließen"
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation history — only for non-parents */}
        {!isParent && (
          <div className="flex-1 overflow-y-auto">
            <p className="px-4 pt-4 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {tChat('historyTitle')}
            </p>

            {loadingConvs ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : !conversations || conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-2">{tChat('historyEmpty')}</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('mindguide:load-conversation', { detail: { id: conv.id } }));
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-foreground/5 transition-colors"
                >
                  <p className="text-xs font-medium truncate text-foreground/80">
                    {conv.title ?? `${tChat('historyConversationAt')} ${new Date(conv.createdAt).toLocaleDateString()}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(conv.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    {' · '}{conv.messageCount} {tChat('historyMessages')}
                  </p>
                </button>
              ))
            )}
          </div>
        )}
        {isParent && <div className="flex-1" />}

        {/* Bottom actions */}
        <div className="border-t border-border/40 shrink-0 p-3 space-y-1">
          {isParent ? (
            <a
              href={`/${locale}/test`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <FlaskConical className="w-4 h-4 shrink-0" />
              {tNav('test')}
            </a>
          ) : (
            <a
              href={`/${locale}`}
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              {tNav('home')}
            </a>
          )}

          {isParent && (
            <a
              href={`/${locale}/dashboard`}
              className="relative flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {tNav('dashboard')}
              {unreviewedFlagCount > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-mg-error shrink-0" />
              )}
            </a>
          )}

          <button
            onClick={toggleLocale}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <span className="w-4 h-4 text-center text-xs font-bold shrink-0">
              {locale === 'de' ? 'EN' : 'DE'}
            </span>
            {locale === 'de' ? 'English' : 'Deutsch'}
          </button>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
            {isDark ? tCommon('lightMode') : tCommon('darkMode')}
          </button>

          <a
            href={`/${locale}/settings`}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <Settings className="w-4 h-4 shrink-0" />
            {tNav('settings')}
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-mg-error hover:bg-mg-error/10 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {tNav('logout')}
          </button>
        </div>
      </div>

    </>
  );
}
