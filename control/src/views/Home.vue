<template>
  <div class="home">
    <h1>📘 Sistema de Registro y Asistencia</h1>
    <router-link to="/registro">Registrar Persona</router-link>
  <br>
    <router-link to="/camara">Probar Cámara</router-link><br>
    <router-link to="/asistencia">Asistencia</router-link>
  </div>
</template>

<style>
.home {
  text-align: center;
  margin-top: 50px;
  font-family: Arial, sans-serif;
}

a {
  display: inline-block;
  margin: 10px;
  padding: 10px 15px;
  background: #4b9be0;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  
}
router-link:hover {
  background: #357abd;
}
</style>
