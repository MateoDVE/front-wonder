import { Injectable, signal } from '@angular/core';
import { API_BASE_URL } from '../core/config/api-url';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly STORAGE_KEY = 'wonder_user_id';

  readonly userId = signal<string | null>(null);

  constructor() {
    this.initUser();
  }

  private async initUser(): Promise<void> {
    if (typeof localStorage === 'undefined') return;

    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      // Verificar que el ID sigue existiendo en la BD
      const existe = await this.verificarUsuario(stored);
      if (existe) {
        this.userId.set(stored);
        return;
      }
      localStorage.removeItem(this.STORAGE_KEY);
    }

    await this.createGuestUser();
  }

  private async verificarUsuario(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/${id}/existe`);
      const data = await res.json();
      return data.existe === true;
    } catch {
      return false;
    }
  }

  private async createGuestUser(): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    try {
      const res = await fetch(`${API_BASE_URL}/usuarios/invitado`, {
        method: 'POST',
      });
      const data = await res.json();
      localStorage.setItem(this.STORAGE_KEY, data.id);
      this.userId.set(data.id);
    } catch (err) {
      console.error('[UserService] No se pudo crear usuario invitado:', err);
    }
  }

  setUserId(id: string | number): void {
    const idString = typeof id === 'string' ? id : id.toString();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, idString);
    }
    this.userId.set(idString);
  }

  clearUser(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.userId.set(null);
    this.createGuestUser();
  }
}
