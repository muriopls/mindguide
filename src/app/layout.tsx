import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'MindGuide',
  description: 'Dein KI-Nachhilfelehrer — verstehen statt abschreiben',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body suppressHydrationWarning className="min-h-dvh flex flex-col antialiased overflow-y-auto">
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('mg-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();` }} />
        {children}
      </body>
    </html>
  );
}
