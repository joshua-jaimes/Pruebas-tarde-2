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
import { ref, onMounted, onUnmounted } from "vue";

const video = ref(null);
const estado = ref("Iniciando...");
const personaDetectada = ref(null);
let intervalo = null;

const faceapi = window.faceapi || {};

async function cargarModelos() {
  try {
    estado.value = "Cargando modelos...";
    
    // MISMO modelo que Registro.vue
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    
    estado.value = "✅ Modelos listos";
  } catch (error) {
    estado.value = `❌ Error modelos: ${error.message}`;
  }
}

async function iniciarCamara() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480 } 
    });
    video.value.srcObject = stream;
    estado.value = "Cámara lista - Buscando rostros...";
  } catch (error) {
    estado.value = "❌ Error cámara";
  }
}

function iniciarReconocimiento() {
  const personasGuardadas = JSON.parse(localStorage.getItem("personas") || "[]");
  
  if (personasGuardadas.length === 0) {
    estado.value = "⚠️ No hay personas registradas. Ve a Registro primero.";
    return;
  }

  estado.value = `Buscando entre ${personasGuardadas.length} personas...`;

  // Convertir a formato de face-api
  const labeledDescriptors = personasGuardadas.map(persona => 
    new faceapi.LabeledFaceDescriptors(
      persona.nombre,
      [new Float32Array(persona.descriptor)]
    )
  );

  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6); // 0.6 = umbral de confianza

  intervalo = setInterval(async () => {
    if (!video.value || video.value.readyState !== 4) return;

    try {
      const deteccion = await faceapi
        .detectSingleFace(video.value, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!deteccion) {
        estado.value = "👤 Enfoca un rostro en la cámara...";
        personaDetectada.value = null;
        return;
      }

      const resultado = faceMatcher.findBestMatch(deteccion.descriptor);
      
      if (resultado.label === "unknown") {
        estado.value = "❌ Persona desconocida";
        personaDetectada.value = null;
      } else {
        const persona = personasGuardadas.find(p => p.nombre === resultado.label);
        personaDetectada.value = {
          ...persona,
          confianza: (1 - resultado.distance).toFixed(2)
        };
        
        estado.value = `✅ ${persona.nombre} detectado (${personaDetectada.value.confianza}%)`;
        
        // Registrar asistencia SOLO una vez por día
        registrarAsistencia(persona);
      }
    } catch (error) {
      console.log("Escaneando...");
    }
  }, 800);
}

function registrarAsistencia(persona) {
  const hoy = new Date().toDateString();
  const ahora = new Date().toLocaleTimeString();
  
  let asistencias = JSON.parse(localStorage.getItem("asistencias") || "[]");
  
  // Verificar si ya registró hoy
  const yaRegistrado = asistencias.some(a => 
    a.id === persona.id && new Date(a.fecha).toDateString() === hoy
  );
  
  if (!yaRegistrado) {
    asistencias.push({
      nombre: persona.nombre,
      id: persona.id,
      fecha: new Date().toISOString(),
      hora: ahora,
      timestamp: Date.now()
    });
    
    localStorage.setItem("asistencias", JSON.stringify(asistencias));
    console.log(`Asistencia registrada: ${persona.nombre} a las ${ahora}`);
  }
}

onMounted(async () => {
  await cargarModelos();
  await iniciarCamara();
  iniciarReconocimiento();
});

onUnmounted(() => {
  if (intervalo) clearInterval(intervalo);
  if (video.value?.srcObject) {
    video.value.srcObject.getTracks().forEach(track => track.stop());
  }
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
