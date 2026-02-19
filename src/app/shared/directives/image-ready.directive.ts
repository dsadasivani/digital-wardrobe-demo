import {
  AfterViewInit,
  Directive,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: 'img[dwImageReady]',
  standalone: true,
  host: {
    '[class.dw-image-loading]': 'isLoading()',
    '[class.dw-image-loaded]': '!isLoading()',
    '[attr.aria-busy]': 'isLoading() ? "true" : null',
  },
})
export class ImageReadyDirective implements AfterViewInit {
  dwImageReady = input<string | null | undefined>(null);
  isLoading = linkedSignal(() => !!this.dwImageReady());

  private imageRef = inject(ElementRef<HTMLImageElement>);
  private renderer = inject(Renderer2);
  private parentElement: HTMLElement | null = null;

  constructor() {
    effect(() => {
      const loading = this.isLoading();
      this.syncParentLoadingClass(loading);
    });
  }

  ngAfterViewInit(): void {
    this.parentElement = this.imageRef.nativeElement.parentElement;
    if (this.parentElement) {
      this.renderer.addClass(this.parentElement, 'dw-image-ready-host');
    }
    const image = this.imageRef.nativeElement;
    if (image.complete) {
      this.isLoading.set(false);
    }
  }

  ngOnDestroy(): void {
    if (!this.parentElement) {
      return;
    }
    this.renderer.removeClass(this.parentElement, 'dw-image-loading-host');
    this.renderer.removeClass(this.parentElement, 'dw-image-ready-host');
  }

  @HostListener('load')
  onLoad(): void {
    this.isLoading.set(false);
  }

  @HostListener('error')
  onError(): void {
    this.isLoading.set(false);
  }

  private syncParentLoadingClass(loading: boolean): void {
    const parent = this.parentElement ?? this.imageRef.nativeElement.parentElement;
    if (!parent) {
      return;
    }
    this.parentElement = parent;
    this.renderer.addClass(parent, 'dw-image-ready-host');
    if (loading) {
      this.renderer.addClass(parent, 'dw-image-loading-host');
      return;
    }
    this.renderer.removeClass(parent, 'dw-image-loading-host');
  }
}
