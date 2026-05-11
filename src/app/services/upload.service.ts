import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    thumbnail: string;
    publicId: string;
    width: number;
    height: number;
    type: string;
  };
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/uploads`;

  async uploadImage(file: File, type: 'producto' | 'categoria' | 'usuario' | 'otro'): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return firstValueFrom(
      this.http.post<UploadResponse>(`${this.base}/image/${type}`, formData),
    );
  }
}
