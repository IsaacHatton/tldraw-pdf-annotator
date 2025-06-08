import { useState } from 'react';
import {
  AssetRecordType,
  Box,
  TLAssetId,
  TLShapeId,
  createShapeId,
} from 'tldraw';
export interface PdfPage {
  src: string;
  bounds: Box;
  assetId: TLAssetId;
  shapeId: TLShapeId;
  useLightMode: boolean;
}

export interface Pdf {
  name: string;
  pages: PdfPage[];
  source: string | ArrayBuffer;
}

const pageSpacing = 32;

export function PdfPicker({ onOpenPdf }: { onOpenPdf(pdf: Pdf): void }) {
  const [isLoading, setIsLoading] = useState(false);

  async function loadPdf(name: string, source: ArrayBuffer): Promise<Pdf> {
    const PdfJS = await import('pdfjs-dist');
    PdfJS.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    const pdf = await PdfJS.getDocument(source.slice(0)).promise;
    const pages: PdfPage[] = [];

    const canvas = window.document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Failed to create canvas context');

    const visualScale = 1.5;
    const scale = window.devicePixelRatio;

    let top = 0;
    let widest = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: scale * visualScale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const renderContext = {
        canvasContext: context,
        viewport,
      };
      await page.render(renderContext).promise;

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let r = 0, g = 0, b = 0;

      for (let j = 0; j < data.length; j += 4) {
        r += data[j];
        g += data[j + 1];
        b += data[j + 2];
      }

      const pixelCount = data.length / 4;
      r = Math.round(r / pixelCount);
      g = Math.round(g / pixelCount);
      b = Math.round(b / pixelCount);

      const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
      const lightModeDetected = brightness > 128;

      const width = viewport.width / scale;
      const height = viewport.height / scale;
      pages.push({
        src: canvas.toDataURL(),
        bounds: new Box(0, top, width, height),
        assetId: AssetRecordType.createId(),
        shapeId: createShapeId(),
        useLightMode: lightModeDetected,
      });
      top += height + pageSpacing;
      widest = Math.max(widest, width);
    }
    canvas.width = 0;
    canvas.height = 0;

    for (const page of pages) {
      page.bounds.x = (widest - page.bounds.width) / 2;
    }

    return {
      name,
      pages,
      source,
    };
  }

  function onClickOpenPdf() {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.addEventListener('change', async e => {
      const fileList = (e.target as HTMLInputElement).files;
      if (!fileList || fileList.length === 0) return;
      const file = fileList[0];

      setIsLoading(true);
      try {
        const pdf = await loadPdf(file.name, await file.arrayBuffer());
        onOpenPdf(pdf);
      } finally {
        setIsLoading(false);
      }
    });
    input.click();
  }

  if (isLoading) {
    return <div className="PdfPicker">Loading...</div>;
  }

  return (
    <div className="PdfPicker">
      <button onClick={onClickOpenPdf}>Open PDF</button>
      <div>Once you are done, reload the page to get back to this menu.</div>
      <p>
        Source code available on <a href="https://github.com/IsaacHatton/tldraw-pdf-annotator">GitHub</a>.
      </p>
    </div>
  );
}
