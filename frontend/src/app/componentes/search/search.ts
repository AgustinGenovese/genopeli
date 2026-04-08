import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SearchService } from '../../services/search.service';
import { ResultCard } from '../result-card/result-card';
import { Resultado } from '../../models/result.model';

@Component({
  selector: 'app-search',
  imports: [FormsModule, ResultCard],
  templateUrl: './search.html',
  styleUrl: './search.css'
})
export class Search {
  private readonly searchService = inject(SearchService);

  query = signal('');
  type = signal('movie');
  provider = signal(0);
  resultados = signal<Resultado[]>([]);
  sortBy = signal<'relevance' | 'rating'>('relevance');
  cargando = signal(false);
  buscado = signal(false);
  pagina = signal(1);

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

  buscar() {
    this.pagina.set(1);
    this.cargando.set(true);
    this.buscado.set(true);
    this.searchService.buscar(this.query(), this.type(), this.provider(), 1).subscribe({
      next: (data) => {
        this.resultados.set(data);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cargarMas() {
    this.pagina.update(p => p + 1);
    this.cargando.set(true);
    this.searchService.buscar(this.query(), this.type(), this.provider(), this.pagina()).subscribe({
      next: (data) => {
        this.resultados.update(prev => [...prev, ...data]);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }
}
