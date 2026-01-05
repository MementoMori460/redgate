'use client';

import { X } from 'lucide-react';
import { AddSaleForm } from './AddSaleForm';

interface AddSaleModalProps {
    onClose: () => void;
    onSuccess?: () => void;
}

export function AddSaleModal({ onClose, onSuccess }: AddSaleModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 pt-4 sm:pt-6">
            <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col max-h-[95dvh] sm:max-h-[90dvh] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-secondary/5 shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                            Yeni Satış Ekle
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-secondary/50 p-1 rounded-md transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-3 md:p-4 overflow-y-auto flex-1 custom-scrollbar">
                    <AddSaleForm
                        onSuccess={() => {
                            // If parent provided onSuccess, call it. Otherwise just close.
                            if (onSuccess) {
                                onSuccess();
                            } else {
                                onClose();
                            }
                        }}
                        onCancel={onClose}
                    />
                </div>
            </div >
        </div >
    );
}
