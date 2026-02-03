
export interface DiscardedMed {
    id: string;
    name: string;
    count: number;
    disposed: boolean;
    location: 'FRIDGE' | 'CABINET';
}

export interface MedCheckEntry {
    id: string;
    created_at?: string;
    organization_id?: string;
    date: string; // ISO format
    fridge_ok: boolean;
    cabinet_ok: boolean;
    discarded: DiscardedMed[];
    note?: string;
    is_auto_generated: boolean;
}
