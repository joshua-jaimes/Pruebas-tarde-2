<template>
  <div class="camara">
    <h2>📷 Test Cámara</h2>
    <video ref="video" autoplay playsinline class="video"></video>
    <div>
      <button @click="startCamera">Encender Cámara</button>
    </div>
    <p class="error">{{ errorMsg }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";

const video = ref(null);
const errorMsg = ref("");

const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.value.srcObject = stream;
  } catch (err) {
    errorMsg.value = "❌ ERROR: " + err.message;
  }
};
</script>

<style>
.camara {
  text-align: center;
  margin-top: 30px;
}
.video {
  width: 300px;
  border: 2px solid #4b9be0;
  border-radius: 10px;
  margin-bottom: 10px;
}
.error {
  color: red;
  font-weight: bold;
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
</style>
