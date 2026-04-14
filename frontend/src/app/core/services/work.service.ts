import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Work } from '../models/work.model';

@Injectable({ providedIn: 'root' })
export class WorkService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/works';

  getAll(): Observable<Work[]> {
    return this.http.get<Work[]>(this.baseUrl);
  }

  getBySlug(slug: string): Observable<Work> {
    return this.http.get<Work>(`${this.baseUrl}/${slug}`);
  }
}
