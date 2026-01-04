'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SaleDTO, deleteSale, shipSale, markSaleAsPaid } from '../actions/sales';
import { EditSaleModal } from '../components/EditSaleModal';
import { Search, Calendar, Filter, ArrowRight, ArrowLeft, MoreHorizontal, Download, Truck, CreditCard, FileText, Trash2, Edit } from 'lucide-react';
import { useRole } from '../contexts/RoleContext';
import { clsx } from "clsx";

interface SalesHistoryClientProps {
    initialSales: SaleDTO[];
}

export function SalesHistoryClient({ initialSales }: SalesHistoryClientProps) {
    const { role, currentUser } = useRole();
    const searchParams = useSearchParams();
    const [sales, setSales] = useState(initialSales);
    const [search, setSearch] = useState('');
    const [currentDate, setCurrentDate] = useState(new Date());
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
        setSelectedSaleForEdit(sale);
        setEditModalOpen(true);
    };

    const handlePrevMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() - 1);
            return newDate;
        });
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + 1);
            return newDate;
        });
    };

    const handlePrevYear = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setFullYear(prev.getFullYear() - 1);
            return newDate;
        });
    };

    const handleNextYear = () => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setFullYear(prev.getFullYear() + 1);
            return newDate;
        });
    };

    const monthName = currentDate.toLocaleString('tr-TR', { month: 'long', year: 'numeric' });

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

        const matchesMonth =
            saleDate.getMonth() === currentDate.getMonth() &&
            saleDate.getFullYear() === currentDate.getFullYear();

        const matchesRegion = !regionFilter || sale.region === regionFilter;

        return matchesSearch && matchesRegion && matchesStatus && (ignoreDateFilter || matchesMonth);
    });

    const uniqueRegions = Array.from(new Set(initialSales.map(s => s.region)));
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);

    const showPrices = role !== 'warehouse';
    const showProfit = (role === 'admin' || role === 'accountant') && showPrices;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-card border border-border/50 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Ara..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-border/50 rounded-lg bg-secondary/30 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                        />
                    </div>
                    {/* Manual date inputs removed/hidden in favor of Month Nav as requested */}
                    {role !== 'customer' && (
                        <select
                            value={regionFilter}
                            onChange={(e) => setRegionFilter(e.target.value)}
                            className="px-3 py-2 text-sm border border-border/50 rounded-lg bg-secondary/30 outline-none min-w-[150px]"
                        >
                            <option value="">Tüm Bölgeler</option>
                            {uniqueRegions.map(r => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Status Filter Indicator */}
            {statusFilter && (
                <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-2 rounded-lg text-sm flex items-center justify-between">
                    <span className="font-medium">
                        Filtre: {statusFilter === 'late' ? 'Geciken Siparişler' : statusFilter === 'unshipped' ? 'Bekleyen Siparişler' : statusFilter === 'shipped' ? 'Bugün Kargolananlar' : statusFilter}
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

            {/* Summary - Hidden for Customer as per request */}
            {role !== 'customer' && (
                <div className={`grid grid-cols-1 ${showPrices ? (showProfit ? 'md:grid-cols-3' : 'md:grid-cols-2') : 'md:grid-cols-1'} gap-4`}>
                    <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-xs text-muted-foreground font-medium">Listelenen</p>
                            <h3 className="text-xl font-bold mt-1">{filteredSales.length} <span className="text-xs font-normal text-muted-foreground">Satış</span></h3>
                        </div>
                    </div>
                    {showPrices && (
                        <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Toplam Ciro</p>
                                <h3 className="text-xl font-bold text-primary mt-1">{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</h3>
                            </div>
                        </div>
                    )}
                    {showProfit && (
                        <div className="bg-card border border-border/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium">Toplam Kar</p>
                                <h3 className="text-xl font-bold text-green-600 mt-1">{totalProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</h3>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Month Navigation & Table Header - Hide Month Nav if global filter is active? */}
            <div className="flex items-center justify-between bg-card border border-border/50 rounded-t-xl p-2 border-b-0 shadow-sm mt-8">
                {statusFilter === 'late' || statusFilter === 'unshipped' ? (
                    <div className="flex items-center gap-2 px-2">
                        <span className="text-sm font-semibold text-primary">Tüm Zamanlar</span>
                        <span className="text-xs text-muted-foreground">({statusFilter === 'late' ? 'Geciken' : 'Bekleyen'})</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold min-w-[140px] text-center capitalize">{monthName}</span>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowRight size={16} />
                        </button>
                        <div className="w-px h-6 bg-border mx-2" />
                        <button onClick={handlePrevYear} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs font-mono">
                            {currentDate.getFullYear() - 1}
                        </button>
                        <span className="text-sm font-bold text-primary">{currentDate.getFullYear()}</span>
                        <button onClick={handleNextYear} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors text-xs font-mono">
                            {currentDate.getFullYear() + 1}
                        </button>
                    </div>
                )}
                <div className="text-xs text-muted-foreground mr-2">
                    {filteredSales.length} kayıt
                </div>
            </div>

            {/* Table */}
            <div className="bg-card border border-border/50 rounded-b-xl overflow-hidden shadow-sm -mt-6">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-muted-foreground bg-secondary/20 border-b border-border/50 uppercase font-medium tracking-wide">
                            <tr className="whitespace-nowrap">
                                <th className="px-4 py-3 font-medium">Tarih</th>
                                <th className="px-4 py-3 font-medium">Mağaza / Bölge</th>
                                <th className="px-4 py-3 font-medium">Müşteri</th>
                                <th className="px-4 py-3 font-medium">Ürün</th>
                                <th className="px-4 py-3 font-medium">Not</th>
                                <th className="px-4 py-3 font-medium">Plasiyer</th>
                                <th className="px-4 py-3 font-medium text-center">Sevk Durumu</th>
                                {(role === 'admin' || role === 'warehouse' || role === 'manager') && <th className="px-4 py-3 font-medium">İrsaliye</th>}

                                <th className="px-4 py-3 font-medium text-right">Adet</th>
                                {showPrices && <th className="px-4 py-3 font-medium text-right">Birim</th>}
                                {showPrices && <th className="px-4 py-3 font-medium text-right">Toplam</th>}
                                {showProfit && <th className="px-4 py-3 font-medium text-right">Kar</th>}

                                {(role === 'admin' || role === 'accountant') && <th className="px-4 py-3 font-medium text-center">Ödeme</th>}
                                {(role === 'admin' || role === 'accountant') && <th className="px-4 py-3 font-medium">Fatura</th>}

                                <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {filteredSales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-secondary/10 transition-colors group">
                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{new Date(sale.date).toLocaleDateString('tr-TR')}</td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className="font-medium text-foreground">{sale.storeName}</span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                            ({sale.city === sale.region ? sale.city : `${sale.city} / ${sale.region}`})
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium text-secondary-foreground whitespace-nowrap">
                                        {sale.customerName || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-foreground whitespace-nowrap">{sale.item}</td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[150px] truncate" title={sale.description || ''}>
                                        {sale.description || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{sale.salesPerson}</td>
                                    <td className="px-4 py-3 text-center whitespace-nowrap">
                                        <span className={clsx(
                                            "px-2 py-0.5 text-[10px] uppercase font-bold rounded-full",
                                            sale.isShipped ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
                                        )}>
                                            {sale.isShipped ? 'Gönderildi' : 'Bekliyor'}
                                        </span>
                                    </td>
                                    {(role === 'admin' || role === 'warehouse' || role === 'manager') && (
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                                            {sale.waybillNumber || '-'}
                                        </td>
                                    )}

                                    <td className="px-4 py-3 text-right font-mono text-muted-foreground whitespace-nowrap">{sale.quantity}</td>
                                    {showPrices && (
                                        <>
                                            <td className="px-4 py-3 text-right font-mono text-muted-foreground whitespace-nowrap">
                                                {sale.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-medium text-foreground whitespace-nowrap">
                                                {sale.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                            </td>
                                        </>
                                    )}
                                    {showProfit && (
                                        <td className={`px-4 py-3 text-right font-mono font-medium whitespace-nowrap ${sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {sale.profit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                        </td>
                                    )}

                                    {(role === 'admin' || role === 'accountant') && (
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                            <span className={clsx(
                                                "px-2 py-0.5 text-[10px] uppercase font-bold rounded-full",
                                                sale.paymentStatus === 'PAID' ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                                            )}>
                                                {sale.paymentStatus === 'PAID' ? 'Ödendi' : 'Ödenmedi'}
                                            </span>
                                        </td>
                                    )}
                                    {(role === 'admin' || role === 'accountant') && (
                                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs whitespace-nowrap">
                                            {sale.invoiceNumber || '-'}
                                        </td>
                                    )}

                                    <td className="px-4 py-3 text-right whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* Warehouse/Admin can Ship */}
                                            {(!sale.isShipped && (role === 'admin' || role === 'warehouse' || role === 'manager')) && (
                                                <button
                                                    onClick={() => handleShipClick(sale)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Sevk Et"
                                                >
                                                    <Truck size={16} />
                                                </button>
                                            )}

                                            {/* Accountant/Admin can Pay */}
                                            {(sale.paymentStatus !== 'PAID' && (role === 'admin' || role === 'accountant')) && (
                                                <button
                                                    onClick={() => handlePayClick(sale)}
                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-md transition-colors"
                                                    title="Tahsil Et"
                                                >
                                                    <CreditCard size={16} />
                                                </button>
                                            )}

                                            {/* Admin can Edit */}
                                            {role === 'admin' && (
                                                <button
                                                    onClick={() => handleEditClick(sale)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}

                                            {(role === 'admin' || role === 'manager') && (
                                                <button
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    onClick={async () => {
                                                        if (confirm('Satışı silmek istediğinize emin misiniz?')) {
                                                            await deleteSale(sale.id!);
                                                            window.location.reload();
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredSales.length === 0 && (
                                <tr>
                                    <td colSpan={
                                        7 + 1 + // Tarih, Mağaza/Bölge, Müşteri, Ürün, Not, Plasiyer, Sevk Durumu, Adet
                                        (showPrices ? 2 : 0) + // Birim, Toplam
                                        (showProfit ? 1 : 0) + // Kar
                                        ((role === 'admin' || role === 'warehouse' || role === 'manager') ? 1 : 0) + // İrsaliye
                                        ((role === 'admin' || role === 'accountant') ? 2 : 0) + // Ödeme, Fatura
                                        1 // İşlemler
                                    } className="px-4 py-8 text-center text-muted-foreground">
                                        Kriterlere uygun satış bulunamadı.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {editModalOpen && selectedSaleForEdit && (
                <EditSaleModal
                    sale={selectedSaleForEdit}
                    onClose={() => setEditModalOpen(false)}
                />
            )}

            {/* Shipment Modal */}
            {shipModalOpen && selectedSaleForShip && (
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
            )}

            {/* Payment Modal */}
            {payModalOpen && selectedSaleForPay && (
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
            )}
        </div>
    );
}
