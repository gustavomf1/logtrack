import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, computed, signal } from '@angular/core';
import Konva from 'konva';
import { ApiService } from '../../../../core/services/api.service';
import type { DashboardData } from '../../../../core/models/types';
import type { MapaData, MapaEstacao, MapaTexto, MapaZona } from '../../../../core/models/mapa';

const STAGE_W = 900;
const STAGE_H = 600;

/**
 * Equivalente ao ConfigView em React (react-konva): mesma biblioteca Konva, usada aqui
 * diretamente (Angular não tem um binding oficial), desenhando no mesmo <canvas>.
 */
@Component({
  selector: 'app-config-view',
  standalone: false,
  templateUrl: './config-view.component.html',
})
export class ConfigViewComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) mapaData!: MapaData;
  @Input({ required: true }) data!: DashboardData;
  @Output() saved = new EventEmitter<void>();
  @ViewChild('stageContainer', { static: true }) stageContainer!: ElementRef<HTMLDivElement>;

  readonly estacoes = signal<MapaEstacao[]>([]);
  readonly textos = signal<MapaTexto[]>([]);
  readonly zonasMapa = signal<MapaZona[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');

  readonly loteCounts = computed(() => new Map(this.data.zonas.map(z => [z.id, this.data.lotes.filter(l => !l.arquivado && l.zonaAtualId === z.id).length])));
  readonly unplaced = computed(() => { const placed = new Set(this.estacoes().map(e => e.portalId)); return this.data.portais.filter(c => !placed.has(c.id)); });
  readonly unplacedZonas = computed(() => { const placed = new Set(this.zonasMapa().map(z => z.zonaId)); return this.data.zonas.filter(z => !placed.has(z.id)); });

  private stage!: Konva.Stage;
  private layer!: Konva.Layer;
  private image: HTMLImageElement | null = null;

  constructor(private readonly api: ApiService) {}

  ngAfterViewInit() {
    this.estacoes.set(this.mapaData.estacoes);
    this.textos.set(this.mapaData.textos);
    this.zonasMapa.set(this.mapaData.zonas);

    this.stage = new Konva.Stage({ container: this.stageContainer.nativeElement, width: STAGE_W, height: STAGE_H });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    if (this.mapaData.imagemUrl) {
      const img = new Image();
      img.onload = () => { this.image = img; this.redraw(); };
      img.src = this.mapaData.imagemUrl;
    }
    this.redraw();
  }

  ngOnDestroy() { this.stage?.destroy(); }

  private redraw() {
    this.layer.destroyChildren();

    if (this.image) this.layer.add(new Konva.Image({ image: this.image, width: STAGE_W, height: STAGE_H }));

    for (const e of this.estacoes()) {
      const group = new Konva.Group({ x: e.x * STAGE_W, y: e.y * STAGE_H, draggable: true });
      group.on('dragend', () => this.moveEstacao(e.portalId, group.x() / STAGE_W, group.y() / STAGE_H));
      group.add(new Konva.Circle({ radius: 15, fill: '#1f2733', stroke: '#2c3546' }));
      const label = new Konva.Label({ x: -50, y: 12, width: 100, align: 'center' });
      label.add(new Konva.Tag({ fill: 'rgba(14,18,24,0.8)', cornerRadius: 3 }));
      label.add(new Konva.Text({ text: e.apelido || e.portalNome, fontSize: 10, fill: '#e8ebf2', padding: 3, align: 'center', width: 100 }));
      group.add(label);
      this.layer.add(group);
    }

    for (const t of this.textos()) {
      const label = new Konva.Label({ x: t.x * STAGE_W, y: t.y * STAGE_H, draggable: true });
      label.on('dragend', () => this.moveTexto(t.id, label.x() / STAGE_W, label.y() / STAGE_H));
      label.add(new Konva.Tag({ fill: 'rgba(14,18,24,0.8)', cornerRadius: 4 }));
      label.add(new Konva.Text({ text: t.texto, fontSize: 11, fill: '#e8ebf2', padding: 5 }));
      this.layer.add(label);
    }

    for (const z of this.zonasMapa()) {
      const group = new Konva.Group({ x: z.x * STAGE_W, y: z.y * STAGE_H, draggable: true });
      group.on('dragend', () => this.moveZona(z.zonaId, group.x() / STAGE_W, group.y() / STAGE_H));
      group.add(new Konva.Rect({ x: -60, y: -24, width: 120, height: 48, fill: 'rgba(22,27,35,0.9)', stroke: '#2c3546', cornerRadius: 6 }));
      group.add(new Konva.Text({ text: z.zonaNome.toUpperCase(), fontSize: 8, fill: '#8b96ab', x: -52, y: -17, width: 104 }));
      group.add(new Konva.Text({ text: String(this.loteCounts().get(z.zonaId) ?? 0) + ' lotes', fontSize: 15, fill: '#e8ebf2', x: -52, y: -4, width: 104 }));
      this.layer.add(group);
    }

    this.layer.draw();
  }

  addEstacao(portalId: string) {
    const portal = this.data.portais.find(c => c.id === portalId)!;
    const zona = this.data.zonas.find(z => z.id === portal.zonaId);
    this.estacoes.update(prev => [...prev, { id: 'novo-' + portalId, portalId, portalNome: portal.nome, zonaId: portal.zonaId, zonaNome: zona?.nome || '', apelido: null, x: 0.5, y: 0.5 }]);
    this.redraw();
  }
  private moveEstacao(portalId: string, x: number, y: number) {
    this.estacoes.update(prev => prev.map(e => (e.portalId === portalId ? { ...e, x, y } : e)));
  }
  renameEstacao(portalId: string, apelido: string) {
    this.estacoes.update(prev => prev.map(e => (e.portalId === portalId ? { ...e, apelido: apelido || null } : e)));
    this.redraw();
  }

  addTexto() {
    this.textos.update(prev => [...prev, { id: 'novo-' + Date.now(), texto: 'Novo texto', x: 0.5, y: 0.5 }]);
    this.redraw();
  }
  private moveTexto(id: string, x: number, y: number) {
    this.textos.update(prev => prev.map(t => (t.id === id ? { ...t, x, y } : t)));
  }
  renameTexto(id: string, texto: string) {
    this.textos.update(prev => prev.map(t => (t.id === id ? { ...t, texto } : t)));
    this.redraw();
  }

  addZona(zonaId: string) {
    const zona = this.data.zonas.find(z => z.id === zonaId)!;
    this.zonasMapa.update(prev => [...prev, { id: 'novo-' + zonaId, zonaId, zonaNome: zona.nome, x: 0.5, y: 0.5 }]);
    this.redraw();
  }
  private moveZona(zonaId: string, x: number, y: number) {
    this.zonasMapa.update(prev => prev.map(z => (z.zonaId === zonaId ? { ...z, x, y } : z)));
  }

  async save() {
    this.busy.set(true); this.error.set('');
    try {
      const body = {
        estacoes: this.estacoes().map(e => ({ portalId: e.portalId, apelido: e.apelido, x: e.x, y: e.y })),
        textos: this.textos().map(t => ({ id: t.id.startsWith('novo-') ? undefined : t.id, texto: t.texto, x: t.x, y: t.y })),
        zonas: this.zonasMapa().map(z => ({ zonaId: z.zonaId, x: z.x, y: z.y })),
      };
      const saved = await this.api.request<MapaData>('mapa', 'PUT', body);
      this.estacoes.set(saved.estacoes);
      this.textos.set(saved.textos);
      this.zonasMapa.set(saved.zonas);
      this.redraw();
      this.saved.emit();
    } catch (e) { this.error.set((e as Error).message); }
    finally { this.busy.set(false); }
  }
}
