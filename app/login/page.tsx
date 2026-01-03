'use client';

import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { authenticate } from '../lib/actions';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined);
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Giriş Yap</h1>
                        <p className="text-muted-foreground">Devam etmek için hesabınıza giriş yapın</p>
                    </div>

                    <form action={dispatch} className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="username">
                                    Kullanıcı Adı
                                </label>
                                <div className="relative">
                                    <input
                                        className="flex h-12 w-full rounded-xl border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                        id="username"
                                        name="username"
                                        placeholder="Kullanıcı adınızı girin"
                                        required
                                    />
                                    <User className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                    Şifre
                                </label>
                                <div className="relative">
                                    <input
                                        className="flex h-12 w-full rounded-xl border border-input bg-secondary/30 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 pr-10"
                                        id="password"
                                        name="password"
                                        type={isVisible ? "text" : "password"}
                                        placeholder="Şifrenizi girin"
                                        required
                                    />
                                    <Lock className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                                    <button
                                        type="button"
                                        onClick={() => setIsVisible(!isVisible)}
                                        className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {isVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                        </div>


                        {errorMessage && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg flex items-center gap-2">
                                <p>{errorMessage}</p>
                            </div>
                        )}

                        <LoginButton />
                    </form>
                </div>
            </div >
        </div >
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            aria-disabled={pending}
            disabled={pending}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground text-white shadow transition-transform hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 w-full active:scale-95"
        >
            {pending ? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </button>
    );
}
