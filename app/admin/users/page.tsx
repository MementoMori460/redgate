import { getUsers, deleteUser } from '@/app/actions/users';
import { Trash2, User } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { CreateUserForm } from './CreateUserForm';
import { UserItem } from './UserItem';

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
                                <UserItem key={user.id} user={user} />
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
