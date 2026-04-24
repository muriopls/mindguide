import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

function isAuthPath(pathname: string) {
  return pathname.includes('/auth/');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth pages are always public
  if (isAuthPath(pathname)) {
    return intlMiddleware(request);
  }

  // Create a mutable response to carry session cookies
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Detect locale from pathname (e.g. /de/... → de)
    const locale = pathname.split('/')[1] ?? 'de';
    const validLocales = ['de', 'en'];
    const resolvedLocale = validLocales.includes(locale) ? locale : 'de';
    const loginUrl = new URL(`/${resolvedLocale}/auth/login`, request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // User is authenticated — run intl middleware and carry session cookies
  const intlResponse = intlMiddleware(request);
  response.headers.forEach((value, key) => intlResponse.headers.set(key, value));
  response.cookies.getAll().forEach(({ name, value }) => intlResponse.cookies.set(name, value));

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|favicon\\.ico|.*\\..*).*)'],
};
