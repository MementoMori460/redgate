import { getUsers, deleteUser } from '@/app/actions/users';
import { Trash2, User } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { CreateUserForm } from './CreateUserForm';

export default async function UsersPage() {
    const users = await getUsers();



    async function handleDeleteUser(formData: FormData) {
        'use server';
        const id = formData.get('id') as string;
        await deleteUser(id);
        revalidatePath('/admin/users');
    }

    return (
        <div className="space-y-8 p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Kullanıcı Yönetimi</h1>
                    <p className="text-muted-foreground">Sisteme erişimi olan kullanıcıları yönetin.</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* User List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <User className="text-primary" size={20} />
                            Mevcut Kullanıcılar
                        </h2>
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-secondary/20 rounded-lg border border-border/50 hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{user.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span>@{user.username}</span>
                                                <span>•</span>
                                                <span className="bg-secondary/50 px-2 py-0.5 rounded text-foreground font-medium">{user.role}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <form action={handleDeleteUser}>
                                        <input type="hidden" name="id" value={user.id} />
                                        <button className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </form>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Create User Form */}
                <div className="lg:col-span-1">
                    <CreateUserForm />
                </div>
            </div>
        </div>
    );
}
