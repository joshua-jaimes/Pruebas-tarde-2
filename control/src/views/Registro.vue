<template>
  <div class="registro">
    <h2>Registrar Persona</h2>
    <video ref="video" autoplay playsinline class="video"></video>
    <p class="estado">{{ estado }}</p>

    <div class="form">
      <input v-model="nombre" placeholder="Nombre" />
      <input v-model="id" placeholder="ID" />
      <button @click="guardarPersona" :disabled="!rostroDetectado">Guardar Registro</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

const video = ref(null);
const nombre = ref("");
const id = ref("");
const estado = ref("Preparando cámara...");
const rostroDetectado = ref(false);
let descriptorActual = null;
let intervalo = null;

// Asegurar que faceapi existe
const faceapi = window.faceapi || {};

async function cargarModelos() {
  try {
    estado.value = "Cargando modelos (solo 5 segundos)...";
    
    // Modelo LIGERO y RÁPIDO
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    
    estado.value = "✅ Modelos listos";
    console.log("Modelos cargados correctamente");
  } catch (error) {
    estado.value = `❌ Error: ${error.message}`;
    console.error("ERROR modelos:", error);
  }
}

async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 } 
    });
    video.value.srcObject = stream;
    estado.value = "Cámara activada ✓";
  } catch (error) {
    estado.value = "❌ Error cámara: " + error.message;
  }
}

function detectarRostro() {
  intervalo = setInterval(async () => {
    if (!video.value || !faceapi.detectSingleFace) return;

    try {
      const deteccion = await faceapi
        .detectSingleFace(video.value, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (deteccion) {
        estado.value = "✅ Rostro detectado - LISTO para registrar";
        rostroDetectado.value = true;
        descriptorActual = Array.from(deteccion.descriptor);
      } else {
        estado.value = "👤 Enfoca tu rostro en la cámara...";
        rostroDetectado.value = false;
      }
    } catch (error) {
      console.log("Buscando...");
    }
  }, 500);
}

function guardarPersona() {
  if (!nombre.value.trim() || !id.value.trim()) {
    estado.value = "❌ Ingresa nombre y ID";
    return;
  }
  
  if (!descriptorActual) {
    estado.value = "❌ Primero detecta tu rostro";
    return;
  }

  const personas = JSON.parse(localStorage.getItem("personas") || "[]");
  
  // Evitar duplicados
  if (personas.some(p => p.id === id.value)) {
    estado.value = "❌ Esta ID ya existe";
    return;
  }

  personas.push({
    nombre: nombre.value,
    id: id.value,
    descriptor: descriptorActual,
    fecha: new Date().toLocaleString()
  });

  localStorage.setItem("personas", JSON.stringify(personas));

  estado.value = `✅ ${nombre.value} registrado correctamente!`;
  nombre.value = "";
  id.value = "";
  rostroDetectado.value = false;
  descriptorActual = null;
  
  // Mostrar cuántas personas hay registradas
  setTimeout(() => {
    estado.value = `Personas registradas: ${personas.length}`;
  }, 2000);
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  detectarRostro();
});

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo);
  if (video.value?.srcObject) {
    video.value.srcObject.getTracks().forEach(track => track.stop());
  }
});
</script>

<style>
.registro {
  text-align: center;
  margin-top: 20px;
}
.video {
  width: 300px;
  border: 2px solid #4b9be0;
  border-radius: 10px;
  margin-bottom: 10px;
}
.form {
  margin-top: 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}
input {
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}
button {
  padding: 8px 12px;
  background: #4b9be0;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background: #357abd;
}
.estado {
  font-weight: bold;
  margin-bottom: 10px;
}
</style>
