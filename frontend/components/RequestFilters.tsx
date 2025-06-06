'use client';

import React from 'react';

interface RequestFiltersProps {
  filterTitle: string;
  setFilterTitle: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterDate: string;
  setFilterDate: (value: string) => void;
  filterPriority: string;
  setFilterPriority: (value: string) => void;
  filterCategory: string;
  setFilterCategory: (value: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  COMPLETED: 'Завершена',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Низкий',
  NORMAL: 'Обычный',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

export default function RequestFilters({
  filterTitle,
  setFilterTitle,
  filterStatus,
  setFilterStatus,
  filterDate,
  setFilterDate,
  filterPriority,
  setFilterPriority,
  filterCategory,
  setFilterCategory,
}: RequestFiltersProps) {
  const handleReset = () => {
    setFilterTitle('');
    setFilterStatus('');
    setFilterDate('');
    setFilterPriority('');
    setFilterCategory('');
  };

  return (
    <div className="flex flex-wrap gap-4 items-end bg-gradient-to-br from-[#18243c]/80 to-[#172e44]/70 border border-cyan-400/10 rounded-2xl p-5 shadow-lg">
      <input
        type="text"
        placeholder="Поиск по заголовку..."
        value={filterTitle}
        onChange={(e) => setFilterTitle(e.target.value)}
        className="p-3 rounded-xl bg-white/10 border border-cyan-200/20 text-white flex-1 min-w-[180px] placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition"
      />

      <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="p-3 rounded-xl bg-white/10 border border-cyan-200/20 text-white min-w-[150px] focus:outline-none focus:ring-2 focus:ring-cyan-300 transition"
      >
        <option value="">Все статусы</option>
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className="p-3 rounded-xl bg-white/10 border border-cyan-200/20 text-white focus:outline-none focus:ring-2 focus:ring-cyan-300 transition"
      />

      <select
        value={filterPriority}
        onChange={(e) => setFilterPriority(e.target.value)}
        className="p-3 rounded-xl bg-white/10 border border-cyan-200/20 text-white min-w-[150px] focus:outline-none focus:ring-2 focus:ring-cyan-300 transition"
      >
        <option value="">Все приоритеты</option>
        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Категория..."
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
        className="p-3 rounded-xl bg-white/10 border border-cyan-200/20 text-white flex-1 min-w-[140px] placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition"
      />

      <button
        onClick={handleReset}
        className="bg-gradient-to-tr from-cyan-400/90 to-teal-300/90 hover:from-cyan-300 hover:to-teal-200 text-[#101622] font-bold px-4 py-2 rounded-xl shadow transition text-sm"
        type="button"
      >
        ✖ Сбросить
      </button>
    </div>
  );
}
