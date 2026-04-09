import { Component, computed, inject, signal, ElementRef, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SlicePipe } from '@angular/common';
import { SearchService } from '../../services/search.service';
import { ResultCard } from '../result-card/result-card';
import { DetallesModal } from '../detalles-modal/detalles-modal';
import { DirectorModal } from '../director-modal/director-modal';
import { Resultado } from '../../models/result.model';

@Component({
  selector: 'app-search',
  imports: [FormsModule, SlicePipe, ResultCard, DetallesModal, DirectorModal],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search implements AfterViewInit, OnDestroy {
  @ViewChild('sentinel') sentinel!: ElementRef;
  
  private readonly searchService = inject(SearchService);
  private observer!: IntersectionObserver;

  query = signal('');
  type = signal('movie');
  provider = signal(0);
  resultados = signal<Resultado[]>([]);
  sortBy = signal<'relevance' | 'rating'>('relevance');
  cargando = signal(false);
  buscado = signal(false);
  pagina = signal(1);
  tieneMas = signal(true);

  detalleSeleccionado = signal<any>(null);
  videosSeleccionados = signal<any[]>([]);
  tipoSeleccionado = signal<'movie' | 'tv'>('movie');
  mostrarModal = signal(false);
  cargandoDetalle = signal(false);
  credits = signal<any>(null);

  mostrarDirectorModal = signal(false);
  directorNombre = signal('');
  directorPeliculas = signal<any[]>([]);
  cargandoDirector = signal(false);

  directorSearchResults = signal<any[]>([]);

  resultadosOrdenados = computed(() => {
    const list = [...this.resultados()];
    if (this.sortBy() === 'rating') {
      return list.sort((a, b) => b.ranking - a.ranking);
    }
    return list;
  });

  readonly plataformas = [
    { id: 0,   nombre: 'Todas las plataformas' },
    { id: 8,   nombre: 'Netflix' },
    { id: 337, nombre: 'Disney+' },
    { id: 384, nombre: 'HBO Max' },
    { id: 119, nombre: 'Amazon Prime Video' },
  ];

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !this.cargando() && this.tieneMas()) {
          this.cargarMas();
        }
      },
      { threshold: 0.1 }
    );
  }

  ngOnDestroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  ngAfterViewChecked() {
    if (this.sentinel?.nativeElement && this.observer) {
      this.observer.observe(this.sentinel.nativeElement);
    }
  }

  buscar() {
    this.pagina.set(1);
    this.tieneMas.set(true);
    this.cargando.set(true);
    this.buscado.set(true);
    this.directorSearchResults.set([]);

    if (this.type() === 'director') {
      this.searchService.searchDirector(this.query()).subscribe({
        next: (data) => {
          this.directorSearchResults.set(data);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    } else {
      this.searchService.buscar(this.query(), this.type(), this.provider(), 1).subscribe({
        next: (data) => {
          this.resultados.set(data.results);
          this.tieneMas.set(data.hasMore);
          this.cargando.set(false);
        },
        error: () => this.cargando.set(false),
      });
    }
  }

  cargarMas() {
    if (!this.tieneMas() || this.cargando()) return;
    
    this.pagina.update(p => p + 1);
    this.cargando.set(true);
    this.searchService.buscar(this.query(), this.type(), this.provider(), this.pagina()).subscribe({
      next: (data) => {
        this.resultados.update(prev => [...prev, ...data.results]);
        this.tieneMas.set(data.hasMore);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  abrirModal(resultado: Resultado) {
    this.cargandoDetalle.set(true);
    this.tipoSeleccionado.set(resultado.tipo as 'movie' | 'tv');

    this.searchService.getDetails(resultado.tipo, resultado.id).subscribe({
      next: (detalle) => {
        this.detalleSeleccionado.set(detalle);
        this.searchService.getCredits(resultado.tipo, resultado.id).subscribe({
          next: (credits) => {
            this.credits.set(credits);
          },
          error: () => {
            this.credits.set(null);
          }
        });
        this.searchService.getVideos(resultado.tipo, resultado.id).subscribe({
          next: (videos) => {
            this.videosSeleccionados.set(videos);
            this.mostrarModal.set(true);
            this.cargandoDetalle.set(false);
          },
          error: () => {
            this.videosSeleccionados.set([]);
            this.mostrarModal.set(true);
            this.cargandoDetalle.set(false);
          }
        });
      },
      error: () => {
        this.cargandoDetalle.set(false);
      }
    });
  }

  cerrarModal() {
    this.mostrarModal.set(false);
    this.detalleSeleccionado.set(null);
    this.videosSeleccionados.set([]);
    this.credits.set(null);
  }

  abrirDirectorModal(director: { name: string; id: number }) {
    this.directorNombre.set(director.name);
    this.mostrarDirectorModal.set(true);
    this.cargandoDirector.set(true);
    
    this.searchService.getDirectorMovies(director.name).subscribe({
      next: (peliculas) => {
        this.directorPeliculas.set(peliculas);
        this.cargandoDirector.set(false);
      },
      error: () => {
        this.directorPeliculas.set([]);
        this.cargandoDirector.set(false);
      }
    });
  }

  cerrarDirectorModal() {
    this.mostrarDirectorModal.set(false);
    this.directorPeliculas.set([]);
  }

  abrirPeliculaDirector(pelicula: any) {
    const resultado: Resultado = {
      id: pelicula.id,
      titulo: pelicula.titulo,
      tipo: 'movie',
      poster_url: pelicula.poster_url,
      ranking: pelicula.ranking,
      plataformas: [],
    };
    this.abrirModal(resultado);
  }
}
