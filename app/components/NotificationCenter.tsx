'use client';

import { Bell, Truck, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning';
    time: string;
    isRead: boolean;
}

const mockNotifications: Notification[] = [
    { id: '1', title: 'Kargo Gecikmesi', message: 'Ürün #3 (Kartvizit) 3 gündür beklemede.', type: 'warning', time: '2 saat önce', isRead: false },
    { id: '2', title: 'Ürün Kargolandı', message: 'Ürün #1 (Kanca 100cm) Bursa mağazasına kargolandı.', type: 'info', time: '5 saat önce', isRead: true },
    { id: '3', title: 'Yeni Satış', message: 'Sezgin İtem yeni bir satış ekledi.', type: 'info', time: '1 gün önce', isRead: true },
];

export function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = mockNotifications.filter(n => !n.isRead).length;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-muted hover:text-foreground transition-colors rounded-full hover:bg-secondary/50"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-xl shadow-black/50 overflow-hidden z-50">
                    <div className="p-4 border-b border-border bg-secondary/20">
                        <h3 className="font-semibold text-foreground">Bildirimler</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {mockNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={clsx(
                                    "p-4 border-b border-border last:border-0 hover:bg-secondary/20 transition-colors cursor-pointer",
                                    !notification.isRead && "bg-primary/5"
                                )}
                            >
                                <div className="flex gap-3">
                                    <div className={clsx(
                                        "mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                                        notification.type === 'warning' ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                                    )}>
                                        {notification.type === 'warning' ? <AlertTriangle size={14} /> : <Truck size={14} />}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-foreground">{notification.title}</h4>
                                        <p className="text-xs text-secondary-foreground mt-1">{notification.message}</p>
                                        <p className="text-[10px] text-muted mt-2">{notification.time}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-3 border-t border-border bg-secondary/10 text-center">
                        <button className="text-xs font-medium text-primary hover:text-accent transition-colors">
                            Tümünü okundu işaretle
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
