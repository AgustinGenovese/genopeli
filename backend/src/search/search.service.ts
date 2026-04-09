import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TmdbService } from './tmdb.service';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

@Injectable()
export class SearchService {
  constructor(
    private readonly tmdb: TmdbService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) { }

  async search(query: string, type: string, provider: number, pageNum: number = 1) {
    const cacheKey = `search-${query}-${type}-${provider}-${pageNum}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const tmdbPagesPerAppPage = 3;
    const startTmdbPage = (pageNum - 1) * tmdbPagesPerAppPage + 1;
    const seenIds = new Set<number>();
    let hasMore = false;

    if (!query) {
      const allResults: any[] = [];
      
      for (let i = 0; i < tmdbPagesPerAppPage; i++) {
        const tmdbPage = startTmdbPage + i;
        const resultsRaw = await this.tmdb.discover(type as 'movie' | 'tv', provider, tmdbPage);
        
        if (resultsRaw.length === 0) {
          if (i === 0) break;
          hasMore = false;
          break;
        }

        if (i === tmdbPagesPerAppPage - 1 && resultsRaw.length >= 20) {
          hasMore = true;
        }

        const withTypes = resultsRaw.map((r) => ({ ...r, _type: type as 'movie' | 'tv' }));
        
        const batchResults = await Promise.all(
          withTypes.map((item) => this.buildResult(item, provider))
        );

        batchResults.forEach(r => {
          if (r && !seenIds.has(r.id)) {
            seenIds.add(r.id);
            allResults.push(r);
          }
        });
      }

      const result = { results: allResults, hasMore };
      await this.cache.set(cacheKey, result, 300000);
      return result;
    }

    const allResults: any[] = [];

    for (let i = 0; i < tmdbPagesPerAppPage; i++) {
      const tmdbPage = startTmdbPage + i;
      const fetches = [];
      
      if (type !== 'tv') fetches.push(this.tmdb.searchMovies(query, tmdbPage));
      if (type !== 'movie') fetches.push(this.tmdb.searchTV(query, tmdbPage));

      const responses = await Promise.all(fetches);
      const resultsRaw = responses.flat();

      if (resultsRaw.length === 0) {
        if (i === 0) break;
        hasMore = false;
        break;
      }

      if (i === tmdbPagesPerAppPage - 1 && resultsRaw.length >= 20) {
        hasMore = true;
      }

      const withTypes = resultsRaw.map((r) => ({
        ...r,
        _type: (r.title ? 'movie' : 'tv') as 'movie' | 'tv',
      }));

      const batchResults = await Promise.all(
        withTypes.map((item) => this.buildResult(item, provider))
      );

      batchResults.forEach(r => {
        if (r && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          allResults.push(r);
        }
      });
    }

    const result = { results: allResults, hasMore };
    await this.cache.set(cacheKey, result, 300000);
    return result;
  }



  async getDetails(id: number, type: 'movie' | 'tv') {
    const cacheKey = `details-${type}-${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const details = await this.tmdb.getDetails(id, type);
    const providers = await this.tmdb.getWatchProviders(id, type);

    const result = {
      ...details,
      plataformas: providers?.flatrate?.map((p: any) => ({
        nombre: p.provider_name,
        logo: `${IMAGE_BASE}/w92${p.logo_path}`,
        provider_id: p.provider_id,
      })) ?? [],
    };

    await this.cache.set(cacheKey, result, 3600000);
    return result;
  }

  async getVideos(id: number, type: 'movie' | 'tv') {
    const cacheKey = `videos-${type}-${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const videos = await this.tmdb.getVideos(id, type);
    await this.cache.set(cacheKey, videos, 3600000);
    return videos;
  }

  async getCredits(id: number, type: 'movie' | 'tv') {
    const cacheKey = `credits-${type}-${id}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const credits = await this.tmdb.getCredits(id, type);
    const directors = credits.crew
      ?.filter((c: any) => c.job === 'Director')
      ?.map((d: any) => ({ name: d.name, id: d.id })) ?? [];
    
    const cast = credits.cast
      ?.slice(0, 10)
      ?.map((c: any) => ({
        name: c.name,
        character: c.character,
        profile_url: c.profile_path ? `${IMAGE_BASE}/w92${c.profile_path}` : null,
      })) ?? [];

    const result = { directors, cast };
    await this.cache.set(cacheKey, result, 3600000);
    return result;
  }

  async getDirectorMovies(directorName: string) {
    const cacheKey = `director-${directorName}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const persons = await this.tmdb.searchPerson(directorName);
    if (persons.length === 0) return [];

    const personId = persons[0].id;
    const movieCredits = await this.tmdb.getPersonMovieCredits(personId);
    
    const movies = movieCredits.crew
      ?.filter((c: any) => c.job === 'Director')
      ?.sort((a: any, b: any) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
      ?.slice(0, 20)
      ?.map((m: any) => ({
        id: m.id,
        titulo: m.title,
        poster_url: m.poster_path ? `${IMAGE_BASE}/w185${m.poster_path}` : null,
        ranking: m.vote_average,
        fecha: m.release_date,
        director_id: personId,
      })) ?? [];

    await this.cache.set(cacheKey, movies, 3600000);
    return movies;
  }

  async searchDirector(directorName: string) {
    const cacheKey = `search-director-${directorName}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    const persons = await this.tmdb.searchPerson(directorName);
    if (persons.length === 0) return [];

    const directors = persons.filter((p: any) => 
      p.known_for_department === 'Directing' || 
      p.popularity > 5
    ).slice(0, 5);

    const result = await Promise.all(
      directors.map(async (person: any) => {
        const movieCredits = await this.tmdb.getPersonMovieCredits(person.id);
        const movies = movieCredits.crew
          ?.filter((c: any) => c.job === 'Director')
          ?.sort((a: any, b: any) => (b.vote_average ?? 0) - (a.vote_average ?? 0))
          ?.slice(0, 10)
          ?.map((m: any) => ({
            id: m.id,
            titulo: m.title,
            poster_url: m.poster_path ? `${IMAGE_BASE}/w185${m.poster_path}` : null,
            ranking: m.vote_average,
            fecha: m.release_date,
          })) ?? [];

        return {
          person: {
            id: person.id,
            name: person.name,
            profile_url: person.profile_path ? `${IMAGE_BASE}/w185${person.profile_path}` : null,
          },
          movies,
          movieCount: movies.length,
        };
      })
    );

    await this.cache.set(cacheKey, result, 300000);
    return result;
  }

  private async buildResult(item: any, provider: number) {
    const proveedoresAR = await this.tmdb.getWatchProviders(item.id, item._type);

    if (!proveedoresAR) return null;

    const flatrate: any[] = proveedoresAR.flatrate ?? [];

    if (flatrate.length === 0) return null;

    if (provider !== 0 && !flatrate.some((p) => p.provider_id === provider)) return null;

    return {
      id: item.id,
      titulo: item.title ?? item.name,
      tipo: item._type,
      poster_url: item.poster_path ? `${IMAGE_BASE}/w342${item.poster_path}` : null,
      ranking: item.vote_average,
      plataformas: flatrate.map((p) => ({
        nombre: p.provider_name,
        logo: `${IMAGE_BASE}/w92${p.logo_path}`,
        provider_id: p.provider_id,
      })),
    };
  }
}
