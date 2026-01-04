import { ChangePasswordForm } from './ChangePasswordForm';
import { RevenueTargetForm } from './RevenueTargetForm';
import { MaxShippingDaysForm } from './MaxShippingDaysForm';
import { ImportDataButton } from './ImportDataButton';
import { SignOutButton } from './SignOutButton';
import { auth } from '@/auth';

export default async function SettingsPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Ayarlar</h1>
                <p className="text-sm text-secondary-foreground">Uygulama tercihlerinizi ve hesap güvenliğinizi yönetin.</p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/50 shadow-sm">
                <ChangePasswordForm />
                {isAdmin && (
                    <>
                        <RevenueTargetForm />
                        <MaxShippingDaysForm />
                        <ImportDataButton />
                    </>
                )}
                <SignOutButton />
            </div>
        </div>
    );
}
