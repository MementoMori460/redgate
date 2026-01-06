'use client';

import { useState, useEffect } from 'react';
import { getProducts, ProductDTO } from '@/app/actions/products';
import { Download } from 'lucide-react';

export default function SupplierProductsPage() {
    const [products, setProducts] = useState<ProductDTO[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Failed to load products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!products.length) return;

        const headers = ["Ürün Kodu", "Ürün Adı", "Açıklama"];
        const csvContent = [
            headers.join(','),
            ...products.map(p => [
                `"${p.productNumber}"`,
                `"${p.name}"`,
                `"${p.description || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `urunlerim_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8 text-center">Yükleniyor...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold tracking-tight">Ürünlerim</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
                >
                    <Download size={16} />
                    Excel/CSV İndir
                </button>
            </div>

            <div className="border rounded-lg overflow-hidden bg-card">
                <table className="w-full text-sm text-left">
                    <thead className="bg-secondary text-muted-foreground uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3">Kod</th>
                            <th className="px-4 py-3">Ürün Adı</th>
                            <th className="px-4 py-3">Açıklama</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                    Henüz ürününüz yok.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-secondary/20 transition-colors">
                                    <td className="px-4 py-3 font-mono text-xs">{product.productNumber}</td>
                                    <td className="px-4 py-3 font-medium">{product.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{product.description || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
