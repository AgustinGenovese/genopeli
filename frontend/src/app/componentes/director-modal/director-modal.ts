import { Component, input, output } from '@angular/core';
import { SlicePipe } from '@angular/common';

@Component({
  selector: 'app-director-modal',
  imports: [SlicePipe],
  templateUrl: './director-modal.html',
  styleUrl: './director-modal.css'
})
export class DirectorModal {
  directorNombre = input.required<string>();
  peliculas = input<any[]>([]);
  cerrar = output<void>();

  cerrarModal() {
    this.cerrar.emit();
  }

  cerrarEnFondo(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.cerrar.emit();
    }
  }
}
