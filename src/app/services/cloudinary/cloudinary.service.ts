import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

interface UploadResponse {
  success: boolean;
  data: {
    url: string;
    thumbnail?: string;
    publicId: string;
    width?: number;
    height?: number;
    type: string;
  };
}

interface SignatureResponse {
  signature: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private readonly apiUrl = 'http://localhost:3000';
  private readonly cloudName = 'dfhwoz7bq'; // Cambia esto por tu Cloud Name
  private readonly uploadPreset = 'wonder'; // Cambia esto por tu preset

  constructor(private http: HttpClient) {}

  /**
   * Sube una imagen al backend (recomendado para aplicaciones empresariales)
   */
  uploadImageViaBackend(
    file: File,
    type: 'producto' | 'categoria' | 'usuario' | 'otro' = 'otro',
  ): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.apiUrl}/uploads/image/${type}`,
      formData,
    );
  }

  /**
   * Sube un video al backend
   */
  uploadVideoViaBackend(
    file: File,
    type: string = 'otro',
  ): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<UploadResponse>(
      `${this.apiUrl}/uploads/video/${type}`,
      formData,
    );
  }

  /**
   * Sube directamente a Cloudinary desde el navegador (más rápido pero menos seguro)
   * Requiere un Upload Preset configurado en Cloudinary
   */
  uploadImageDirectly(
    file: File,
    type: 'producto' | 'categoria' | 'usuario' | 'otro' = 'otro',
  ): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('public_id', `${type}-${Date.now()}`);
    formData.append('folder', `tienda-wonder/${type}s`);

    return from(
      fetch(`https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      }),
    ).pipe(
      switchMap((response) => from(response.json())),
      map((response: any) => ({
        success: true,
        data: {
          url: response.secure_url,
          thumbnail: this.getThumbnailUrl(response.public_id),
          publicId: response.public_id,
          width: response.width,
          height: response.height,
          type,
        },
      })),
    );
  }

  /**
   * Obtiene URL optimizada de una imagen
   */
  getOptimizedUrl(
    publicId: string,
    width?: number,
    height?: number,
    crop: 'fill' | 'fit' | 'scale' = 'fill',
  ): string {
    let url = `https://res.cloudinary.com/${this.cloudName}/image/upload`;

    if (width || height) {
      url += `/w_${width || 'auto'},h_${height || 'auto'},c_${crop},q_auto,f_auto`;
    } else {
      url += `/q_auto,f_auto`;
    }

    url += `/${publicId}`;
    return url;
  }

  /**
   * Obtiene URL thumbnail
   */
  getThumbnailUrl(publicId: string, size = 200): string {
    return this.getOptimizedUrl(publicId, size, size, 'fill');
  }

  /**
   * Elimina un archivo via backend
   */
  deleteFile(publicId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/uploads/${publicId}`);
  }

  /**
   * Obtiene firma para uploads con restricciones
   */
  getSignature(): Observable<SignatureResponse> {
    return this.http.post<SignatureResponse>(`${this.apiUrl}/uploads/signature`, {});
  }

  /**
   * Valida si un archivo es imagen
   */
  isValidImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB max
  }

  /**
   * Valida si un archivo es video
   */
  isValidVideo(file: File): boolean {
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    return validTypes.includes(file.type) && file.size <= 100 * 1024 * 1024; // 100MB max
  }

  /**
   * Convierte una imagen a base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}
