'use client';

import { backfillOrderNumbers } from '../actions/maintenance';

export function MaintenanceTools() {
    return (
        <form action={async () => { await backfillOrderNumbers(); }}>
            <button type="submit" className="text-xs text-blue-500 underline opacity-50 hover:opacity-100">
                Veritabanı: Sıra Numaralarını Ata
            </button>
        </form>
    );
}
