'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useTransition } from 'react';
import { SaleDTO, deleteSale, shipSale, markSaleAsPaid } from '../actions/sales';
// Modals removed
import { Search, Calendar, Filter, ArrowRight, ArrowLeft, MoreHorizontal, Download, Truck, CreditCard, FileText, Trash2, Edit, TrendingUp, Plus } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { clsx } from "clsx";

interface SalesHistoryClientProps {
    initialSales: SaleDTO[];
    initialDate: {
        month: number;
        year: number;
    }
}
export function SalesHistoryClient({ initialSales, initialDate }: SalesHistoryClientProps) {
    const { role, currentUser } = useRole();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [sales, setSales] = useState(initialSales);
    // isAddSaleOpen is now derived from URL to prevent synchronization issues
    const isAddSaleOpen = searchParams.get('add') === 'true';
    const [search, setSearch] = useState('');

    // Construct Date object from props for UI display
    // Note: initialDate.month is 0-11
    const [currentDate, setCurrentDate] = useState(new Date(initialDate.year, initialDate.month, 1));

    // Sync state when props change (e.g. after navigation)
    useEffect(() => {
        setSales(initialSales);
        setCurrentDate(new Date(initialDate.year, initialDate.month, 1));
    }, [initialSales, initialDate]);

    const [regionFilter, setRegionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);



    useEffect(() => {
        const filter = searchParams.get('filter');
        setStatusFilter(filter);
    }, [searchParams]);

    // Shipment Modal State
    const [shipModalOpen, setShipModalOpen] = useState(false);
    const [selectedSaleForShip, setSelectedSaleForShip] = useState<SaleDTO | null>(null);
    const [shipQty, setShipQty] = useState(0);
    const [waybillNo, setWaybillNo] = useState('');

    // Payment Modal State
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [selectedSaleForPay, setSelectedSaleForPay] = useState<SaleDTO | null>(null);
    const [invoiceNo, setInvoiceNo] = useState('');

    // Edit Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedSaleForEdit, setSelectedSaleForEdit] = useState<SaleDTO | null>(null);

    // Delete Modal State
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState<SaleDTO | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleShipClick = (sale: SaleDTO) => {
        setSelectedSaleForShip(sale);
        setShipQty(sale.quantity);
        setWaybillNo(sale.waybillNumber || '');
        setShipModalOpen(true);
    };

    const handleShipSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSaleForShip || !selectedSaleForShip.id) return;

        await shipSale(selectedSaleForShip.id, shipQty, waybillNo);
        setShipModalOpen(false);
        // Optimistic update or reload could happen here, but server action revalidates path
        window.location.reload(); // Force reload to reflect split records if any
    };

    const handlePayClick = (sale: SaleDTO) => {
        setSelectedSaleForPay(sale);
        setInvoiceNo(sale.invoiceNumber || '');
        setPayModalOpen(true);
    };

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSaleForPay || !selectedSaleForPay.id) return;

        await markSaleAsPaid(selectedSaleForPay.id, invoiceNo);
        setPayModalOpen(false);
    };

    const handleEditClick = (sale: SaleDTO) => {
        router.push(`/sales/edit/${sale.id}`);
    };

    const updateMonth = (newDate: Date) => {
        const params = new URLSearchParams(searchParams);
        params.set('month', newDate.getMonth().toString());
        params.set('year', newDate.getFullYear().toString());

        startTransition(() => {
            router.push(`${pathname}?${params.toString()}`);
        });
    };

    const handlePrevMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() - 1);
        updateMonth(newDate);
    };

    const handleNextMonth = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(currentDate.getMonth() + 1);
        updateMonth(newDate);
    };

    const handlePrevYear = () => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(currentDate.getFullYear() - 1);
        updateMonth(newDate);
    };

    const handleNextYear = () => {
        const newDate = new Date(currentDate);
        newDate.setFullYear(currentDate.getFullYear() + 1);
        updateMonth(newDate);
    };

    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

    const [monthlyTarget, setMonthlyTarget] = useState<{ target: number, success: number | null }>({ target: 0, success: null });

    useEffect(() => {
        import('../actions/sales').then(({ getMonthlyTarget }) => {
            getMonthlyTarget(currentDate.getMonth(), currentDate.getFullYear()).then(data => {
                if (data) {
                    setMonthlyTarget({ target: Number(data.target), success: Number(data.success) });
                } else {
                    setMonthlyTarget({ target: 0, success: null });
                }
            });
        });
    }, [currentDate]);

    const filteredSales = sales.filter(sale => {
        // Enforce RBAC for row filters as well, just in case
        if (role === 'customer') return sale.customerName === currentUser || sale.customerName === null;

        const matchesSearch =
            (sale.customerName?.toLowerCase() || '').includes(search.toLowerCase()) ||
            sale.storeName.toLowerCase().includes(search.toLowerCase()) ||
            sale.item.toLowerCase().includes(search.toLowerCase()) ||
            sale.salesPerson.toLowerCase().includes(search.toLowerCase());

        const saleDate = new Date(sale.date);

        // Status Filter Logic
        let matchesStatus = true;
        let ignoreDateFilter = false;

        if (statusFilter === 'late') {
            // Late: Unshipped AND Before Today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            matchesStatus = !sale.isShipped && saleDate < today;
            ignoreDateFilter = true; // Show all late orders regardless of month
        } else if (statusFilter === 'unshipped') {
            // Unshipped: Just !isShipped
            matchesStatus = !sale.isShipped;
            ignoreDateFilter = true; // Show backlog
        } else if (statusFilter === 'shipped') {
            // Shipped Today
            const todayStr = new Date().toISOString().split('T')[0];
            // Assuming sale.date is YYYY-MM-DD string or compatible
            // Safety check for date types
            const sDate = typeof sale.date === 'string' ? sale.date : saleDate.toISOString().split('T')[0];
            matchesStatus = (sale.isShipped || false) && sDate === todayStr;
            ignoreDateFilter = true;
        }

        // Remove client-side matchesMonth check because server now filters data
        // Only enforce month logic if we aren't in a special "ignoreDateFilter" mode
        // But even then, the server only returned THIS month's data. 
        // If user wants "All Late Orders", we might need a Global Search/Filter mode later.
        // For now, let's assume valid data is passed for the current view.
        // If statusFilter is active, we might miss data if server didn't return it. 
        // NOTE: This is a trade-off. "Late orders" across all time now requires a specific server query.
        // For now, allow filtering what we have.

        const matchesRegion = !regionFilter || sale.region === regionFilter;

        return matchesSearch && matchesRegion && matchesStatus;
    });

    const uniqueRegions = Array.from(new Set(initialSales.map(s => s.region)));
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);

    const handleExport = () => {
        if (!filteredSales.length) return;

        const headers = ["Tarih", "Sipariş No", "Mağaza", "Müşteri", "Ürün", "Adet", "Tutar", "Kar", "Ödeme", "Durum"];
        const csvContent = [
            headers.join(','),
            ...filteredSales.map(s => [
                `"${new Date(s.date).toLocaleDateString('tr-TR')}"`,
                `"${s.orderNumber || ''}"`,
                `"${s.storeName}"`,
                `"${s.customerName || ''}"`,
                `"${s.item.replace(/"/g, '""')}"`,
                `"${s.quantity}"`,
                `"${s.total}"`,
                `"${s.profit}"`,
                `"${s.paymentStatus === 'PAID' ? 'Ödendi' : 'Bekliyor'}"`,
                `"${s.isShipped ? 'Kargolandı' : 'Sipariş'}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `satislar_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Target Calculations
    const progress = monthlyTarget.target > 0 ? (totalRevenue / monthlyTarget.target) * 100 : 0;
    const remaining = Math.max(0, monthlyTarget.target - totalRevenue);

    const showPrices = role !== 'warehouse';
    const showProfit = (role === 'admin' || role === 'accountant') && showPrices;

    return (
        <div className="space-y-2">
            {/* Filters */}
            {/* Filters */}
            {/* Filters */}
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-2 justify-between items-center">

                {/* Date Navigation - Left aligned */}
                <div className="flex items-center gap-1 bg-card border border-border/50 rounded-lg p-1 shadow-none self-start md:self-auto">
                    <button onClick={handlePrevMonth} className="p-1 px-2 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft size={14} />
                    </button>
                    <div className="flex flex-col items-center px-2 min-w-[100px]">
                        <span className="text-xs font-bold capitalize">{monthName}</span>
                        <span className="text-[9px] text-muted-foreground">{currentDate.getFullYear()}</span>
                    </div>
                    <button onClick={handleNextMonth} className="p-1 px-2 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight size={14} />
                    </button>
                </div>

                {/* Right Side: Search, Region */}
                <div className="flex gap-2 w-full md:w-auto items-center justify-end">

                    {/* Search */}
                    <div className="relative flex-1 md:flex-none md:w-[200px]">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-border/50 rounded-lg bg-card focus:ring-1 focus:ring-primary/50 outline-none transition-all shadow-none h-[34px]"
                        />
                    </div>

                    {/* Region Filter */}
                    {role !== 'customer' && (
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="px-2 py-1.5 text-xs border border-border/50 rounded-lg bg-card outline-none min-w-[120px] shadow-none h-[34px]"
                        >
                            <option value="">Tüm Bölgeler</option>
                            {uniqueRegions.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    )}

                    {role === 'admin' && (
                        <button
                            onClick={handleExport}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors h-[34px]"
                            title="Excel/CSV İndir"
                        >
                            <Download size={14} />
                            İndir
                        </button>
                    )}
                </div>
            </div>



            {/* Old Status Filter Indicator */}
            {statusFilter && (
                <div className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-md text-xs flex items-center justify-between mt-2">
                    <span className="font-medium">
                        Filtre: {statusFilter === 'late' ? 'Gecikenler' : statusFilter === 'unshipped' ? 'Bekleyenler' : statusFilter}
                    </span>
                    <button
                        onClick={() => {
                            const url = new URL(window.location.href);
                            url.searchParams.delete('filter');
                            window.history.pushState({}, '', url);
                            setStatusFilter(null);
                        }}
                        className="text-xs hover:underline ml-2"
                    >
                        Temizle
                    </button>
                </div>
            )}

            {/* List Header & Date Nav row - Compact */}
            <div className="flex items-center justify-between mt-2 mb-1">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm flex items-center gap-1">
                        Listelenen Satışlar
                    </h3>
                    <span className="text-[10px] text-muted-foreground">({filteredSales.length} kayıt)</span>
                </div>
            </div>


            {/* Table */}
            <div className="bg-card border border-border/50 rounded-lg overflow-hidden shadow-none -mt-1 ring-1 ring-border/30">
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] compact-table">
                        <thead className="bg-secondary/30 text-[10px] uppercase text-muted-foreground font-medium border-b border-border/50">
                            <tr>
                                <th className="px-2 py-1 text-left w-[80px]">Tarih</th>
                                <th className="px-2 py-1 text-left w-[110px]">Sipariş No</th>
                                {role !== 'customer' && <th className="px-2 py-1 text-left w-[120px]">Mağaza</th>}
                                <th className="px-2 py-1 text-left w-[120px]">Müşteri</th>
                                <th className="px-2 py-1 text-left">Ürün</th>
                                {role !== 'warehouse' && (
                                    <>
                                        <th className="px-2 py-1 text-right w-[50px]">Adet</th>
                                        <th className="px-2 py-1 text-right w-[80px]">Tutar</th>
                                    </>
                                )}
                                {showProfit && <th className="px-2 py-1 text-right w-[80px]">Kar</th>}
                                {role !== 'customer' && <th className="px-2 py-1 text-center w-[90px]">Ödeme</th>}
                                <th className="px-2 py-1 text-center w-[90px]">Durum</th>
                                {role !== 'customer' && <th className="px-2 py-1 text-right w-[80px]">İşlem</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredSales.map((sale) => {
                                const saleDate = new Date(sale.date);
                                const now = new Date();
                                const diffTime = Math.abs(now.getTime() - saleDate.getTime());
                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isDelayed = !sale.isShipped && diffDays > 3;

                                return (
                                    <tr
                                        key={sale.id}
                                        className={clsx(
                                            "transition-colors group h-8 cursor-pointer border-b border-border/30 last:border-0",
                                            isDelayed ? "bg-red-500/10 hover:bg-red-500/20" : "hover:bg-secondary/20"
                                        )}
                                        onClick={() => {
                                            if (role === 'admin' || role === 'manager' || role === 'sales') {
                                                handleEditClick(sale);
                                            }
                                        }}
                                    >
                                        <td className="px-2 py-0.5 whitespace-nowrap text-muted-foreground">
                                            {new Date(sale.date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                                        </td>
                                        <td className="px-2 py-0.5 whitespace-nowrap font-mono text-xs text-muted-foreground">
                                            {sale.orderNumber || '-'}
                                        </td>
                                        {role !== 'customer' && (
                                            <td className="px-2 py-0.5 font-medium text-foreground truncate max-w-[120px]" title={sale.storeName}>
                                                {sale.storeName}
                                            </td>
                                        )}
                                        <td className="px-2 py-0.5 truncate max-w-[120px]" title={sale.customerName || '-'}>
                                            {sale.customerName || <span className="text-muted-foreground/50">-</span>}
                                        </td>
                                        <td className="px-2 py-0.5 truncate max-w-[200px]" title={sale.item}>
                                            {sale.item}
                                        </td>
                                        {role !== 'warehouse' && (
                                            <>
                                                <td className="px-2 py-0.5 text-right">{sale.quantity}</td>
                                                <td className="px-2 py-0.5 text-right font-medium">
                                                    {Number(sale.total).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                                </td>
                                            </>
                                        )}
                                        {showProfit && (
                                            <td className="px-2 py-0.5 text-right text-green-600/90">
                                                {Number(sale.profit).toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                                            </td>
                                        )}
                                        {role !== 'customer' && (
                                            <td className="px-2 py-0.5 text-center">
                                                <span className={clsx(
                                                    "inline-flex items-center px-1 py-0 rounded text-[9px] font-medium border leading-none",
                                                    sale.paymentStatus === 'PAID'
                                                        ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                        : "bg-gray-500/10 text-gray-500 border-gray-500/20"
                                                )}>
                                                    {sale.paymentStatus === 'PAID' ? 'Ödendi' : 'Bekliyor'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="px-2 py-0.5 text-center flex justify-center items-center gap-1 h-full">
                                            <span className={clsx(
                                                "inline-flex items-center px-1 py-0 rounded text-[9px] font-medium border leading-none",
                                                sale.isShipped
                                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                                    : (isDelayed ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20")
                                            )}>
                                                {sale.isShipped ? 'Kargolandı' : (isDelayed ? '! Gecikti' : 'Sipariş')}
                                            </span>
                                        </td>
                                        {role !== 'customer' && (
                                            <td className="px-2 py-0.5 text-right" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex justify-end gap-1">
                                                    {!sale.isShipped && (role === 'admin' || role === 'warehouse' || role === 'manager') && (
                                                        <button
                                                            onClick={() => handleShipClick(sale)}
                                                            className="p-0.5 hover:bg-green-100 text-green-600 rounded transition-colors"
                                                            title="Kargola"
                                                        >
                                                            <Truck size={14} />
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || role === 'accountant') && sale.paymentStatus !== 'PAID' && (
                                                        <button
                                                            onClick={() => handlePayClick(sale)}
                                                            className="p-0.5 hover:bg-emerald-100 text-emerald-600 rounded transition-colors"
                                                            title="Ödeme Al"
                                                        >
                                                            <CreditCard size={14} />
                                                        </button>
                                                    )}
                                                    {role === 'admin' && (
                                                        <button
                                                            onClick={() => handleEditClick(sale)}
                                                            className="p-0.5 hover:bg-blue-100 text-blue-600 rounded transition-colors"
                                                            title="Düzenle"
                                                        >
                                                            <Edit size={14} />
                                                        </button>
                                                    )}
                                                    {(role === 'admin' || role === 'manager') && (
                                                        <button
                                                            className="p-0.5 hover:bg-red-100 text-red-600 rounded transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSaleToDelete(sale);
                                                                setDeleteConfirmationOpen(true);
                                                                setDeleteError(null);
                                                            }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={
                                        5 + // Tarih, Sipariş No, Mağaza, Müşteri, Ürün
                                        (role !== 'warehouse' ? 2 : 0) + // Adet, Tutar
                                        (showProfit ? 1 : 0) + // Kar
                                        1 + // Durum
                                        (role !== 'customer' ? 1 : 0) // İşlem
                                    } className="px-4 py-8 text-center text-muted-foreground">
                                        Kriterlere uygun satış bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Compact Pagination */}
                    {/* Assuming totalPages and currentPage are defined elsewhere */}
                    {/* {totalPages > 1 && (
                        <div className="flex items-center justify-between px-2 py-1 border-t border-border/30 bg-secondary/10">
                            <span className="text-[10px] text-muted-foreground">
                                Sayfa {currentPage} / {totalPages}
                            </span>
                             <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 text-xs hover:bg-secondary rounded disabled:opacity-50"
                                >
                                    <ArrowLeft size={12} />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1 text-xs hover:bg-secondary rounded disabled:opacity-50"
                                >
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>
                    )} */}
                </div>
            </div >



            {/* Shipment Modal */}
            {
                shipModalOpen && selectedSaleForShip && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Truck className="text-primary" /> Sevk Et
                                </h3>
                                <button onClick={() => setShipModalOpen(false)} className="text-muted-foreground hover:text-foreground">X</button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <strong>{selectedSaleForShip.item}</strong> ({selectedSaleForShip.quantity} Adet) için sevk bilgileri giriniz.
                            </p>

                            <form onSubmit={handleShipSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Sevk Edilecek Adet</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedSaleForShip.quantity}
                                        value={shipQty}
                                        onChange={(e) => setShipQty(Number(e.target.value))}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2"
                                        required
                                    />
                                    {shipQty < selectedSaleForShip.quantity && (
                                        <p className="text-xs text-yellow-600">
                                            * Geriye kalan {selectedSaleForShip.quantity - shipQty} adet için yeni bir kayıt oluşturulacak.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">İrsaliye Numarası</label>
                                    <input
                                        type="text"
                                        value={waybillNo}
                                        onChange={(e) => setWaybillNo(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2"
                                        placeholder="IRS-2024-..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 rounded-lg font-medium"
                                >
                                    Onayla ve Sevk Et
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Payment Modal */}
            {
                payModalOpen && selectedSaleForPay && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-card w-full max-w-md rounded-xl border border-border shadow-2xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <CreditCard className="text-green-600" /> Ödeme Al
                                </h3>
                                <button onClick={() => setPayModalOpen(false)} className="text-muted-foreground hover:text-foreground">X</button>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                <strong>{selectedSaleForPay.customerName}</strong> müşterisinden ödeme bilgisi giriniz.
                            </p>

                            <form onSubmit={handlePaySubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fatura Numarası</label>
                                    <input
                                        type="text"
                                        value={invoiceNo}
                                        onChange={(e) => setInvoiceNo(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2"
                                        placeholder="FAT-2024-..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium"
                                >
                                    Ödeme Alındı Olarak İşaretle
                                </button>
                            </form>
                        </div>
                    </div>
                )
            }


            {/* Delete Confirmation Modal */}
            {deleteConfirmationOpen && saleToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-2xl p-6 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-red-600 flex items-center gap-2">
                                <Trash2 size={24} /> Satışı Sil
                            </h3>
                            <p className="text-sm text-foreground">
                                <strong>{saleToDelete.item}</strong> satışını silmek istediğinize emin misiniz?
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Bu işlem geri alınamaz.
                            </p>
                        </div>
                        {deleteError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex gap-3 justify-end pt-2">
                            <button
                                onClick={() => {
                                    setDeleteConfirmationOpen(false);
                                    setSaleToDelete(null);
                                    setDeleteError(null);
                                }}
                                className="px-4 py-2 text-sm font-medium hover:bg-secondary rounded-lg transition-colors"
                            >
                                İptal
                            </button>
                            <button
                                onClick={async () => {
                                    setIsDeleting(true);
                                    setDeleteError(null);
                                    try {
                                        const result = await deleteSale(saleToDelete.id!);
                                        if (result.success) {
                                            setDeleteConfirmationOpen(false);
                                            window.location.reload();
                                        } else {
                                            setDeleteError(result.error || 'Silme işlemi başarısız');
                                        }
                                    } catch (err) {
                                        setDeleteError('Bir hata oluştu');
                                    } finally {
                                        setIsDeleting(false);
                                    }
                                }}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                {isDeleting ? 'Siliniyor...' : 'Sil'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
