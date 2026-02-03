'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { MedCheckEntry } from './types'

export async function addMedLogEntry(organizationId: string, entry: Omit<MedCheckEntry, 'id' | 'created_at' | 'organization_id' | 'is_auto_generated'>) {
    const supabase = createClient()

    // We need to convert the TS object to match database columns snake_case
    // Actually the entry object passed here should mostly match, but let's be explicit
    const { error } = await supabase.from('medlog_entries').insert({
        organization_id: organizationId,
        date: entry.date,
        fridge_ok: entry.fridge_ok,
        cabinet_ok: entry.cabinet_ok,
        discarded: entry.discarded, // This will be stored as JSONB
        note: entry.note,
        is_auto_generated: false
    })

    if (error) {
        console.error('Error adding medlog entry:', error)
        throw new Error('Failed to add entry')
    }

    revalidatePath('/app/medlog')
}

export async function updateMedLogEntry(id: string, entry: Partial<MedCheckEntry>) {
    const supabase = createClient()

    // Filter out undefined values to avoid overwriting with null/default if partial
    const updates: any = {};
    if (entry.date) updates.date = entry.date;
    if (entry.fridge_ok !== undefined) updates.fridge_ok = entry.fridge_ok;
    if (entry.cabinet_ok !== undefined) updates.cabinet_ok = entry.cabinet_ok;
    if (entry.discarded) updates.discarded = entry.discarded;
    if (entry.note !== undefined) updates.note = entry.note;

    const { error } = await supabase.from('medlog_entries').update(updates).eq('id', id)

    if (error) {
        console.error('Error updating medlog entry:', error)
        throw new Error('Failed to update entry')
    }

    revalidatePath('/app/medlog')
}

export async function deleteMedLogEntry(id: string) {
    const supabase = createClient()

    const { error } = await supabase.from('medlog_entries').delete().eq('id', id)

    if (error) {
        console.error('Error deleting medlog entry:', error)
        throw new Error('Failed to delete entry')
    }

    revalidatePath('/app/medlog')
}
