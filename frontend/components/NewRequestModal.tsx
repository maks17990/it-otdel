'use client';

import React, { useEffect, useState, ChangeEvent } from 'react';
import { PRIORITY_LABELS } from '../utils/constants';
import UserSelectCard from './UserSelectCard';
import io from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

const apiBase = typeof window !== 'undefined'
  ? `${window.location.protocol}//${window.location.hostname}:3000`
  : '';
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/^http/, 'ws') ?? '';

interface NewRequestModalProps {
  onClose: () => void;
  onCreated?: () => void;
  initialState?: {
    title?: string;
    content?: string;
    priority?: string;
    category?: string;
    fileUrls?: string[];
    expectedResolutionDate?: string;
  };
}

interface DecodedTokenPayload {
  sub: number;
  role: string;
}

interface UserInfo {
  id: number;
  firstName: string;
  lastName: string;
  middleName?: string;
}

function decodeJwtPayload(token: string): DecodedTokenPayload {
  const base64 = token.split('.')[1]
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(token.split('.')[1].length / 4) * 4, '=');
  return JSON.parse(atob(base64));
}

export default function NewRequestModal({ onClose, onCreated, initialState }: NewRequestModalProps) {
  const [form, setForm] = useState({
    title: initialState?.title || '',
    content: initialState?.content || '',
    priority: initialState?.priority || 'NORMAL',
    category: initialState?.category || '',
    expectedResolutionDate: initialState?.expectedResolutionDate || '',
    files: [] as File[],
    userId: undefined as number | undefined,
  });

  const [selectedUserInfo, setSelectedUserInfo] = useState<UserInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<DecodedTokenPayload | null>(null);
  const socket = io(SOCKET_URL, { autoConnect: false });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = decodeJwtPayload(token);
      setCurrentUser(payload);
    } catch (err) {
      console.error('Ошибка при разборе токена:', err);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (form.userId !== undefined && token) {
      fetch(`${apiBase}/users/details/${form.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => setSelectedUserInfo(data))
        .catch(() => setSelectedUserInfo(null));
    } else {
      setSelectedUserInfo(null);
    }
  }, [form.userId]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setForm({ ...form, files: Array.from(e.target.files) });
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Нет токена авторизации');
      return;
    }

    if (!form.title || !form.content) {
      setError('Заполните обязательные поля');
      return;
    }

    if (form.expectedResolutionDate && new Date(form.expectedResolutionDate) < new Date()) {
      setError('Дата выполнения не может быть в прошлом');
      return;
    }

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('content', form.content);
    formData.append('priority', form.priority);
    formData.append('category', form.category);
    formData.append('expectedResolutionDate', form.expectedResolutionDate);

    const isAdmin = ['ADMIN', 'SUPERUSER'].includes(currentUser?.role?.toUpperCase() || '');

    if (isAdmin) {
      if (typeof form.userId !== 'number' || isNaN(form.userId)) {
        setError('Пожалуйста, выберите автора заявки');
        return;
      }
      formData.append('userId', String(form.userId));
      formData.append('source', 'PHONE');
    } else {
      formData.append('source', 'WEB');
    }

    form.files.forEach(file => formData.append('files', file));

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiBase}/requests`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Ошибка при создании заявки');
      }

      socket.connect();
      socket.emit('new-request', {
        title: form.title,
        userId: isAdmin ? form.userId : currentUser?.sub,
      });

      onCreated?.();
      setForm({
        title: '',
        content: '',
        priority: 'NORMAL',
        category: '',
        expectedResolutionDate: '',
        files: [],
        userId: undefined,
      });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      socket.disconnect();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" onClick={onClose} />
        <motion.div
          initial={{ scale: 0.97, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.97, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.15, duration: 0.33 }}
          className="relative z-10 bg-gradient-to-br from-[#172a42]/95 to-[#243b58]/90 border border-cyan-300/15 p-8 w-full max-w-xl rounded-2xl shadow-2xl text-white space-y-6"
          onClick={e => e.stopPropagation()}
          tabIndex={0}
        >
          <h2 className="text-2xl font-bold text-center mb-2 text-cyan-200">📝 Новая заявка</h2>

          {currentUser && (
            <p className="text-xs text-cyan-300 text-center mb-2">
              Ваша роль: <span className="font-bold">{currentUser.role}</span>
            </p>
          )}

          {currentUser && ['ADMIN', 'SUPERUSER'].includes(currentUser.role.toUpperCase()) && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-cyan-200">Автор заявки *</label>
              <UserSelectCard
                value={form.userId}
                onChange={(userId: number | undefined) => setForm({ ...form, userId })}
                filterRole="user"
              />
              {selectedUserInfo && (
                <p className="text-sm text-cyan-200">
                  🧾 <span className="font-semibold">Выбран:</span> {selectedUserInfo.lastName} {selectedUserInfo.firstName} {selectedUserInfo.middleName ?? ''}
                </p>
              )}
            </div>
          )}

          <FormField label="Заголовок *" value={form.title} required onChange={val => setForm({ ...form, title: val })} />
          <TextareaField label="Описание *" value={form.content} required onChange={val => setForm({ ...form, content: val })} />
          <SelectField label="Приоритет" value={form.priority} options={PRIORITY_LABELS} onChange={val => setForm({ ...form, priority: val })} />
          <FormField label="Категория" value={form.category} onChange={val => setForm({ ...form, category: val })} />
          <FormField label="Ожидаемая дата выполнения" type="date" value={form.expectedResolutionDate} onChange={val => setForm({ ...form, expectedResolutionDate: val })} />

          <div>
            <label className="text-sm font-medium text-cyan-200">📎 Прикрепить файлы</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="w-full mt-1 text-sm file:bg-cyan-400/20 file:border-0 file:px-4 file:py-2 file:rounded-xl file:text-cyan-200 bg-white/10 border border-cyan-200/10 rounded-xl text-white"
              disabled={loading}
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-pink-600/80 to-pink-400/90 px-4 py-2 rounded-xl text-white text-sm text-center shadow"
            >
              {error}
            </motion.p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button type="button" variant="accent" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Отправка...' : 'Создать'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Универсальные компоненты полей:
function FormField({
  label,
  value,
  onChange,
  required = false,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
}) {
  const isDisabled = type === 'date' && typeof value === 'string' && value !== '' && value < new Date().toISOString().slice(0, 10);

  return (
    <div>
      <label className="text-sm font-medium text-cyan-200">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 mt-1 rounded-xl bg-white/10 border border-cyan-200/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
        disabled={isDisabled}
      />
    </div>
  );
}

function TextareaField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-cyan-200">{label}</label>
      <textarea
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 mt-1 rounded-xl bg-white/10 border border-cyan-200/10 text-white placeholder-white/60 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-cyan-200">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 mt-1 rounded-xl bg-white/10 border border-cyan-200/10 text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
      >
        {Object.entries(options).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
