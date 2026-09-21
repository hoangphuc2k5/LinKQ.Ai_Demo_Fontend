import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface OcrImageItem {
  file: File;
  previewUrl: string;
  text: string | null;
  error: string | null;
}

@Component({
  selector: 'app-ocr',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ocr.component.html',
  styleUrls: ['./ocr.component.css'],
})
export class OcrComponent {
  imageItems: OcrImageItem[] = [];
  isReading = false;
  errorMessage: string | null = null;

  constructor(private api: ApiService) {}

  get hasResults(): boolean {
    return this.imageItems.some((item) => item.text !== null || item.error !== null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    this.addImageFiles(files);
    input.value = '';
  }

  @HostListener('document:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const imageItem = Array.from(event.clipboardData?.items || [])
      .find((item) => item.type.startsWith('image/'));
    const image = imageItem?.getAsFile();
    if (!image) return;

    event.preventDefault();
    const file = new File([image], `pasted-image.${image.type.split('/')[1] || 'png'}`, {
      type: image.type,
    });
    this.addImageFiles([file]);
  }

  private addImageFiles(files: File[]): void {
    const invalidFile = files.find((file) => !file.type.startsWith('image/'));
    if (invalidFile) {
      this.errorMessage = 'Vui lòng chỉ chọn file hình ảnh.';
      return;
    }

    const newFiles = files.filter((file) => !this.imageItems.some((item) =>
      item.file.name === file.name && item.file.size === file.size && item.file.lastModified === file.lastModified));
    this.imageItems = [
      ...this.imageItems,
      ...newFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        text: null,
        error: null,
      })),
    ];
    this.errorMessage = null;
  }

  removeImage(index: number): void {
    const [removed] = this.imageItems.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    this.imageItems = [...this.imageItems];
  }

  readText(): void {
    if (!this.imageItems.length || this.isReading) return;

    this.isReading = true;
    this.errorMessage = null;
    this.imageItems.forEach((item) => {
      item.text = null;
      item.error = null;
    });
    forkJoin(this.imageItems.map((item) => this.api.readImageText(item.file).pipe(
      catchError((error) => of({ error: error?.error?.error || 'Không thể đọc ảnh này.' })),
    ))).subscribe((responses) => {
      responses.forEach((response, index) => {
        if ('error' in response) this.imageItems[index].error = response.error;
        else this.imageItems[index].text = response.text;
      });
      this.isReading = false;
    });
  }

  clearImages(): void {
    this.imageItems.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    this.imageItems = [];
    this.errorMessage = null;
  }
}