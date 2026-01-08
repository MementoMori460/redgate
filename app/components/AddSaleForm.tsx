'use client';

import { X, Search, User as UserIcon, Package, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { createSale, getStores } from '../actions/sales';
import { getCustomers } from '../actions/customers';
import { User } from 'next-auth';
import { getUsers } from '../actions/users';
import { getProducts, ProductDTO } from '../actions/products';

import { useRole } from '../contexts/RoleContext';

interface AddSaleFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

type Store = {
    code: string;
    name: string;
    city: string;
    region: string;
};

type UserType = {
    id: string;
    name: string;
    username: string;
    role: string;
};

type Customer = {
    id: string;
    name: string;
    contact: string;
    email: string;
    city?: string;
};

export function AddSaleForm({ onSuccess, onCancel }: AddSaleFormProps) {
    const { role, currentUser } = useRole();
    const [quantity, setQuantity] = useState<number>(1);
    const [unitPrice, setUnitPrice] = useState<number>(0);
    const [cost, setCost] = useState<number>(0);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [netProfit, setNetProfit] = useState<number>(0);

    // Store logic
    const [stores, setStores] = useState<Store[]>([]);
    const [filteredStores, setFilteredStores] = useState<Store[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Users for Admin selection
    const [salesPersons, setSalesPersons] = useState<UserType[]>([]);

    // Customer Logic
    const [customerName, setCustomerName] = useState('');
    const [customerContact, setCustomerContact] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');

    // Other Form Fields
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [waybillNumber, setWaybillNumber] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isShipped, setIsShipped] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('UNPAID');

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const customerWrapperRef = useRef<HTMLDivElement>(null);

    // Product Logic
    const [products, setProducts] = useState<ProductDTO[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([]);
    const [itemName, setItemName] = useState('');
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const productWrapperRef = useRef<HTMLDivElement>(null);

    // Form fields linked to auto-fill
    const [storeCode, setStoreCode] = useState('');
    const [storeName, setStoreName] = useState('');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [salesPerson, setSalesPerson] = useState('');

    useEffect(() => {
        getStores().then(setStores);
        getCustomers().then(rawCustomers => {
            setCustomers(rawCustomers.map((c: any) => ({
                id: c.id,
                name: c.name,
                contact: c.phone || '', // Map phone to contact for now
                email: c.email || '',
                city: c.city || ''
            })));
        });
        getProducts().then(setProducts);

        // Setup based on role
        if (role === 'sales') {
            setSalesPerson(currentUser || '');
        } else if (role === 'admin' || role === 'warehouse' || role === 'accountant' || role === 'manager') {
            getUsers().then(users => {
                setSalesPersons(users as UserType[]);
            });
        }

        // Click outside to close suggestions
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (customerWrapperRef.current && !customerWrapperRef.current.contains(event.target as Node)) {
                setShowCustomerSuggestions(false);
            }
            if (productWrapperRef.current && !productWrapperRef.current.contains(event.target as Node)) {
                setShowProductSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [role, currentUser]);

    const handleCustomerNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCustomerName(value);
        setShowCustomerSuggestions(true);

        const filtered = customers.filter(c =>
            c.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredCustomers(filtered);
    };

    const selectCustomer = (customer: Customer) => {
        setCustomerName(customer.name);
        setCustomerContact(customer.contact);
        setCustomerEmail(customer.email);
        setShowCustomerSuggestions(false);
    };

    const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setItemName(value);
        setShowProductSuggestions(true);

        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(value.toLowerCase()) ||
            p.name.toLowerCase().includes(value.toLowerCase()) ||
            (p.productNumber || '').toLowerCase().includes(value.toLowerCase())
        );
        setFilteredProducts(filtered);
    };

    const selectProduct = (product: ProductDTO) => {
        setItemName(product.name);
        if (product.price) {
            setUnitPrice(product.price);
        }
        setShowProductSuggestions(false);
    };

    const [discountRate, setDiscountRate] = useState<number>(0);

    // Calculate discounted price (for display and final total)
    const calculateDiscountedPrice = () => {
        if (!discountRate || discountRate <= 0) return unitPrice;
        return unitPrice * (1 - discountRate / 100);
    };

    useEffect(() => {
        const finalUnitPrice = calculateDiscountedPrice();
        const total = quantity * finalUnitPrice;
        const profit = total - cost;
        setTotalPrice(total);
        setNetProfit(profit);
    }, [quantity, unitPrice, cost, discountRate]);

    const handleStoreCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setStoreCode(value);
        setShowSuggestions(true);

        const filtered = stores.filter(store =>
            store.code.toLowerCase().includes(value.toLowerCase()) ||
            store.name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredStores(filtered);
    };

    const selectStore = (store: Store) => {
        setStoreCode(store.code);
        setStoreName(store.name);
        setCity(store.city);
        setRegion(store.region);
        setShowSuggestions(false);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createSale({
                date: date,
                storeCode: storeCode,
                region: region,
                city: city,
                storeName: storeName,
                salesPerson: salesPerson,
                customerName: customerName.trim(),
                customerContact: customerContact,
                email: customerEmail,
                item: itemName,
                quantity: quantity,
                price: calculateDiscountedPrice(),
                total: totalPrice,
                profit: netProfit,
                description: description,
                waybillNumber: waybillNumber,
                invoiceNumber: invoiceNumber,
                isShipped: isShipped,
                paymentStatus: paymentStatus
            });
            onSuccess();
        } catch (error) {
            alert('Satış eklenirken bir hata oluştu.');
        }
    };

    return (
        <form className="space-y-3" onSubmit={handleSubmit} onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}>
            {/* Top Section: Date & Store */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Tarih</label>
                    <input
                        type="date"
                        name="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
                    />
                </div>
                <div className="md:col-span-8 space-y-1 relative" ref={wrapperRef}>
                    <label className="text-[10px] font-semibold text-muted-foreground">Mağaza Kodu / Adı</label>
                    <div className="relative">
                        <input
                            type="text"
                            name="storeCodeSearch"
                            value={storeCode}
                            onChange={handleStoreCodeChange}
                            onFocus={() => {
                                if (!storeCode) setFilteredStores(stores);
                                setShowSuggestions(true);
                            }}
                            placeholder="Mağaza ara..."
                            autoComplete="off"
                            className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 pl-8 text-xs focus:ring-1 focus:ring-primary outline-none transition-all font-mono"
                        />
                        <Search className="absolute left-2.5 top-2.5 md:top-2 text-muted-foreground" size={14} />
                    </div>
                    {showSuggestions && filteredStores.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-56 overflow-y-auto z-50 custom-scrollbar">
                            {filteredStores.map(store => (
                                <div
                                    key={store.code}
                                    onClick={() => selectStore(store)}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer border-b border-border/50 last:border-0"
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-primary text-[10px]">{store.code}</span>
                                        <span className="text-[9px] text-muted-foreground">{store.city}</span>
                                    </div>
                                    <div className="text-[10px] font-medium truncate">{store.name}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Store Details (Compact) */}
            <div className="grid grid-cols-3 gap-2 bg-secondary/5 p-2 rounded border border-border/40">
                <div className="space-y-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">Bölge</label>
                    <input
                        type="text"
                        value={region}
                        readOnly
                        className="w-full bg-transparent border-0 border-b border-border/50 px-0 py-0.5 text-[10px] font-medium focus:ring-0 focus:border-primary placeholder:text-muted-foreground/30 cursor-not-allowed"
                        placeholder="-"
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">Şehir</label>
                    <input
                        type="text"
                        value={city}
                        readOnly
                        className="w-full bg-transparent border-0 border-b border-border/50 px-0 py-0.5 text-[10px] font-medium focus:ring-0 focus:border-primary placeholder:text-muted-foreground/30 cursor-not-allowed"
                        placeholder="-"
                    />
                </div>
                <div className="space-y-0.5">
                    <label className="text-[9px] font-medium text-muted-foreground uppercase">Mağaza Adı</label>
                    <input
                        type="text"
                        value={storeName}
                        readOnly
                        className="w-full bg-transparent border-0 border-b border-border/50 px-0 py-0.5 text-[10px] font-medium focus:ring-0 focus:border-primary placeholder:text-muted-foreground/30 cursor-not-allowed"
                        placeholder="-"
                    />
                </div>
            </div>

            {/* Customer & Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-3">
                {/* Left Column: Customer & SalesPerson */}
                <div className="space-y-3">
                    <div className="space-y-1 relative" ref={customerWrapperRef}>
                        <label className="text-[10px] font-semibold text-muted-foreground">Müşteri</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={customerName}
                                onChange={handleCustomerNameChange}
                                onFocus={() => {
                                    if (!customerName) setFilteredCustomers(customers);
                                    setShowCustomerSuggestions(true);
                                }}
                                className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 pl-8 text-xs focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Müşteri Adı Ara..."
                            />
                            <UserIcon className="absolute left-2.5 top-2.5 md:top-2 text-muted-foreground" size={14} />
                        </div>
                        {showCustomerSuggestions && filteredCustomers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-40 overflow-y-auto z-50">
                                {filteredCustomers.map((c, i) => (
                                    <div key={i} onClick={() => selectCustomer(c)} className="px-3 py-2 hover:bg-accent cursor-pointer text-[10px] font-medium">
                                        <div className="font-medium">{c.name}</div>
                                        <div className="text-[9px] text-muted-foreground">{c.city} • {c.contact}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {customerName && !customers.some(c => c.name.toLowerCase() === customerName.toLowerCase()) && (
                            <div className="text-[9px] text-blue-500 font-medium mt-0.5 ml-1 flex items-center gap-1">
                                <Plus size={10} /> Yeni kayıt
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">İletişim</label>
                        <input
                            type="text"
                            value={customerContact}
                            onChange={(e) => setCustomerContact(e.target.value)}
                            className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                            placeholder="Tel / Email"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Satış Personeli</label>
                        {salesPersons.length > 0 ? (
                            <select
                                value={salesPerson}
                                onChange={(e) => setSalesPerson(e.target.value)}
                                className="w-full h-9 md:h-8 bg-card border border-border rounded px-2 text-xs focus:ring-1 focus:ring-primary outline-none appearance-none"
                            >
                                <option value="">Personel Seç...</option>
                                {salesPersons.map(p => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={salesPerson}
                                onChange={(e) => setSalesPerson(e.target.value)}
                                className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs"
                                placeholder="Personel Adı"
                            />
                        )}
                    </div>
                </div>

                {/* Right Column: Product */}
                <div className="space-y-3">
                    <div className="space-y-1 relative" ref={productWrapperRef}>
                        <label className="text-[10px] font-semibold text-muted-foreground">Ürün</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={itemName}
                                onChange={handleProductChange}
                                onFocus={() => {
                                    if (!itemName) setFilteredProducts(products);
                                    setShowProductSuggestions(true);
                                }}
                                className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 pl-8 text-xs focus:ring-1 focus:ring-primary outline-none"
                                placeholder="Ürün Ara..."
                            />
                            <Package className="absolute left-2.5 top-2.5 md:top-2 text-muted-foreground" size={14} />
                        </div>
                        {showProductSuggestions && filteredProducts.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg max-h-56 overflow-y-auto z-50 custom-scrollbar">
                                {filteredProducts.map(p => (
                                    <div key={p.id} onClick={() => selectProduct(p)} className="px-3 py-2 hover:bg-accent cursor-pointer border-b border-border/50 last:border-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-primary text-[10px]">{p.productNumber}</span>
                                            <span className="text-[9px] text-muted-foreground">{p.price} TL</span>
                                        </div>
                                        <div className="text-[10px] truncate">{p.name}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground">Miktar</label>
                            <input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Number(e.target.value))}
                                className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground">Birim Fiyat</label>
                            <input
                                type="number"
                                step="0.01"
                                value={unitPrice}
                                onChange={(e) => setUnitPrice(Number(e.target.value))}
                                className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs text-right focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-muted-foreground">İndirim %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={discountRate}
                                onChange={(e) => setDiscountRate(Number(e.target.value))}
                                className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs text-center focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>
                        {role !== 'sales' && (
                            <div className="space-y-1">
                                <label className="text-[10px] font-semibold text-muted-foreground">Maliyet</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={cost}
                                    onChange={(e) => setCost(Number(e.target.value))}
                                    className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs text-right focus:ring-1 focus:ring-primary outline-none"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-secondary/10 rounded-lg p-3 flex justify-between items-center border border-border/50">
                <div className="flex gap-4">
                    <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Net Toplam</span>
                        <span className="text-sm font-bold text-foreground font-mono">
                            {totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                        </span>
                    </div>
                    {role !== 'sales' && (
                        <div className="flex flex-col">
                            <span className="text-[9px] text-muted-foreground uppercase font-semibold">Hesaplanan Kar</span>
                            <span className={`text-sm font-bold font-mono ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                {netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Docs & Status */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-8 grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">İrsaliye No</label>
                        <input
                            type="text"
                            value={waybillNumber}
                            onChange={(e) => setWaybillNumber(e.target.value)}
                            className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                            placeholder="-"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-muted-foreground">Fatura No</label>
                        <input
                            type="text"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                            placeholder="-"
                        />
                    </div>
                </div>
                <div className="md:col-span-4 space-y-1">
                    <label className="text-[10px] font-semibold text-muted-foreground">Durum</label>
                    <div className="grid grid-cols-2 md:flex md:flex-col gap-2">
                        <select
                            value={isShipped ? 'true' : 'false'}
                            onChange={(e) => setIsShipped(e.target.value === 'true')}
                            className="w-full h-[36px] md:h-[30px] bg-card border border-border rounded px-1 text-[10px] outline-none"
                        >
                            <option value="false">🔴 Bekliyor</option>
                            <option value="true">🟢 Kargolandı</option>
                        </select>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full h-[36px] md:h-[30px] bg-card border border-border rounded px-1 text-[10px] outline-none"
                        >
                            <option value="UNPAID">⚪️ Ödenmedi</option>
                            <option value="PAID">🟢 Ödendi</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-semibold text-muted-foreground">Açıklama</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full h-9 md:h-8 bg-background border border-border rounded px-2 text-xs focus:ring-1 focus:ring-primary outline-none"
                    placeholder="Not ekleyin..."
                />
            </div>

            {/* Footer Actions */}
            <div className="pt-2 flex justify-end gap-2 border-t border-border mt-2 sticky bottom-0 bg-card z-10">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-3 py-2 md:py-1.5 rounded text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors"
                >
                    İptal
                </button>
                <button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 md:py-1.5 rounded text-xs font-medium shadow-sm transition-all active:scale-95"
                >
                    Satış Ekle
                </button>
            </div>
        </form>
    );
}
