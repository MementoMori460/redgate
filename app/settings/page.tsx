import { ChangePasswordForm } from './ChangePasswordForm';
import { RevenueTargetForm } from './RevenueTargetForm';
import { MaxShippingDaysForm } from './MaxShippingDaysForm';
import { ImportDataButton } from './ImportDataButton';
import { AdminEmailForm } from './AdminEmailForm';
import { SignOutButton } from './SignOutButton';
import { BackupManager } from './BackupManager';
import { auth } from '@/auth';

export default async function SettingsPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">

            <div className="bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/50 shadow-sm">
                <ChangePasswordForm />
                {isAdmin && (
                    <>
                        <AdminEmailForm />
                        <RevenueTargetForm />
                        <MaxShippingDaysForm />
                        <ImportDataButton />
                        <BackupManager />
                    </>
                )}
                <SignOutButton />
            </div>
        </div>
    );
}
