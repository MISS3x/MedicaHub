'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function signup(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string
    const orgName = formData.get('orgName') as string

    if (!email || !password || !fullName) {
        redirect('/signup?error=Vyplňte prosím všechna pole')
    }

    if (password.length < 6) {
        redirect('/signup?error=Heslo musí mít alespoň 6 znaků')
    }

    const supabase = createClient()

    // Sign up the user
    // The trigger 'on_auth_user_created' will handle:
    // 1. Creating organization
    // 2. Creating profile linked to org
    // 3. Adding default free apps
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                organization_name: orgName || 'Moje Ordinace'
            }
        }
    })

    if (error) {
        redirect(`/signup?error=${error.message}`)
    }

    // Check if user is automatically logged in (email confirmation disabled)
    if (data.session) {
        // Wait for trigger to create profile/organization (max 5 seconds)
        let profileReady = false;
        const maxAttempts = 10;

        for (let i = 0; i < maxAttempts; i++) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms

            const { data: profile } = await supabase
                .from('profiles')
                .select('organization_id')
                .eq('id', data.user!.id)
                .single();

            if (profile?.organization_id) {
                profileReady = true;
                break;
            }
        }

        // User is logged in, redirect to hub
        redirect('/hub')
    }

    // Email confirmation required - redirect to success page
    redirect('/signup/success')
}
