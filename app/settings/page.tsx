import { ChangePasswordForm } from './ChangePasswordForm';
import { RevenueTargetForm } from './RevenueTargetForm';
import { auth } from '@/auth';

export default async function SettingsPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'admin';

    return (
        <div className="p-8 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Ayarlar</h1>
                <p className="text-muted-foreground">Hesap ve uygulama ayarlarınızı yönetin.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <ChangePasswordForm />
                {isAdmin && <RevenueTargetForm />}
            </div>
        </div>
    );
}
