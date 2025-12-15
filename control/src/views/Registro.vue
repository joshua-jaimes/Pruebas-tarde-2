<template>
  <div class="registro">
    <h2>Registrar Persona</h2>
    
    <!-- Contenedor de video con canvas superpuesto -->
    <div class="video-container">
      <video ref="video" autoplay playsinline class="video"></video>
      <canvas ref="canvas" class="overlay-canvas"></canvas>
    </div>
    
    <p class="estado">{{ estado }}</p>
    
    <!-- Indicador visual de detección -->
    <div class="deteccion-indicador" :class="{ detectado: rostroDetectado }">
      {{ rostroDetectado ? '✅ ROSTRO DETECTADO' : '🔍 BUSCANDO ROSTRO' }}
    </div>

    <div class="form">
      <input v-model="nombre" placeholder="Nombre completo" />
      <input v-model="id" placeholder="ID o Matrícula" />
      <button @click="guardarPersona" :disabled="!rostroDetectado" 
              :class="{ activo: rostroDetectado }">
        {{ rostroDetectado ? '✅ GUARDAR REGISTRO' : 'Primero detecta rostro' }}
      </button>
    </div>
    
    <!-- Información de debug -->
    <div class="debug-info" v-if="false"> <!-- Cambia a true para ver debug -->
      <p>Video listo: {{ video?.readyState === 4 ? 'Sí' : 'No' }}</p>
      <p>Personas registradas: {{ (JSON.parse(localStorage.getItem('personas') || '[]')).length }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as faceapi from 'face-api.js';  // Importar directamente

const video = ref(null);
const nombre = ref("");
const id = ref("");
const estado = ref("Esperando...");
const rostroDetectado = ref(false);
let intervalo = null;
let descriptorActual = null;

async function cargarModelos() {
  try {
    estado.value = "📦 Descargando modelos (un momento)...";
    
    // Cargar modelos con manejo de errores
    const modelPath = '/models';
    
    await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
    estado.value = "✅ Detector cargado";
    
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
    estado.value = "✅ Puntos faciales cargados";
    
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
    estado.value = "✅ Reconocimiento cargado";
    
    console.log("Todos los modelos cargados correctamente");
    return true;
  } catch (error) {
    estado.value = `❌ Error: ${error.message}`;
    console.error("ERROR cargando modelos:", error);
    return false;
  }
}

async function iniciarCamara() {
  try {
    estado.value = "📷 Activando cámara...";
    
    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user"
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.value.srcObject = stream;
    
    // Esperar a que el video esté listo
    await new Promise((resolve) => {
      video.value.onloadedmetadata = () => {
        video.value.play();
        resolve();
      };
    });
    
    estado.value = "✅ Cámara lista - Enfoca tu rostro";
    return true;
  } catch (error) {
    estado.value = `❌ Error cámara: ${error.name} - ${error.message}`;
    console.error("ERROR cámara:", error);
    return false;
  }
}

function detectarRostro() {
  clearInterval(intervalo); // Limpiar intervalo anterior
  
  intervalo = setInterval(async () => {
    if (!video.value || video.value.readyState !== 4) {
      return;
    }
    
    try {
      // Crear canvas temporal para visualizar
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = video.value.videoWidth;
      canvas.height = video.value.videoHeight;
      ctx.drawImage(video.value, 0, 0, canvas.width, canvas.height);
      
      // Opciones para mejor detección
      const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,  // Tamaño más pequeño = más rápido
        scoreThreshold: 0.3  // Umbral más bajo para detectar más rostros
      });
      
      const deteccion = await faceapi
        .detectSingleFace(canvas, options)
        .withFaceLandmarks()
        .withFaceDescriptor();
      
      if (deteccion) {
        // Dibujar caja alrededor del rostro (para debug)
        const displaySize = { width: video.value.videoWidth, height: video.value.videoHeight };
        const resizedDetection = faceapi.resizeResults(deteccion, displaySize);
        
        estado.value = `✅ ROSTRO DETECTADO! Confianza: ${(deteccion.detection.score * 100).toFixed(1)}%`;
        rostroDetectado.value = true;
        descriptorActual = Array.from(deteccion.descriptor);
        
        // Mostrar mensaje por 2 segundos
        setTimeout(() => {
          if (rostroDetectado.value) {
            estado.value = "✅ Rostro detectado - Completa tus datos abajo";
          }
        }, 2000);
      } else {
        estado.value = "👤 Mírate en la cámara (buena iluminación)";
        rostroDetectado.value = false;
        descriptorActual = null;
      }
    } catch (error) {
      console.log("Buscando rostro...", error.message);
    }
  }, 1000); // Revisar cada segundo
}

function guardarPersona() {
  if (!nombre.value.trim() || !id.value.trim()) {
    estado.value = "❌ Ingresa nombre y ID";
    return;
  }
  
  if (!descriptorActual) {
    estado.value = "❌ Primero detecta tu rostro en la cámara";
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
    fecha: new Date().toISOString()
  });

  localStorage.setItem("personas", JSON.stringify(personas));
  
  // Mostrar confirmación
  estado.value = `🎉 ¡${nombre.value} registrado exitosamente!`;
  
  // Reiniciar formulario
  setTimeout(() => {
    nombre.value = "";
    id.value = "";
    rostroDetectado.value = false;
    descriptorActual = null;
    estado.value = "✅ Registro completado - Puedes registrar otra persona";
  }, 3000);
}

onMounted(async () => {
  // Esperar a que el DOM esté listo
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Cargar modelos primero
  const modelosCargados = await cargarModelos();
  if (!modelosCargados) return;
  
  // Iniciar cámara
  const camaraLista = await iniciarCamara();
  if (!camaraLista) return;
  
  // Esperar 1 segundo para que la cámara se estabilice
  setTimeout(() => {
    detectarRostro();
  }, 1000);
});

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo);
  
  // Detener cámara
  if (video.value?.srcObject) {
    const tracks = video.value.srcObject.getTracks();
    tracks.forEach(track => track.stop());
  }
});
</script>

<style scoped>
.registro {
  text-align: center;
  margin-top: 20px;
  font-family: Arial, sans-serif;
}

.video-container {
  position: relative;
  display: inline-block;
  margin-bottom: 15px;
}

.video {
  width: 100%;
  max-width: 500px;
  border: 3px solid #4b9be0;
  border-radius: 10px;
  background: #000;
}

.overlay-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.estado {
  font-weight: bold;
  font-size: 1.1em;
  margin: 10px 0;
  min-height: 1.5em;
}

.deteccion-indicador {
  padding: 8px 15px;
  border-radius: 20px;
  display: inline-block;
  margin: 10px 0;
  font-weight: bold;
  background: #ff6b6b;
  color: white;
  transition: all 0.3s;
}

.deteccion-indicador.detectado {
  background: #4CAF50;
  transform: scale(1.05);
}

.form {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

input {
  padding: 10px 15px;
  width: 100%;
  border-radius: 8px;
  border: 2px solid #ddd;
  font-size: 16px;
  transition: border 0.3s;
}

input:focus {
  border-color: #4b9be0;
  outline: none;
}

button {
  padding: 12px 20px;
  background: #ccc;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: not-allowed;
  font-size: 16px;
  font-weight: bold;
  width: 100%;
  transition: all 0.3s;
}

button.activo {
  background: #4b9be0;
  cursor: pointer;
}

button.activo:hover {
  background: #357abd;
  transform: translateY(-2px);
}

.debug-info {
  margin-top: 20px;
  padding: 10px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
}
</style>