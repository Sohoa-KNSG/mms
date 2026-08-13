import { apiGet, apiPost, apiPostVoid } from '../../shared/api/client';
import { navigationSchema, sessionSchema } from './contracts';

export const accessApi = {
  getSession: (signal?: AbortSignal) => apiGet('/session', sessionSchema, signal),
  getNavigation: (signal?: AbortSignal) => apiGet('/navigation', navigationSchema, signal),
  login: (userName: string, password: string) => apiPost('/auth/login', { userName, password }, sessionSchema),
  logout: () => apiPostVoid('/auth/logout'),
};
