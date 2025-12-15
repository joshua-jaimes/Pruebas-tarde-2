import * as faceapi from 'face-api.js';

// Configurar face-api.js para el navegador
if (typeof window !== 'undefined') {
  window.faceapi = faceapi;
  
  // Configurar canvas para face-api
  faceapi.env.monkeyPatch({
    Canvas: HTMLCanvasElement,
    Image: HTMLImageElement,
    ImageData: ImageData,
    Video: HTMLVideoElement,
    createCanvasElement: () => document.createElement('canvas'),
    createImageElement: () => document.createElement('img')
  });
}

export default faceapi;