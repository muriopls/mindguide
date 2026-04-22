'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const toggleLocale = () => {
    const nextLocale = locale === 'de' ? 'en' : 'de';
    const newPath = pathname.replace(`/${locale}`, `/${nextLocale}`);
    router.push(newPath);
  };

  return (
    <Button variant="ghost" size="sm" onClick={toggleLocale} className="font-medium text-xs">
      {locale === 'de' ? 'EN' : 'DE'}
    </Button>
  );
}
