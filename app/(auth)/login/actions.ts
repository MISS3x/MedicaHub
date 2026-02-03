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
        // Distinguish between different error types
        if (error.message.includes('Invalid login credentials')) {
            // Could be either wrong password or non-existent user
            // Check if user exists
            const { data: users } = await supabase.auth.admin.listUsers()
            const userExists = users?.users.some(u => u.email === email)

            if (!userExists) {
                redirect('/login?error=Účet neexistuje&action=register')
            } else {
                redirect('/login?error=Nesprávné heslo&action=reset')
            }
        } else if (error.message.includes('Email not confirmed')) {
            redirect('/login?error=Potvrďte prosím email před přihlášením')
        } else {
            redirect(`/login?error=${error.message}`)
        }
    }

    revalidatePath('/', 'layout')
    redirect('/hub')
}
