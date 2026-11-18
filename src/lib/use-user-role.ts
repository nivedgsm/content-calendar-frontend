"use client";

import { useEffect, useState } from 'react';

export function useUserRole() {
  const [role, setRole] = useState('');
  useEffect(() => {
    try { setRole(JSON.parse(sessionStorage.getItem('cf_user') || '{}').role || ''); }
    catch { setRole(''); }
  }, []);
  return role;
}
