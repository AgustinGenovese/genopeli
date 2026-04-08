import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class TmdbService {
  private readonly baseUrl = 'https://api.themoviedb.org/3';
  private readonly token: string;

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.token = this.config.get<string>('TMDB_TOKEN');
  }

  private get headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  async searchMovies(query: string, page: number = 1): Promise<any[]> {
    const url = `${this.baseUrl}/search/movie?query=${encodeURIComponent(query)}&page=${page}&language=es-AR`;
    const response = await lastValueFrom(this.http.get(url, { headers: this.headers }));
    return response.data.results ?? [];
  }

  async searchTV(query: string, page: number = 1): Promise<any[]> {
    const url = `${this.baseUrl}/search/tv?query=${encodeURIComponent(query)}&page=${page}&language=es-AR`;
    const response = await lastValueFrom(this.http.get(url, { headers: this.headers }));
    return response.data.results ?? [];
  }

  async getWatchProviders(id: number, type: 'movie' | 'tv'): Promise<any> {
    const url = `${this.baseUrl}/${type}/${id}/watch/providers`;
    const response = await lastValueFrom(this.http.get(url, { headers: this.headers }));
    return response.data.results?.AR ?? null;
  }

  async discover(type: 'movie' | 'tv', providerId?: number, page: number = 1): Promise<any[]> {
    let url = `${this.baseUrl}/discover/${type}?page=${page}&language=es-AR&watch_region=AR&sort_by=vote_average.desc&vote_count.gte=100`;
    if (providerId && providerId !== 0) {
      url += `&with_watch_providers=${providerId}`;
    }
    const response = await lastValueFrom(this.http.get(url, { headers: this.headers }));
    return response.data.results ?? [];
  }
}
