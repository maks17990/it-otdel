'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import UserDetailsCard from '@/components/UserDetailsCard';
import { useParams, useRouter } from 'next/navigation';
import { UserDetails } from '@/types/user';

const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export default function AdminUserDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [details, setDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`${apiBase}/users/details/${id}`, { headers: getHeaders() })
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load user');
        const data = await res.json();
        setDetails(data);
      })
      .catch(() => setError('Не удалось загрузить пользователя'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <AdminNavbar />
      <div className="flex-1 py-10 px-4">
        <button
          onClick={() => router.back()}
          className="text-cyan-400 hover:underline mb-5 flex items-center gap-2"
        >
          ← Назад
        </button>
        {loading ? (
          <div className="text-center text-white/60">Загрузка...</div>
        ) : details ? (
          <UserDetailsCard details={details} onClose={() => router.back()} />
        ) : (
          <div className="text-center text-red-400">{error || 'Пользователь не найден'}</div>
        )}
      </div>
    </div>
  );
}
