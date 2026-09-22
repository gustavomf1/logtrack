import { Component } from '@angular/core';

@Component({
  selector: 'app-help',
  standalone: false,
  templateUrl: './help.component.html',
})
export class HelpComponent {
  readonly steps = [
    { n: '01', title: 'Organize as zonas', text: 'Cadastre as áreas do galpão e um portal para cada estação. Abra o link de ativação no Chrome do aparelho correspondente.', href: '/zonas', label: 'Gerenciar zonas' },
    { n: '02', title: 'Identifique os lotes', text: 'Cadastre um lote e grave a URL em uma etiqueta RFID pelo aparelho do supervisor. Cole a etiqueta no lote.', href: '/lotes/novo', label: 'Cadastrar lote' },
    { n: '03', title: 'Aproxime para movimentar', text: 'Com o portal ativado, aproxime a etiqueta. A página abre e registra a zona automaticamente. Aguarde a confirmação na tela.', href: '/portais', label: 'Ver estações' },
  ];
}
