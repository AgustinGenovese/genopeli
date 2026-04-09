export interface Plataforma {
  nombre: string;
  logo: string;
  provider_id?: number;
}

export interface Resultado {
  id: number;
  titulo: string;
  tipo: 'movie' | 'tv';
  poster_url: string | null;
  ranking: number;
  plataformas: Plataforma[];
}
