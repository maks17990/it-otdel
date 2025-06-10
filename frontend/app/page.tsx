
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { jwtDecode } from 'jwt-decode';
import HeadingAnimated from '@/components/HeadingAnimated';
import LoginForm from '@/components/LoginForm';
import RegisterForm from '@/components/RegisterForm';
import { LogIn, UserPlus, Star } from 'lucide-react';

const API_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : '';

type JwtPayload = {
  sub: number;
  role: string;
  exp: number;
};

export default function Home() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const [adminRating, setAdminRating] = useState<string | null>(null);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    if (token) {
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded?.sub && decoded.exp * 1000 > Date.now()) {
          localStorage.setItem('userId', decoded.sub.toString());
          localStorage.setItem('role', decoded.role);

          if (
            decoded.role?.toUpperCase() === 'ADMIN' ||
            decoded.role?.toUpperCase() === 'SUPERUSER'
          ) {
            fetchAdminRating(decoded.sub, token);
          }

          router.push('/dashboard');
        }
      } catch {
        console.warn('Неверный токен, удаляю...');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
      }
    }
  }, [router]);

  const fetchAdminRating = async (adminId: number, token: string) => {
    try {
      const apiUrl =
        typeof window !== 'undefined'
          ? `${window.location.protocol}//${window.location.hostname}:3000`
          : '';

      const res = await fetch(`${apiUrl}/requests/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      const myCompleted = (data || []).filter(
        (r: any) =>
          r.executor &&
          r.executor.id === adminId &&
          r.status === 'COMPLETED' &&
          typeof r.rating === 'number'
      );

      if (!myCompleted.length) {
        setAdminRating('нет оценок');
        return;
      }

      const avg =
        myCompleted.reduce((sum: number, r: any) => sum + (r.rating ?? 0), 0) /
        myCompleted.length;

      setAdminRating(avg.toFixed(2));
    } catch {
      setAdminRating('ошибка');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-3 md:px-8 bg-gradient-to-br from-[#13151e] via-[#182232] to-[#212e43] text-white">
      <motion.div
        initial={{ opacity: 0, y: -32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mb-8 w-full max-w-2xl"
      >
        <HeadingAnimated text="Портал Отдела программного обеспечения поликлиники №16 г. Ростова-на-Дону" />
      </motion.div>

      {adminRating && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-5 flex items-center justify-center gap-2 text-lg font-semibold text-cyan-300 drop-shadow"
        >
          <Star className="w-5 h-5 text-yellow-300" />
          Ваш средний рейтинг:{' '}
          {adminRating === 'нет оценок' || adminRating === 'ошибка' ? (
            <span className="text-white/70 italic">{adminRating}</span>
          ) : (
            <span className="text-yellow-300">{adminRating} ★</span>
          )}
        </motion.div>
      )}

      <motion.div
        className="flex gap-2 mb-7 rounded-full bg-white/10 border border-cyan-200/20 backdrop-blur-xl p-2 shadow-inner"
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button
          onClick={() => setTab('login')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-base transition ${
            tab === 'login'
              ? 'bg-cyan-400 text-[#15232c] shadow-lg'
              : 'text-cyan-100 hover:bg-white/10'
          }`}
        >
          <LogIn className="w-5 h-5" /> Вход
        </button>
        <button
          onClick={() => setTab('register')}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-semibold text-base transition ${
            tab === 'register'
              ? 'bg-cyan-400 text-[#15232c] shadow-lg'
              : 'text-cyan-100 hover:bg-white/10'
          }`}
        >
          <UserPlus className="w-5 h-5" /> Регистрация
        </button>
      </motion.div>

      <motion.div
        className="bg-white/10 border border-cyan-200/10 backdrop-blur-2xl p-9 rounded-2xl shadow-2xl w-full transition-all duration-300 max-w-md"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {tab === 'login' ? <LoginForm /> : <RegisterForm />}
      </motion.div>

      <div className="text-[11px] text-cyan-100/40 mt-8 font-light text-center select-none">
        <span className="opacity-70">
          © 2025 IT-отдел. Всё анонимно. Все права защищены.
        </span>
      </div>
    </div>
  );
}

