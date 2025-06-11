"use client";

import { useEffect, useState } from "react";
import AdminNavbar from "@/components/AdminNavbar";
import { BarChart2, RefreshCw, FileDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart as RBarChart, Bar } from "recharts";
import { CSVLink } from "react-csv";
import { motion } from "framer-motion";

interface DailyStats {
  date: string;
  newRequests: number;
  closedRequests: number;
  newUsers: number;
}

interface Activity {
  date: string;
  count: number;
}

interface FaultItem {
  name: string;
  count: number;
}

export default function AdminReportsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [faults, setFaults] = useState<FaultItem[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setLoading(true);
    try {
      const [dRes, aRes, fRes] = await Promise.all([
        fetch(`${API_URL}/admin/stats/daily?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/stats/users-activity?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/admin/stats/equipment-faults?days=${days}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [dData, aData, fData] = await Promise.all([dRes.json(), aRes.json(), fRes.json()]);
      setDaily(Array.isArray(dData) ? dData : []);
      setActivity(Array.isArray(aData) ? aData : []);
      setFaults(Array.isArray(fData) ? fData : []);
    } catch (err) {
      console.error("Ошибка загрузки отчётов", err);
      setDaily([]);
      setActivity([]);
      setFaults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [days]);

  const csvData = daily.map(d => ({
    date: d.date,
    newRequests: d.newRequests,
    closedRequests: d.closedRequests,
    newUsers: d.newUsers,
    activeUsers: activity.find(a => a.date === d.date)?.count || 0
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#13151e] via-[#182232] to-[#212e43] text-white pt-20 px-3 md:px-10 py-10">
      <AdminNavbar />
      <div className="max-w-5xl mx-auto space-y-8 mt-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3">
            <BarChart2 className="w-8 h-8 text-cyan-400" /> Отчёты
          </h1>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 1)}
              className="w-24 px-3 py-2 rounded-xl bg-white/10 border border-cyan-400/20 focus:ring-2 focus:ring-cyan-400/60"
            />
            <button onClick={fetchData} className="bg-cyan-500 hover:bg-cyan-400 transition px-4 py-2 rounded-xl flex items-center gap-1">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <CSVLink
              data={csvData}
              filename="reports.csv"
              className="flex items-center gap-2 bg-cyan-400/10 hover:bg-cyan-400/20 border border-cyan-300/10 text-cyan-100 px-4 py-2 rounded-xl"
            >
              <FileDown className="w-5 h-5" /> Экспорт
            </CSVLink>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border border-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Динамика заявок</h2>
          {daily.length === 0 ? (
            <div className="text-white/60">Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={daily}>
                <XAxis dataKey="date" stroke="#a5b4fc" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="newRequests" name="Новые" stroke="#60a5fa" strokeWidth={2} />
                <Line type="monotone" dataKey="closedRequests" name="Завершённые" stroke="#4ade80" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border border-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Новые пользователи</h2>
          {daily.length === 0 ? (
            <div className="text-white/60">Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RBarChart data={daily}>
                <XAxis dataKey="date" stroke="#a5b4fc" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="newUsers" name="Пользователи" fill="#a78bfa" />
              </RBarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border border-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Активность пользователей</h2>
          {activity.length === 0 ? (
            <div className="text-white/60">Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={activity}>
                <XAxis dataKey="date" stroke="#a5b4fc" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" name="Активные" stroke="#f472b6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/10 border border-white/15 backdrop-blur-2xl rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-4">Топ оборудования по обращениям</h2>
          {faults.length === 0 ? (
            <div className="text-white/60">Нет данных</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <RBarChart data={faults} layout="vertical">
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" stroke="#a5b4fc" width={150} />
                <Tooltip />
                <Bar dataKey="count" name="Обращений" fill="#facc15" />
              </RBarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
}
