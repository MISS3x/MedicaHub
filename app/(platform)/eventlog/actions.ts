'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Types ---

export interface TaskCategory {
    id: string;
    organization_id: string;
    name: string;
    color: string;
    icon: string;
    is_system: boolean;
}

export type OperationCategory = 'revision' | 'order' | 'admin' | 'other'; // Backward compatibility
export type OperationStatus = 'pending' | 'done' | 'expired';

export interface OperationalTask {
    id: string;
    organization_id: string;
    title: string;
    due_date: string;
    category?: OperationCategory; // Deprecated but kept for old records
    category_id?: string; // New relational link
    status: OperationStatus;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    reminder_days: number;
    is_recurring: boolean;
    recurrence_interval?: 'monthly' | 'yearly' | 'biannual';
    google_calendar_sync: boolean;
    description?: string;
}

// --- Category Actions ---

export async function getCategories(organizationId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name')

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }
    return data as TaskCategory[]
}

export async function saveCategory(category: Partial<TaskCategory>, organizationId: string) {
    const supabase = createClient()

    // If ID exists, update
    if (category.id) {
        const { error } = await supabase
            .from('task_categories')
            .update({
                name: category.name,
                color: category.color,
                icon: category.icon
            })
            .eq('id', category.id)
            .eq('organization_id', organizationId) // Security check
        if (error) throw error
    } else {
        // Insert new
        const { error } = await supabase
            .from('task_categories')
            .insert({
                organization_id: organizationId,
                name: category.name,
                color: category.color,
                icon: category.icon
            })
        if (error) throw error
    }
    revalidatePath('/app/eventlog')
}

export async function deleteCategory(id: string) {
    const supabase = createClient()
    // Optional: Check if used? Or let FK set null.
    const { error } = await supabase.from('task_categories').delete().eq('id', id)
    if (error) throw error
    revalidatePath('/app/eventlog')
}

export async function initializeCategories(organizationId: string) {
    const supabase = createClient()
    // Call the SQL function we defined
    const { error } = await supabase.rpc('initialize_default_categories', { target_org_id: organizationId })
    if (error) {
        console.error('Init categories error:', error)
        // Fallback: If RPC fails (e.g. permission issue), try manual insert if empty
        const { count } = await supabase.from('task_categories').select('*', { count: 'exact', head: true }).eq('organization_id', organizationId)
        if (count === 0) {
            const defaults = [
                { organization_id: organizationId, name: 'Volat', color: '#3B82F6', icon: 'phone', is_system: true },
                { organization_id: organizationId, name: 'Objednat', color: '#8B5CF6', icon: 'shopping-cart', is_system: true },
                { organization_id: organizationId, name: 'Servis', color: '#F59E0B', icon: 'wrench', is_system: true },
                { organization_id: organizationId, name: 'Revize', color: '#EF4444', icon: 'clipboard-list', is_system: true },
                { organization_id: organizationId, name: 'Laboratoř', color: '#14B8A6', icon: 'flask-conical', is_system: true },
                { organization_id: organizationId, name: 'Odpady', color: '#22C55E', icon: 'trash-2', is_system: true },
                { organization_id: organizationId, name: 'Úklid', color: '#06B6D4', icon: 'sparkles', is_system: true },
                { organization_id: organizationId, name: 'Administrativa', color: '#64748B', icon: 'file-text', is_system: true },
                { organization_id: organizationId, name: 'IT', color: '#6366F1', icon: 'monitor', is_system: true },
                { organization_id: organizationId, name: 'Schůzka', color: '#EC4899', icon: 'users', is_system: true },
            ];
            await supabase.from('task_categories').insert(defaults);
        }
    }
    revalidatePath('/app/eventlog')
}


// --- Task Actions ---

export async function getTasks(organizationId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('operational_tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('due_date', { ascending: true })

    if (error) {
        console.error('Error fetching tasks:', error)
        return []
    }

    return data as OperationalTask[]
}

export async function addTask(organizationId: string, task: Partial<OperationalTask>) {
    const supabase = createClient()

    // Validate required fields (category OR category_id must exist)
    if (!task.title || !task.due_date) {
        throw new Error('Chybí povinná pole')
    }

    const { error } = await supabase
        .from('operational_tasks')
        .insert({
            organization_id: organizationId,
            title: task.title,
            due_date: task.due_date,
            category: task.category || 'other', // Fallback for legacy column
            category_id: task.category_id, // NEW
            status: 'pending',
            contact_name: task.contact_name,
            contact_email: task.contact_email,
            contact_phone: task.contact_phone,
            reminder_days: task.reminder_days || 7,
            is_recurring: task.is_recurring || false,
            recurrence_interval: task.recurrence_interval,
            google_calendar_sync: task.google_calendar_sync || false,
            description: task.description
        })

    if (error) throw error
    revalidatePath('/app/eventlog')
}

export async function updateTask(id: string, updates: Partial<OperationalTask>) {
    const supabase = createClient()
    const { error } = await supabase
        .from('operational_tasks')
        .update(updates)
        .eq('id', id)

    if (error) throw error
    revalidatePath('/app/eventlog')
}

export async function deleteTask(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('operational_tasks')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/app/eventlog')
}

export async function completeTask(id: string) {
    const supabase = createClient()
    const { error } = await supabase
        .from('operational_tasks')
        .update({ status: 'done' })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/app/eventlog')
}
