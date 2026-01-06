'use client';

import { Download } from 'lucide-react';
import { useRole } from '@/app/contexts/RoleContext';

interface UsersExportButtonProps {
    users: any[];
}

export function UsersExportButton({ users }: UsersExportButtonProps) {
    const { role } = useRole();

    const handleExport = () => {
        if (!users.length) return;

        const headers = ["ID", "İsim", "Kullanıcı Adı", "Rol", "Tedarikçi ID"];
        const csvContent = [
            headers.join(','),
            ...users.map(u => [
                `"${u.id}"`,
                `"${u.name}"`,
                `"${u.username}"`,
                `"${u.role}"`,
                `"${u.supplierId || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `kullanicilar_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (role !== 'admin') return null;

    return (
        <button
            onClick={handleExport}
            className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
        >
            <Download size={16} /> İndir
        </button>
    );
}
