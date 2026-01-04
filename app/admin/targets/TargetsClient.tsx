'use client';

import { useState } from 'react';
import { MonthlyTargetDTO, upsertMonthlyTarget, getMonthlyTargets } from '@/app/actions/targets';
import { ChevronLeft, ChevronRight, Save, Edit2, Loader2, TrendingUp } from 'lucide-react';
import { clsx } from 'clsx';

interface TargetsClientProps {
    initialTargets: MonthlyTargetDTO[];
    currentYear: number;
}

export function TargetsClient({ initialTargets, currentYear }: TargetsClientProps) {
    const [targets, setTargets] = useState<MonthlyTargetDTO[]>(initialTargets);
    const [year, setYear] = useState(currentYear);
    const [isLoading, setIsLoading] = useState(false);
    const [editingMonth, setEditingMonth] = useState<number | null>(null);
    const [editValue, setEditValue] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const months = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];

    const handleYearChange = async (newYear: number) => {
        setIsLoading(true);
        setYear(newYear);
        const newTargets = await getMonthlyTargets(newYear);
        setTargets(newTargets);
        setIsLoading(false);
    };

    const handleEditClick = (monthIndex: number, currentTarget: number) => {
        setEditingMonth(monthIndex + 1);
        setEditValue(currentTarget.toString());
    };

    const handleSave = async (monthIndex: number) => {
        setIsSaving(true);
        const month = monthIndex + 1;
        const targetAmount = parseFloat(editValue);

        if (isNaN(targetAmount)) {
            alert('Lütfen geçerli bir sayı giriniz.');
            setIsSaving(false);
            return;
        }

        const result = await upsertMonthlyTarget({
            month,
            year,
            target: targetAmount
        });

        if (result.success) {
            // Optimistic update or refetch
            const newTargets = await getMonthlyTargets(year);
            setTargets(newTargets);
            setEditingMonth(null);
        } else {
            alert('Kaydetme başarısız.');
        }
        setIsSaving(false);
    };

    const getTargetForMonth = (monthIndex: number) => {
        return targets.find(t => t.month === monthIndex + 1);
    };

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="flex items-center gap-4 bg-card p-4 rounded-xl border border-border w-fit">
                <button
                    onClick={() => handleYearChange(year - 1)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-xl font-bold font-mono">{year}</span>
                <button
                    onClick={() => handleYearChange(year + 1)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {months.map((monthName, index) => {
                    const targetData = getTargetForMonth(index);
                    const isEditing = editingMonth === index + 1;
                    const amount = targetData?.target || 0;
                    const success = targetData?.success || 0;

                    // Calculate progress if success exists (just for visual context, though success comes from Excel import generally)
                    const percent = amount > 0 ? (success / amount) * 100 : 0;

                    return (
                        <div key={index} className="bg-card border border-border rounded-xl p-4 relative group hover:border-primary/30 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg text-muted-foreground">{monthName}</h3>
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setEditingMonth(null)}
                                            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                                        >
                                            İptal
                                        </button>
                                        <button
                                            onClick={() => handleSave(index)}
                                            disabled={isSaving}
                                            className="bg-primary text-primary-foreground p-1.5 rounded-md hover:scale-105 transition-transform"
                                        >
                                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleEditClick(index, amount)}
                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-secondary rounded-md text-primary transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Hedef</label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-full bg-secondary/30 border border-primary/50 rounded px-2 py-1 text-lg font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                            autoFocus
                                        />
                                    ) : (
                                        <div className="text-2xl font-bold tracking-tight">
                                            {amount.toLocaleString('tr-TR')} ₺
                                        </div>
                                    )}
                                </div>

                                {success > 0 && (
                                    <div>
                                        <label className="text-[10px] uppercase text-muted-foreground font-bold tracking-wider">Gerçekleşen (Excel)</label>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-foreground/80">{success.toLocaleString('tr-TR')} ₺</span>
                                            <span className={clsx("text-xs font-bold px-1.5 py-0.5 rounded", percent >= 100 ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500")}>
                                                %{percent.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none">
                                <TrendingUp size={48} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center">
                    <Loader2 size={40} className="animate-spin text-primary" />
                </div>
            )}
        </div>
    );
}
