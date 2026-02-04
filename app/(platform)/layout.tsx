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
    // Fetch profile for inactivity settings
    const { data: profile } = await supabase
        .from('profiles')
        .select('inactivity_timeout_seconds')
        .eq('id', user.id)
        .single()

    const timeoutSeconds = profile?.inactivity_timeout_seconds ?? 30

    return (
        <>
            <InactivityTimer timeoutSeconds={timeoutSeconds} />
            {children}
        </>
    )
}
