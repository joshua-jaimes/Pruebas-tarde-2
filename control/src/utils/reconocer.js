

let labeledDescriptors = [];

// Cargar modelos
export async function loadModels() {
  await faceapi.nets.tinyFaceDetector.load('/models/');
  await faceapi.nets.faceLandmark68Net.load('/models/');
  await faceapi.nets.faceRecognitionNet.load('/models/');
}

// Registrar una cara
export async function registrarPersona(nombre, imagenBase64) {
  const img = await faceapi.fetchImage(imagenBase64);

  const detections = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections) {
    return { ok: false, mensaje: "No se logró detectar la cara" };
  }

  const descriptor = new faceapi.LabeledFaceDescriptors(
    nombre,
    [detections.descriptor]
  );

  labeledDescriptors.push(descriptor);

  // Guardar en localStorage
  localStorage.setItem("caras", JSON.stringify(labeledDescriptors));

  return { ok: true };
}

// Cargar rostros guardados al inicio
export function cargarCarasGuardadas() {
  const data = localStorage.getItem("caras");
  if (!data) return;

  const arr = JSON.parse(data);

  labeledDescriptors = arr.map(p =>
    new faceapi.LabeledFaceDescriptors(
      p.label,
      p.descriptors.map(d => new Float32Array(Object.values(d)))
    )
  );
}

// Reconocer cara
export async function reconocer(video) {
  if (labeledDescriptors.length === 0) return "Desconocido";

  const detections = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detections) return null;

  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

  const result = faceMatcher.findBestMatch(detections.descriptor);

  return result.toString(); // "Nombre (0.55)"
}
