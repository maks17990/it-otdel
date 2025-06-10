'use client';

import { useEffect, useState } from 'react';
const API_URL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:3000` : '';







export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    setRole(storedRole);
  }, []);

  const isAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

  return { role, isAdmin };
}


















