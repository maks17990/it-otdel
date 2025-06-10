
'use client';

import { useEffect, useState } from 'react';
import AdminNavbar from '@/components/AdminNavbar';
import UserFormModal from '@/components/UserFormModal';
import UserDetailsCard from '@/components/UserDetailsCard';
import EquipmentDetailsCard from '@/components/EquipmentDetailsCard';
import { User, UserDetails } from '@/types/user';
import { EquipmentDetails } from '@/types/equipment';
import { motion } from 'framer-motion';

const API_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : '';

interface UserForm {
  lastName: string;
  firstName: string;
  middleName: string;
  department: string;
  position: string;
  role: string;
  mobilePhone: string;
  internalPhone: string;
  floor: string;
  cabinet: string;
  password?: string;
  snils: string;
  birthDate: string;
  telegramUserId?: string;
}

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const emptyUser: UserForm = {
  lastName: '',
  firstName: '',
  middleName: '',
  department: '',
  position: '',
  role: 'user',
  mobilePhone: '',
  internalPhone: '',
  floor: '',
  cabinet: '',
  snils: '',
  birthDate: '',
  telegramUserId: '',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<number | null>(null);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [equipmentDetails, setEquipmentDetails] = useState<EquipmentDetails | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUser);

  const resetForm = () => setForm(emptyUser);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users`, { headers: getHeaders() });
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки пользователей:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/users/details/${id}`, { headers: getHeaders() });
      const data = await res.json();
      setDetails(data);
      setEquipmentDetails(null);
    } catch (err) {
      console.error('Ошибка загрузки подробностей:', err);
    }
  };

  const handleEquipmentClick = async (equipmentId: number) => {
    try {
      const res = await fetch(`${API_URL}/equipment/${equipmentId}`, { headers: getHeaders() });
      const data = await res.json();
      setEquipmentDetails(data);
    } catch (err) {
      console.error('Ошибка загрузки оборудования:', err);
    }
  };

  const handleEditById = async (id: number) => {
    try {
      const res = await fetch(`${API_URL}/users/details/${id}`, { headers: getHeaders() });
      const user = await res.json();

      setForm({
        lastName: user.lastName ?? '',
        firstName: user.firstName ?? '',
        middleName: user.middleName ?? '',
        department: user.department ?? '',
        position: user.position ?? '',
        role: user.role ?? 'user',
        mobilePhone: user.mobilePhone ?? '',
        internalPhone:
          typeof user.internalPhone === 'string'
            ? user.internalPhone
            : user.internalPhone !== undefined && user.internalPhone !== null
            ? String(user.internalPhone)
            : '',
        floor: user.floor ?? '',
        cabinet: user.cabinet ?? '',
        snils: user.snils ?? '',
        birthDate: user.birthDate ? user.birthDate.slice(0, 10) : '',
        telegramUserId: user.telegramUserId ?? '',
        password: '',
      });

      setEditUserId(user.id);
      setIsModalOpen(true);
    } catch (err) {
      console.error('Ошибка при загрузке пользователя:', err);
    }
  };

  const handleUpdate = async (data: UserForm) => {
    const isEdit = !!editUserId;
    const url = isEdit ? `${API_URL}/users/${editUserId}` : `${API_URL}/users`;
    const method = isEdit ? 'PUT' : 'POST';

    const body: any = { ...data, internalPhone: data.internalPhone === '' ? null : data.internalPhone };
    if (isEdit && !body.password) delete body.password;

    try {
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchUsers();
        resetForm();
        setIsModalOpen(false);
        setEditUserId(null);
      } else {
        alert('Ошибка при сохранении пользователя');
      }
    } catch (err) {
      alert('Ошибка сети при сохранении');
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Вы уверены, что хотите удалить пользователя?')) return;
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      if (res.ok) {
        await fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(`Ошибка при удалении: ${errData.message || res.statusText}`);
      }
    } catch (err) {
      console.error('Ошибка при удалении:', err);
      alert('Ошибка сети при удалении');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13151e] via-[#182232] to-[#212e43] text-white pt-20 px-3 md:px-10 py-10 space-y-10">
      <AdminNavbar />

      {!API_URL && (
        <div className="p-4 mb-4 bg-pink-500/20 text-pink-300 rounded-2xl font-bold">
          Ошибка конфигурации: переменная окружения <b>NEXT_PUBLIC_API_URL</b> не задана!
        </div>
      )}

      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4 mt-10">
        <h1 className="text-3xl md:text-4xl font-bold text-cyan-200">
          👤 Пользователи системы
        </h1>
        <button
          onClick={() => {
            resetForm();
            setEditUserId(null);
            setIsModalOpen(true);
          }}
          className="px-6 py-3 bg-cyan-400 hover:bg-cyan-300 text-[#191b25] font-bold rounded-2xl shadow-xl border border-cyan-200/40 transition-all"
        >
          ➕ Добавить пользователя
        </button>
      </div>

      {details && (
        <UserDetailsCard
          details={details}
          onEquipmentClick={handleEquipmentClick}
          onClose={() => setDetails(null)}
        />
      )}

      {equipmentDetails && <EquipmentDetailsCard details={equipmentDetails} />}

      <motion.div
        className="overflow-x-auto rounded-2xl border border-cyan-400/10 bg-white/5 shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <table className="min-w-full text-sm text-left text-white/90">
          <thead className="bg-cyan-900/60 text-cyan-100/70">
            <tr>
              <th className="px-4 py-3">ФИО</th>
              <th className="px-4 py-3">Отдел</th>
              <th className="px-4 py-3">Должность</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3 text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/50">
                  Загрузка пользователей...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-white/50">
                  Нет пользователей
                </td>
              </tr>
            ) : (
              users.map((u, idx) => (
                <motion.tr
                  key={u.id ?? idx}
                  className="border-t border-cyan-400/10 hover:bg-cyan-800/10 transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                >
                  <td
                    className="px-4 py-2 cursor-pointer text-cyan-300 hover:underline"
                    onClick={() => viewDetails(u.id)}
                  >
                    {u.lastName} {u.firstName} {u.middleName}
                  </td>
                  <td className="px-4 py-2">{u.department}</td>
                  <td className="px-4 py-2">{u.position}</td>
                  <td className="px-4 py-2">{u.role}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button
                      onClick={() => handleEditById(u.id)}
                      className="text-cyan-400 hover:text-cyan-200 text-sm font-bold px-3 py-1 rounded-xl border border-cyan-300/20"
                    >
                      Редактировать
                    </button>
                    <button
                      onClick={() => deleteUser(u.id)}
                      className="text-pink-400 hover:text-pink-300 text-sm font-bold px-3 py-1 rounded-xl border border-pink-300/20"
                    >
                      Удалить
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      <UserFormModal
        user={{ ...form }}
        onUpdate={handleUpdate}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditUserId(null);
          resetForm();
        }}
        showPasswordField={!editUserId}
        showTitle={true}
        isEdit={!!editUserId}
      />
    </div>
  );
}


