import React from 'react';
import { AlertTriangle, Trash2, HelpCircle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean; // Red button for dangerous actions
    isLoading?: boolean;
    icon?: 'trash' | 'alert' | 'question';
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Onayla',
    cancelText = 'İptal',
    isDangerous = false,
    isLoading = false,
    icon = 'alert'
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const Icon = icon === 'trash' ? Trash2 : (icon === 'question' ? HelpCircle : AlertTriangle);
    const iconColor = isDangerous ? 'text-red-600' : 'text-blue-600';
    const confirmBtnColor = isDangerous
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white';

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="space-y-2">
                    <h3 className={`text-xl font-bold flex items-center gap-2 ${iconColor}`}>
                        <Icon size={24} /> {title}
                    </h3>
                    <div className="text-sm text-foreground">
                        {message}
                    </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${confirmBtnColor}`}
                    >
                        {isLoading ? 'İşleniyor...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
