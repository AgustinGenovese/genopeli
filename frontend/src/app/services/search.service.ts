import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Resultado } from '../models/result.model';

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/search';

  buscar(query: string, type: string, provider: number, page: number = 1): Observable<Resultado[]> {
    const params = { query, type, provider: provider.toString(), page: page.toString() };
    return this.http.get<Resultado[]>(this.apiUrl, { params });
  }
}
