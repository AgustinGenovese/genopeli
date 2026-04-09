import { Component, inject, input, output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { getStreamingUrl } from '../../utils/streaming-links';

@Component({
  selector: 'app-detalles-modal',
  templateUrl: './detalles-modal.html',
  styleUrl: './detalles-modal.css'
})
export class DetallesModal {
  private readonly sanitizer = inject(DomSanitizer);
  
  detalle = input.required<any>();
  videos = input<any[]>([]);
  tipo = input.required<'movie' | 'tv'>();
  credits = input<any>(null);
  cerrar = output<void>();
  directorClick = output<{ name: string; id: number }>();

  getStreamingUrl = getStreamingUrl;

  cerrarModal() {
    this.cerrar.emit();
  }

  cerrarEnFondo(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.cerrar.emit();
    }
  }

  onDirectorClick(director: { name: string; id: number }) {
    this.directorClick.emit(director);
  }

  get trailerUrl(): SafeResourceUrl | null {
    const trailer = this.videos().find(v => v.type === 'Trailer');
    if (!trailer) return null;
    const url = `https://www.youtube.com/embed/${trailer.key}?autoplay=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  get generos(): string {
    return this.detalle().genres?.map((g: any) => g.name).join(', ') ?? '';
  }

  get fecha(): string {
    const date = this.detalle().release_date ?? this.detalle().first_air_date;
    return date ? new Date(date).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  }

  get duracion(): string {
    if (this.tipo() === 'movie') {
      const runtime = this.detalle().runtime;
      return runtime ? `${runtime} min` : '';
    }
    const seasons = this.detalle().number_of_seasons;
    const episodes = this.detalle().number_of_episodes;
    if (seasons && episodes) {
      return `${seasons} temporada${seasons > 1 ? 's' : ''}, ${episodes} episodio${episodes > 1 ? 's' : ''}`;
    }
    return '';
  }

  get backdropUrl(): string {
    const path = this.detalle().backdrop_path;
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }

  get posterUrl(): string {
    const path = this.detalle().poster_path;
    return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
  }

  get esSerie(): boolean {
    return this.tipo() === 'tv';
  }

  get directors(): { name: string; id: number }[] {
    return this.credits()?.directors ?? [];
  }

  get cast(): any[] {
    return this.credits()?.cast ?? [];
  }

  getDirectorsText(): string {
    return this.directors.map(d => d.name).join(', ');
  }
}
