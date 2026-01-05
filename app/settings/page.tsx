import { BackupManager } from './BackupManager';
import { MaintenanceTools } from './MaintenanceTools';
import { AdminEmailForm } from './AdminEmailForm';
import { SmtpSettingsForm } from './SmtpSettingsForm';
import { MaxShippingDaysForm } from './MaxShippingDaysForm';
import { ChangePasswordForm } from './ChangePasswordForm';
import { SignOutButton } from './SignOutButton';
import { auth } from '@/auth';

export default async function SettingsPage() {
    const session = await auth();
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'admin';

    return (
        <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">

            {isAdmin && (
                <>
                    {/* Data (Top) */}
                    <section className="space-y-4">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Veri & Yedekleme</h2>
                        <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden p-1">
                            <BackupManager />
                            <div className="px-4 py-2 bg-secondary/10 border-t border-border/50">
                                <MaintenanceTools />
                            </div>
                        </div>
                    </section>

                    {/* System (Middle) */}
                    <section className="space-y-4">
                        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Sistem Ayarları</h2>
                        <div className="bg-card border border-border/50 rounded-lg divide-y divide-border/50 shadow-sm">
                            <AdminEmailForm />
                            <MaxShippingDaysForm />
                            <SmtpSettingsForm />
                        </div>
                    </section>
                </>
            )}

            {/* Account (Bottom) */}
            <section className="space-y-4">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Hesap</h2>
                <div className="bg-card border border-border/50 rounded-lg shadow-sm overflow-hidden">
                    <ChangePasswordForm />
                </div>
                <div className="pt-2">
                    <SignOutButton />
                </div>
            </section>
        </div>
    );
}
