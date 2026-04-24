import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { DashboardClient } from '@/components/dashboard/DashboardClient';
import type { ChildAccount } from '@/types';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('dashboard');

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const { data: profile } = await supabase
    .from('profiles')
    .select('account_type')
    .eq('id', user.id)
    .single();

  if (profile?.account_type !== 'parent') redirect(`/${locale}`);

  // Fetch children list server-side
  const serviceClient = createServiceClient();
  const { data: childProfiles } = await serviceClient
    .from('profiles')
    .select('id, display_name, created_at')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: true });

  const children: ChildAccount[] = await Promise.all(
    (childProfiles ?? []).map(async (child) => {
      const { data } = await serviceClient.auth.admin.getUserById(child.id);
      return {
        id: child.id,
        displayName: child.display_name,
        email: data.user?.email ?? '',
        createdAt: child.created_at,
      };
    }),
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-8">{t('title')}</h1>
      <DashboardClient initialChildren={children} />
    </div>
  );
}
