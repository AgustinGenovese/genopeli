import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Resultado } from '../models/result.model';

export interface SearchResponse {
  results: Resultado[];
  hasMore: boolean;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/search';

  buscar(query: string, type: string, provider: number, page: number = 1): Observable<SearchResponse> {
    const params = { query, type, provider: provider.toString(), page: page.toString() };
    return this.http.get<SearchResponse>(this.apiUrl, { params });
  }

  getDetails(type: string, id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/details/${type}/${id}`);
  }

  getVideos(type: string, id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/videos/${type}/${id}`);
  }

  getCredits(type: string, id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/credits/${type}/${id}`);
  }

  getDirectorMovies(directorName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/director/${encodeURIComponent(directorName)}`);
  }

  searchDirector(name: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/search-director?name=${encodeURIComponent(name)}`);
  }
}
