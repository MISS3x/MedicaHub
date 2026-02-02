'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addEntry(organizationId: string, value: number) {
    const supabase = createClient()

    const { error } = await supabase.from('termolog_entries').insert({
        organization_id: organizationId,
        date: new Date().toISOString(),
        value: value,
        is_auto_generated: false
    })

    if (error) {
        console.error('Error adding entry:', error)
        throw new Error('Failed to add entry')
    }

    revalidatePath('/app/termolog')
}

export async function deleteEntry(id: string) {
    const supabase = createClient()

    const { error } = await supabase.from('termolog_entries').delete().eq('id', id)

    if (error) {
        console.error('Error deleting entry:', error)
        throw new Error('Failed to delete entry')
    }

    revalidatePath('/app/termolog')
}
