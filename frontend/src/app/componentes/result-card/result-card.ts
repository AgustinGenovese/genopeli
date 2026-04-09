import { Component, input, output } from '@angular/core';
import { Resultado } from '../../models/result.model';
import { getStreamingUrl } from '../../utils/streaming-links';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.html',
  styleUrl: './result-card.css'
})
export class ResultCard {
  resultado = input.required<Resultado>();
  clicked = output<Resultado>();

  getStreamingUrl = getStreamingUrl;

  onClick() {
    this.clicked.emit(this.resultado());
  }

  getPosterUrl(): string {
    const url = this.resultado().poster_url;
    return url ? url.replace('w342', 'w185') : '';
  }
}
