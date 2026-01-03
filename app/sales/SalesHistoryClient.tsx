'use client';

import { useState } from 'react';
import { SaleDTO } from '@/app/actions/sales';
import { Search, Calendar, Filter, Download } from 'lucide-react';

interface SalesHistoryClientProps {
    initialSales: SaleDTO[];
}

export function SalesHistoryClient({ initialSales }: SalesHistoryClientProps) {
    const [sales, setSales] = useState(initialSales);
    const [search, setSearch] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [regionFilter, setRegionFilter] = useState('');

    const filteredSales = sales.filter(sale => {
        const matchesSearch =
            sale.customerName?.toLowerCase().includes(search.toLowerCase()) ||
            sale.storeName.toLowerCase().includes(search.toLowerCase()) ||
            sale.item.toLowerCase().includes(search.toLowerCase()) ||
            sale.salesPerson.toLowerCase().includes(search.toLowerCase());

        const saleDate = new Date(sale.date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const matchesDate = (!start || saleDate >= start) && (!end || saleDate <= end);
        const matchesRegion = !regionFilter || sale.region === regionFilter;

        return matchesSearch && matchesDate && matchesRegion;
    });

    const uniqueRegions = Array.from(new Set(initialSales.map(s => s.region)));

    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Müşteri, Mağaza, Ürün veya Plasiyer ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="pl-3 pr-2 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                            />
                        </div>
                        <span className="self-center text-muted-foreground">-</span>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="pl-3 pr-2 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none text-sm"
                            />
                        </div>
                    </div>
                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg bg-secondary/20 focus:ring-2 focus:ring-primary/50 outline-none min-w-[150px]"
                    >
                        <option value="">Tüm Bölgeler</option>
                        {uniqueRegions.map(r => (
                            <option key={r} value={r}>{r}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary for Filtered View */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Listelenen Satış</p>
                        <h3 className="text-2xl font-bold">{filteredSales.length}</h3>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Toplam Ciro (Seçili)</p>
                        <h3 className="text-2xl font-bold text-blue-500">{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</h3>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-muted-foreground">Toplam Kar (Seçili)</p>
                        <h3 className="text-2xl font-bold text-green-500">{totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</h3>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-3 py-2 font-semibold">Tarih</th>
                                <th className="px-3 py-2 font-semibold">Mağaza</th>
                                <th className="px-3 py-2 font-semibold">Müşteri</th>
                                <th className="px-3 py-2 font-semibold">Ürün</th>
                                <th className="px-3 py-2 font-semibold">Plasiyer</th>
                                <th className="px-3 py-2 font-semibold text-right">Adet</th>
                                <th className="px-3 py-2 font-semibold text-right">Birim</th>
                                <th className="px-3 py-2 font-semibold text-right">Toplam</th>
                                <th className="px-3 py-2 font-semibold text-right">Kar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-secondary/20 transition-colors text-xs whitespace-nowrap">
                                    <td className="px-3 py-1.5 text-muted-foreground">{new Date(sale.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-3 py-1.5">
                                        <div className="font-medium">{sale.storeName}</div>
                                        <div className="text-[10px] text-muted-foreground">{sale.city}</div>
                                    </td>
                                    <td className="px-3 py-1.5 font-medium text-foreground">
                                        {sale.customerName || '-'}
                                    </td>
                                    <td className="px-3 py-1.5 text-foreground">{sale.item}</td>
                                    <td className="px-3 py-1.5 text-muted-foreground">{sale.salesPerson}</td>
                                    <td className="px-3 py-1.5 text-right font-mono">{sale.quantity}</td>
                                    <td className="px-3 py-1.5 text-right font-mono text-muted-foreground">
                                        {sale.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-3 py-1.5 text-right font-mono font-medium text-foreground">
                                        {sale.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`px-3 py-1.5 text-right font-mono font-medium ${sale.profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {sale.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                                        Kriterlere uygun satış bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
