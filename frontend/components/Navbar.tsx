'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Bell, UserCircle, LogOut } from 'lucide-react';
const API_URL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : '';







interface NavbarProps {
  user: any;
  currentPage: 'profile' | 'news' | 'instructions' | 'requests' | 'dashboard';
}

const apiBase = process.env.NEXT_PUBLIC_API_URL;

export default function Navbar({ user, currentPage }: NavbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch(`${apiBase}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Ошибка при выходе:', err);
    } finally {
      localStorage.removeItem('token');
      router.push('/login');
    }
  };

  const links = [
    { href: '/dashboard/news', label: 'Новости', key: 'news' },
    { href: '/dashboard/instructions', label: 'Инструкции', key: 'instructions' },
    { href: '/dashboard/requests', label: 'Заявки', key: 'requests' },
    { href: '/dashboard', label: 'Главная', key: 'dashboard' },
  ];

  return (
    <nav className="max-w-6xl mx-auto my-3 px-3 md:px-6">
      <div className="backdrop-blur-2xl bg-gradient-to-r from-[#101828]/85 to-[#17253a]/80 border-b border-cyan-400/10 shadow-xl px-4 md:px-8 py-3 rounded-2xl flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-5">
          {links.map((link) => (
            <button
              key={link.key}
              onClick={() => router.push(link.href)}
              className={`px-4 py-1 rounded-full transition-all text-sm font-semibold
                ${
                  currentPage === link.key
                    ? 'bg-cyan-400/90 text-gray-900 shadow-md pointer-events-none'
                    : 'text-cyan-100 hover:bg-cyan-400/15 hover:text-white/90'
                }`}
              disabled={currentPage === link.key}
              style={{ opacity: currentPage === link.key ? 0.92 : 1 }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-5">
          {user && (
            <button
              onClick={() => router.push('/dashboard/profile')}
              title="Профиль"
              className="flex items-center gap-2 text-cyan-100 hover:text-cyan-300 transition px-2 py-1 rounded-full"
            >
              <UserCircle className="w-5 h-5" />
              <span className="hidden md:inline text-base font-medium">
                {user.lastName} {user.firstName}
              </span>
            </button>
          )}

          <button
            title="Уведомления"
            className="relative text-cyan-100 hover:text-cyan-300 transition px-2 py-1 rounded-full"
            aria-label="Уведомления"
            onClick={() => router.push('/dashboard/notifications')}
          >
            <Bell className="w-5 h-5" />
            {/* Для непрочитанных: 
            <span className="absolute top-1 right-1 w-2 h-2 bg-pink-400 rounded-full"></span> 
            */}
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            aria-label="Выход"
            className="flex items-center gap-2 text-cyan-100 hover:text-pink-400 transition px-2 py-1 rounded-full font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">{loading ? 'Выход...' : 'Выйти'}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}


















