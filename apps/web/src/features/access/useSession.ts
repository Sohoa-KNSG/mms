import { useContext } from 'react';
import { SessionContext } from './SessionContext';

export function useSession() {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession phải được dùng bên trong SessionGate.');
  }
  return value;
}

