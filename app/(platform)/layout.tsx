import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InactivityTimer from '@/components/InactivityTimer'

export default async function PlatformLayout({
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

    return (
        <>
            <InactivityTimer />
            {children}
        </>
    )
}
