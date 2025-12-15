<template>
  <div class="asistencia">
    <h2>📘 Asistencia Automática</h2>
    <video ref="video" autoplay playsinline class="video"></video>
    <p class="estado">{{ estado }}</p>

    <div v-if="personaDetectada" class="resultado">
      <h3>✔ Persona reconocida</h3>
      <p><b>Nombre:</b> {{ personaDetectada.nombre }}</p>
      <p><b>ID:</b> {{ personaDetectada.id }}</p>
      <p style="color: green; font-weight: bold;">ASISTENCIA REGISTRADA</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";


const faceapi = window.faceapi;

if (!faceapi) {
  throw new Error("face-api.js no está cargado");
}






const video = ref(null);
const estado = ref("Cargando modelos...");
const personaDetectada = ref(null);

async function cargarModelos() {
  await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
}


async function iniciarCamara() {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.value.srcObject = stream;
}

async function iniciarReconocimiento() {
  const personasGuardadas = JSON.parse(localStorage.getItem("personas") || "[]");
  if (personasGuardadas.length === 0) {
    estado.value = "No hay personas registradas";
    return;
  }

  const labeledDescriptors = personasGuardadas.map(p =>
    new faceapi.LabeledFaceDescriptors(p.nombre, [new Float32Array(p.descriptor)])
  );

  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors);

  estado.value = "Buscando rostro...";

  setInterval(async () => {
    const deteccion = await faceapi
  .detectSingleFace(video.value)
  .withFaceLandmarks()
  .withFaceDescriptor();


    if (!deteccion) {
      estado.value = "Buscando rostro...";
      personaDetectada.value = null;
      return;
    }

    const mejorCoincidencia = faceMatcher.findBestMatch(deteccion.descriptor);
    if (mejorCoincidencia.label === "unknown") {
      estado.value = "Persona desconocida";
      personaDetectada.value = null;
      return;
    }

    const persona = personasGuardadas.find(p => p.nombre === mejorCoincidencia.label);
    personaDetectada.value = persona;
    estado.value = `✔ Bienvenido ${persona.nombre}`;

    // Marcar asistencia
    const asistencias = JSON.parse(localStorage.getItem("asistencias") || "[]");
    const hoy = new Date().toLocaleDateString();
    if (!asistencias.some(a => a.id === persona.id && a.fecha === hoy)) {
      asistencias.push({
        nombre: persona.nombre,
        id: persona.id,
        fecha: hoy,
        hora: new Date().toLocaleTimeString(),
      });
      localStorage.setItem("asistencias", JSON.stringify(asistencias));
    }
  }, 800);
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  iniciarReconocimiento();
});
</script>

<style>
.asistencia {
  text-align: center;
  margin-top: 20px;
}
.video {
  width: 300px;
  border: 2px solid #4b9be0;
  border-radius: 10px;
  margin-bottom: 10px;
}
.estado {
  font-weight: bold;
  margin-bottom: 10px;
}
.resultado {
  background: #e3ffe3;
  padding: 12px;
  border: 2px solid green;
  border-radius: 8px;
  display: inline-block;
}
</style>
