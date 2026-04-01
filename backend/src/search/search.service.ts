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
    const cacheKey = `${query}-${type}-${provider}-${pageNum}`;
    const cached = await this.cache.get(cacheKey);
    if (cached) return cached;

    let todosFiltrados: any[] = [];
    let currentTmdbPage = (pageNum - 1) * 5 + 1;
    const maxTmdbPage = pageNum * 25; // Límite de seguridad por cada clic de "Investigar"

    const queryLower = query.toLowerCase();

    // Bucle de INVESTIGACIÓN PROFUNDA 🕵️‍♂️
    while (todosFiltrados.length < 10 && currentTmdbPage < maxTmdbPage) {
      const pagesToFetch = [
        currentTmdbPage,
        currentTmdbPage + 1,
        currentTmdbPage + 2,
        currentTmdbPage + 3,
        currentTmdbPage + 4,
      ];

      const fetches = [];
      if (type !== 'tv') pagesToFetch.forEach((p) => fetches.push(this.tmdb.searchMovies(query, p)));
      if (type !== 'movie') pagesToFetch.forEach((p) => fetches.push(this.tmdb.searchTV(query, p)));

      const responses = await Promise.all(fetches);
      const resultsRaw = responses.flat();

      // Mapeamos tipos
      const resultsWithTypes = resultsRaw.map((r) => ({
        ...r,
        _type: (r.title ? 'movie' : 'tv') as 'movie' | 'tv',
      }));

      // Confiamos en la inteligencia de búsqueda de TMDB 🕵️‍♂️
      // Si TMDB dice que es relevante para tu búsqueda, lo procesamos.
      const matcheanTexto = resultsWithTypes;

      // Consultamos disponibilidad en Argentina en lotes para no exceder límite de TMDB
      const checkDisponibilidad = [];
      const BATCH_SIZE = 20;
      for (let i = 0; i < matcheanTexto.length; i += BATCH_SIZE) {
        const batch = matcheanTexto.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map((item) => this.buildResult(item, provider))
        );
        checkDisponibilidad.push(...batchResults);
        
        if (i + BATCH_SIZE < matcheanTexto.length) {
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      const encontradosEnEsteBloque = checkDisponibilidad.filter((r) => r !== null);

      // Evitamos duplicados por ID
      encontradosEnEsteBloque.forEach(nuevo => {
        if (!todosFiltrados.some(f => f.id === nuevo.id)) {
          todosFiltrados.push(nuevo);
        }
      });

      currentTmdbPage += 5;

      // Si no hay más resultados en TMDB (la respuesta fue vacía), rompemos el bucle
      if (resultsRaw.length === 0) break;
    }

    await this.cache.set(cacheKey, todosFiltrados);
    return todosFiltrados;
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
      plataformas: flatrate.map((p) => ({
        nombre: p.provider_name,
        logo: `${IMAGE_BASE}/w92${p.logo_path}`,
      })),
    };
  }
}
