'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import Navbar from '@/components/Navbar';
import type { News } from '@/types/news';
import type { User } from '@/types/user';

export default function NewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<News[]>([]);
  const [user, setUser] = useState<User | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded?.sub) {
        router.push('/login');
        return;
      }
    } catch (err) {
      console.error('Ошибка декодирования токена:', err);
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        setUser(data);
      } catch {
        router.push('/login');
      }
    };
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_URL}/news`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Ошибка загрузки новостей:', err);
        setNews([]);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchNews();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#13151e] via-[#182232] to-[#212e43] text-white flex items-center justify-center">
        Загрузка...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13151e] via-[#182232] to-[#212e43] text-white pb-12">
      <Navbar user={user} currentPage="news" />
      <div className="max-w-4xl mx-auto pt-8 px-3 md:px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-cyan-200 drop-shadow">Последние новости</h1>
        {news.length === 0 ? (
          <p className="text-cyan-100/60 text-lg text-center mt-20">Новостей пока нет</p>
        ) : (
          <ul className="space-y-6">
            {news.map((item) => (
              <li key={item.id} className="bg-white/5 border border-cyan-300/10 rounded-2xl p-6 shadow hover:shadow-lg transition">
                <h2 className="text-xl font-semibold text-cyan-200 mb-2">{item.title}</h2>
                <p className="text-cyan-100/80 whitespace-pre-wrap">{item.content}</p>
                <p className="text-sm text-cyan-100/50 mt-4">{new Date(item.createdAt).toLocaleString('ru-RU')}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
