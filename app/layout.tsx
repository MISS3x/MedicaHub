import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MedicaHub",
  description: "Centrální správa aplikací pro lékaře",
};

import { createClient } from "@/utils/supabase/server";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();
  let themeClass = '';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('theme')
        .eq('id', user.id)
        .single();

      if (profile?.theme) {
        if (profile.theme === 'dark') themeClass = 'dark';
        else if (profile.theme === 'light') themeClass = 'light';
        else if (profile.theme === 'tron') themeClass = 'tron';
      }
    }
  } catch (error) {
    // Fail silently for theme to avoid blocking app
    console.warn('Theme fetch failed:', error);
  }

  return (
    <html lang="cs" className={themeClass}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
