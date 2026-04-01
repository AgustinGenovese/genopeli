import { Component, input } from '@angular/core';
import { Resultado } from '../../models/result.model';

@Component({
  selector: 'app-result-card',
  templateUrl: './result-card.html',
  styleUrl: './result-card.css'
})
export class ResultCard {
  resultado = input.required<Resultado>();
}
