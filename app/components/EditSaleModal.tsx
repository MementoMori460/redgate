'use client';

import { X, Search, User as UserIcon, Package } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { updateSale, getStores, getCustomers, SaleDTO } from '../actions/sales';
import { User } from 'next-auth';
import { getUsers } from '../actions/users';
import { getProducts, ProductDTO } from '../actions/products';

interface EditSaleModalProps {
    sale: SaleDTO;
    onClose: () => void;
    user?: User;
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
    name: string;
    contact: string;
};

export function EditSaleModal({ sale, onClose, user }: EditSaleModalProps) {
    const [quantity, setQuantity] = useState<number>(sale.quantity);
    const [unitPrice, setUnitPrice] = useState<number>(sale.price);
    const [cost, setCost] = useState<number>(sale.total - sale.profit); // Approximate initial cost
    const [totalPrice, setTotalPrice] = useState<number>(sale.total);
    const [netProfit, setNetProfit] = useState<number>(sale.profit);
    const [date, setDate] = useState<string>(sale.date);
    const [description, setDescription] = useState<string>(sale.description || '');
    const [waybillNumber, setWaybillNumber] = useState<string>(sale.waybillNumber || '');
    const [invoiceNumber, setInvoiceNumber] = useState<string>(sale.invoiceNumber || '');

    // Store logic
    const [stores, setStores] = useState<Store[]>([]);
    const [filteredStores, setFilteredStores] = useState<Store[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Users for Admin selection
    const [salesPersons, setSalesPersons] = useState<UserType[]>([]);

    // Customer Logic
    const [customerName, setCustomerName] = useState(sale.customerName || '');
    const [customerContact, setCustomerContact] = useState(sale.customerContact || '');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const customerWrapperRef = useRef<HTMLDivElement>(null);

    // Product Logic
    const [products, setProducts] = useState<ProductDTO[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductDTO[]>([]);
    const [itemName, setItemName] = useState(sale.item);
    const [showProductSuggestions, setShowProductSuggestions] = useState(false);
    const productWrapperRef = useRef<HTMLDivElement>(null);

    // Form fields linked to auto-fill
    const [storeCode, setStoreCode] = useState(sale.storeCode);
    const [storeName, setStoreName] = useState(sale.storeName);
    const [city, setCity] = useState(sale.city);
    const [region, setRegion] = useState(sale.region);
    const [salesPerson, setSalesPerson] = useState(sale.salesPerson);

    useEffect(() => {
        getStores().then(setStores);
        getCustomers().then(setCustomers);
        getProducts().then(setProducts);

        getUsers().then(users => {
            setSalesPersons(users as UserType[]);
        });

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
    }, []);

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
            await updateSale(sale.id!, {
                date: date,
                storeCode: storeCode,
                region: region,
                city: city,
                storeName: storeName,
                salesPerson: salesPerson,
                customerName: customerName,
                customerContact: customerContact,
                item: itemName,
                quantity: quantity,
                price: calculateDiscountedPrice(),
                total: totalPrice,
                profit: netProfit,
                description: description,
                waybillNumber: waybillNumber,
                invoiceNumber: invoiceNumber
            });

            // Reload page to reflect changes
            window.location.reload();
            onClose();
        } catch (error) {
            alert('Satış güncellenirken bir hata oluştu.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card w-full max-w-2xl rounded-2xl border border-border flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-border flex justify-between items-center">
                    <h2 className="text-xl font-bold text-foreground">Satışı Düzenle</h2>
                    <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Tarih</label>
                                <input
                                    type="date"
                                    name="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2 relative" ref={wrapperRef}>
                                <label className="text-sm font-medium text-secondary-foreground">Mağaza Kodu / Adı Ara</label>
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
                                        placeholder="Mağaza kodu veya ismi girin..."
                                        autoComplete="off"
                                        className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 pl-10 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all font-mono"
                                    />
                                    <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                                </div>
                                {showSuggestions && filteredStores.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                                        {filteredStores.map(store => (
                                            <div
                                                key={store.code}
                                                onClick={() => selectStore(store)}
                                                className="p-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50 last:border-0"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-primary">{store.code}</span>
                                                    <span className="text-sm text-muted-foreground">{store.city}</span>
                                                </div>
                                                <div className="text-sm font-medium">{store.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Bölge</label>
                                <input
                                    type="text"
                                    name="region"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)} // Editable for corrections
                                    className="w-full bg-secondary/10 border border-border rounded-lg px-4 py-2.5 text-foreground outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Şehir</label>
                                <input
                                    type="text"
                                    name="city"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)} // Editable for corrections
                                    className="w-full bg-secondary/10 border border-border rounded-lg px-4 py-2.5 text-foreground outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Mağaza Adı</label>
                                <input
                                    type="text"
                                    name="storeName"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)} // Editable
                                    className="w-full bg-secondary/10 border border-border rounded-lg px-4 py-2.5 text-foreground outline-none"
                                />
                            </div>
                        </div>

                        {/* Customer & SalesPerson Section */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Customer Autocomplete */}
                            <div className="space-y-2 relative" ref={customerWrapperRef}>
                                <label className="text-sm font-medium text-secondary-foreground">Müşteri (Opsiyonel)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={customerName}
                                        onChange={handleCustomerNameChange}
                                        onFocus={() => {
                                            if (!customerName) setFilteredCustomers(customers);
                                            setShowCustomerSuggestions(true);
                                        }}
                                        placeholder="Müşteri Adı..."
                                        autoComplete="off"
                                        className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 pl-10 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    />
                                    <UserIcon className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                                </div>
                                {showCustomerSuggestions && filteredCustomers.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto z-50 custom-scrollbar">
                                        {filteredCustomers.map((c, i) => (
                                            <div
                                                key={i}
                                                onClick={() => selectCustomer(c)}
                                                className="p-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50 last:border-0"
                                            >
                                                <div className="font-medium">{c.name}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">İletişim/Tel (Opsiyonel)</label>
                                <input
                                    type="text"
                                    name="customerContact"
                                    value={customerContact}
                                    onChange={(e) => setCustomerContact(e.target.value)}
                                    placeholder="05XX..."
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>


                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-foreground">Satış Personeli</label>

                            {salesPersons.length > 0 ? (
                                <div className="flex gap-2">
                                    <select
                                        name="salesPersonSelect"
                                        value={salesPerson}
                                        onChange={(e) => setSalesPerson(e.target.value)}
                                        className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Personel Seçiniz...</option>
                                        {salesPersons.map(p => (
                                            <option key={p.id} value={p.name}>{p.name} ({p.role})</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <input
                                    type="text"
                                    name="salesPerson"
                                    value={salesPerson}
                                    onChange={(e) => setSalesPerson(e.target.value)}
                                    placeholder="Ad Soyad"
                                    required
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            )}

                        </div>

                        {/* Product Search */}
                        <div className="space-y-2 relative" ref={productWrapperRef}>
                            <label className="text-sm font-medium text-secondary-foreground">Ürün</label>
                            {/* Only showing autocomplete, user can still type custom if they really want, but logic mainly supports selection */}
                            <div className="relative">
                                <input
                                    type="text"
                                    name="item"
                                    value={itemName}
                                    onChange={handleProductChange}
                                    onFocus={() => {
                                        if (!itemName) setFilteredProducts(products);
                                        setShowProductSuggestions(true);
                                    }}
                                    placeholder="Ürün adı veya kodu ara..."
                                    required
                                    autoComplete="off"
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 pl-10 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                                <Package className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                            </div>
                            {showProductSuggestions && filteredProducts.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl max-h-60 overflow-y-auto z-50 custom-scrollbar">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            onClick={() => selectProduct(product)}
                                            className="p-3 hover:bg-secondary/50 cursor-pointer border-b border-border/50 last:border-0"
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-primary">{product.productNumber}</span>
                                                <span className="text-sm text-muted-foreground">{product.price ? `${product.price} TL` : ''}</span>
                                            </div>
                                            <div className="text-sm font-medium">{product.name}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Miktar</label>
                                <input
                                    type="number"
                                    name="quantity"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Birim</label>
                                <select name="unit" className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer">
                                    <option>Adet</option>
                                    <option>Kg</option>
                                    <option>Set</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Birim Fiyat (TL)</label>
                                <input
                                    type="number"
                                    name="unitPrice"
                                    step="0.01"
                                    value={unitPrice}
                                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 items-end">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">İndirim Oranı (%)</label>
                                <input
                                    type="number"
                                    name="discountRate"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    value={discountRate}
                                    onChange={(e) => setDiscountRate(Number(e.target.value))}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">İndirimli Birim Fiyat</label>
                                <div className="w-full px-4 py-2.5 bg-secondary/10 border border-border rounded-lg text-foreground font-mono font-medium">
                                    {calculateDiscountedPrice().toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-foreground">Açıklama / Not</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all resize-none h-20"
                                placeholder="Sipariş notu..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">İrsaliye No</label>
                                <input
                                    type="text"
                                    value={waybillNumber}
                                    onChange={(e) => setWaybillNumber(e.target.value)}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="IRS-..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Fatura No</label>
                                <input
                                    type="text"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    placeholder="FAT-..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-secondary-foreground">Toplam Maliyet (TL)</label>
                                <input
                                    type="number"
                                    name="cost"
                                    step="0.01"
                                    value={cost}
                                    onChange={(e) => setCost(Number(e.target.value))}
                                    placeholder="0.00"
                                    className="w-full bg-secondary/30 border border-border rounded-lg px-4 py-2.5 text-foreground focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                            </div>
                            <div className="bg-secondary/20 p-4 rounded-xl space-y-1">
                                <div className="flex justify-between text-sm text-secondary-foreground">
                                    <span>Toplam Fiyat:</span>
                                    <span className="font-bold text-foreground">{totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                                    <input type="hidden" name="totalPrice" value={totalPrice} />
                                </div>
                                <div className="flex justify-between text-sm text-secondary-foreground">
                                    <span>Net Kar:</span>
                                    <span className={`font-bold ${netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {netProfit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                                    </span>
                                    <input type="hidden" name="netProfit" value={netProfit} />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-medium text-secondary-foreground hover:bg-secondary/50 transition-colors">
                                İptal
                            </button>
                            <button type="submit" className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 rounded-xl font-medium shadow-lg shadow-primary/25 transition-all active:scale-95">
                                Güncelle
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
