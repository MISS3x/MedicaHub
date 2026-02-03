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
    const { error } = await supabase.auth.signUp({
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

    // Success -> Redirect to Success Page
    redirect('/signup/success')
}
