import { useEffect, useState } from 'react';
import { fetchUsers, setUserRole } from '../../api/admin';
import { useAuth } from '../../context/AuthContext';
import Loader from '../../components/Loader';
import Badge from '../../components/Badge';

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleRole = async (u) => {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setUpdatingId(u.id);
    try {
      await setUserRole(u.id, newRole);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <Loader label="Loading users" />;

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl text-white">Users</h1>
      {error && <p className="mb-4 text-sm text-red-300">{error}</p>}

      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-ink-faint">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-line bg-surface/40">
                <td className="px-4 py-3 text-white">{u.name}</td>
                <td className="px-4 py-3 text-ink-dim">{u.email}</td>
                <td className="px-4 py-3">
                  <Badge variant={u.role === 'admin' ? 'gold' : 'default'}>{u.role}</Badge>
                </td>
                <td className="px-4 py-3 text-ink-dim">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.id !== currentUser.id && (
                    <button
                      type="button"
                      onClick={() => toggleRole(u)}
                      disabled={updatingId === u.id}
                      className="text-gold-soft hover:underline disabled:opacity-50"
                    >
                      {u.role === 'admin' ? 'Revoke admin' : 'Make admin'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
