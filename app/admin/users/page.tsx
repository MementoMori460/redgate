import { getUsers } from '@/app/actions/users';
import { UsersClient } from './UsersClient';

export default async function UsersPage() {
    const users = await getUsers();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Kullanıcı Yönetimi</h1>
            <UsersClient initialUsers={users} />
        </div>
    );
}
