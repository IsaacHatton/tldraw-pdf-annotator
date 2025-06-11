import { useState } from 'react';
import 'tldraw/tldraw.css';
import { PdfEditor } from './PdfEditor';
import { Pdf, PdfPicker } from './PdfPicker';
import './pdf-editor.css';

import Clarity from '@microsoft/clarity';
Clarity.init("rxebkxz5mx");

if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function () {
    let resolve, reject
    const promise = new Promise((res, rej) => {
      resolve = res
      reject = rej
    })
    return { promise, resolve, reject }
  }
}

type State =
  | {
      phase: 'pick';
    }
  | {
      phase: 'edit';
      pdf: Pdf;
    };

export default function PdfEditorWrapper() {
  const [state, setState] = useState<State>({ phase: 'pick' });

  switch (state.phase) {
    case 'pick':
      return (
        <div className="PdfEditor">
          <PdfPicker onOpenPdf={pdf => setState({ phase: 'edit', pdf })} />
        </div>
      );
    case 'edit':
      return (
        <div className="PdfEditor">
          <PdfEditor pdf={state.pdf} />
        </div>
      );
  }
}
