import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    __env?: {
      API_URL?: string;
    };
  }
}

const runtimeApiUrl =
  typeof window !== 'undefined' ? window.__env?.API_URL : undefined;

export const API_BASE_URL = runtimeApiUrl || environment.apiUrl;
