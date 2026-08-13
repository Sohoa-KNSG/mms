import { apiGet } from '../../shared/api/client';
import { navigationSchema, sessionSchema } from './contracts';

export const accessApi = {
  getSession: (signal?: AbortSignal) => apiGet('/session', sessionSchema, signal),
  getNavigation: (signal?: AbortSignal) => apiGet('/navigation', navigationSchema, signal),
};

