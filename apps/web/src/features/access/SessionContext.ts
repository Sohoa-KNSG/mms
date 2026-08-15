import { createContext } from 'react';
import type { NavigationItem, Session } from './contracts';

export interface SessionContextValue {
  session: Session;
  navigation: NavigationItem[];
}

export const SessionContext = createContext<SessionContextValue | null>(null);

