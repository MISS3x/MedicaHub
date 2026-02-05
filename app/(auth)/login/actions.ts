'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        redirect('/login?error=Vyplňte prosím email i heslo')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error.message)
        // Redirect with error
        if (error.message.includes('Invalid login credentials')) {
            redirect('/login?error=Nesprávný email nebo heslo')
        } else if (error.message.includes('Email not confirmed')) {
            redirect('/login?error=Potvrďte prosím email před přihlášením')
        } else {
            redirect(`/login?error=${encodeURIComponent(error.message)}`)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/hub')
}
