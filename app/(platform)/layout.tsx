import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../../globals.css";
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InactivityTimer from '@/components/InactivityTimer'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "MedicaHub Platform",
};

export default async function PlatformRootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Protect all platform routes
    if (!user) {
        redirect('/login')
    }

    // Fetch Profile for Theme & Inactivity
    let themeClass = 'light'; // FORCED LIGHT MODE
    let timeoutSeconds = 30;

    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('theme, inactivity_timeout_seconds')
            .eq('id', user.id)
            .single();

        if (profile) {
            timeoutSeconds = profile.inactivity_timeout_seconds ?? 30;
            // Theme logic commented out to force LIGHT mode everywhere
            /*
            if (profile.theme) {
                if (profile.theme === 'dark') themeClass = 'dark';
                else if (profile.theme === 'light') themeClass = 'light';
                else if (profile.theme === 'tron') themeClass = 'tron';
            }
            */
        }
    } catch (error) {
        console.warn('Profile fetch failed:', error);
    }

    return (
        <html lang="cs" className={themeClass}>
            <body className={inter.className}>
                <InactivityTimer timeoutSeconds={timeoutSeconds} />
                {children}
            </body>
        </html>
    )
}
