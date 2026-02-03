'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addEntry(organizationId: string, value: number | null, customDate?: string) {
    const supabase = createClient()

    const { error } = await supabase.from('termolog_entries').insert({
        organization_id: organizationId,
        date: customDate || new Date().toISOString(),
        value: value,
        is_auto_generated: false
    })

    if (error) {
        console.error('Error adding entry:', error)
        throw new Error('Failed to add entry')
    }

    revalidatePath('/app/termolog')
}

export async function updateEntry(id: string, updates: { value?: number | null, date?: string }) {
    const supabase = createClient()

    const { error } = await supabase.from('termolog_entries')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Error updating entry:', error)
        throw new Error('Failed to update entry')
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

export async function generateDemoData(organizationId: string, startDateStr: string) {
    const supabase = createClient()
    const entries = [];

    // Start date (morning)
    const startDate = new Date(startDateStr);
    startDate.setHours(8, 0, 0, 0);

    // End date (today, end of day to cover generating for today)
    const endDate = new Date();
    endDate.setHours(8, 0, 0, 0);

    // Filter range for deletion (inclusive)
    // We want to clear data from the start of the selected day until now/future.
    // Actually, let's just clear exactly the range we overwrite.

    await supabase.from('termolog_entries')
        .delete()
        .eq('organization_id', organizationId)
        .gte('date', startDate.toISOString())
        // No upper bound on delete? Or up to today?
        // Safest is to delete >= startDate. User asked to generate "from selected date to today".
        // Use logic implies "replace/fill".
        .lte('date', new Date().toISOString());

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat
        const month = date.getMonth(); // 0 - 11

        let value: number | null = null;

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            // Working day logic
            const baseTemp = 21 - Math.cos((month / 6) * Math.PI);
            const noise = (Math.random() * 1.6) - 0.8;
            value = parseFloat((baseTemp + noise).toFixed(1));
        }

        entries.push({
            organization_id: organizationId,
            date: date.toISOString(),
            value: value,
            is_auto_generated: true
        });
    }

    // Insert in batches
    const batchSize = 100;
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        const { error } = await supabase.from('termolog_entries').insert(batch);
        if (error) console.error('Error batch inserting:', error);
    }

    revalidatePath('/app/termolog')
}
