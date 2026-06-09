# 📚 DOCUMENTACIÓN DE SERVICIOS API (ENDPOINTS)

Este documento detalla todos los servicios REST disponibles en el backend de la aplicación ALPERCOL (`server.js`).

**Base URL:** `http://localhost:3001`

## 🔐 Autenticación y Seguridad

La mayoría de los endpoints están protegidos y requieren un token JWT válido.
**Header requerido:** `Authorization: Bearer <token>`

---

## 👤 Autenticación y Usuarios

### 1. Registro de Usuario
**Endpoint:** `POST /api/registro`
**Descripción:** Registra un nuevo usuario en el sistema. Si el rol es 'trabajador', también crea el registro en la tabla `trabajador`.
**Auth:** No
**Body:**
```json
{
  "nombre": "Juan",
  "apellidos": "Perez",
  "cedula": "123456789",
  "fecha_nacimiento": "1990-01-01",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "trabajador"
}
```

### 2. Iniciar Sesión
**Endpoint:** `POST /login`
**Descripción:** Autentica al usuario y devuelve un token JWT.
**Auth:** No
**Body:**
```json
{
  "email": "juan@example.com",
  "password": "password123",
  "role": "trabajador"
}
```

### 3. Obtener Usuario Actual
**Endpoint:** `GET /api/auth/me`
**Descripción:** Obtiene la información del usuario autenticado basada en el token.
**Auth:** Sí

### 4. Olvido de Contraseña
**Endpoint:** `POST /forgot-password`
**Descripción:** Solicita un enlace de recuperación de contraseña enviado al correo.
**Auth:** No
**Body:** `{ "email": "user@example.com" }`

### 5. Restablecer Contraseña
**Endpoint:** `POST /reset-password`
**Descripción:** Establece una nueva contraseña utilizando el token de recuperación.
**Auth:** No
**Body:** `{ "token": "abc...", "newPassword": "password123" }`

---

## 📋 Gestión de Encuestas

### 6. Crear Encuesta
**Endpoint:** `POST /surveys`
**Descripción:** Crea una nueva encuesta con sus preguntas y opciones.
**Auth:** Sí
**Body:**
```json
{
  "title": "Encuesta Q1",
  "description": "Satisfacción laboral",
  "deadline": "2024-12-31",
  "is_mandatory": true,
  "questions": [
    { "text": "¿Te gusta tu trabajo?", "type": "si_no", "order": 1, "is_mandatory": true },
    { "text": "Califica tu ambiente", "type": "escala_1_5", "order": 2, "is_mandatory": true }
  ]
}
```

### 5. Eliminar Encuesta
**Endpoint:** `DELETE /surveys/:id`
**Descripción:** Elimina una encuesta y todos sus datos relacionados.
**Auth:** Sí

### 6. Listar Encuestas
**Endpoint:** `GET /surveys`
**Descripción:** Obtiene la lista de todas las encuestas ordenadas por fecha de creación.
**Auth:** Sí

### 7. Detalle de Encuesta
**Endpoint:** `GET /surveys/:id`
**Descripción:** Obtiene los detalles completos de una encuesta (preguntas y opciones) para ser respondida.
**Auth:** Sí

---

## 📝 Respuestas y Resultados

### 8. Enviar Respuestas
**Endpoint:** `POST /surveys/:id/responses`
**Descripción:** Guarda las respuestas de un usuario para una encuesta asignada.
**Auth:** Sí
**Body:**
```json
{
  "responses": [
    { "id_pregunta": 1, "respuesta": "Sí" },
    { "id_pregunta": 2, "respuesta": "5" }
  ]
}
```

### 9. Obtener Resultados Agregados
**Endpoint:** `GET /surveys/:id/responses`
**Descripción:** Obtiene los resultados consolidados de una encuesta para reportes y gráficos.
**Auth:** Sí

### 10. Obtener Respuestas Detalladas
**Endpoint:** `GET /surveys/:id/respuestas-detalladas`
**Descripción:** Obtiene las respuestas individuales de cada usuario para revisión detallada.
**Auth:** Sí

### 11. Agregar Comentario a Respuesta
**Endpoint:** `PUT /respuestas/:id/comentario`
**Descripción:** Agrega un comentario de retroalimentación a una asignación/respuesta específica.
**Auth:** Sí
**Body:**
```json
{ "texto": "Excelente desempeño." }
```

---

## 👥 Gestión de Usuarios (Admin)

### 12. Listar Usuarios
**Endpoint:** `GET /api/usuarios`
**Descripción:** Obtiene la lista de todos los usuarios del sistema.
**Auth:** Sí

### 13. Listar Trabajadores
**Endpoint:** `GET /api/trabajadores`
**Descripción:** Obtiene la lista de trabajadores con detalles de área y estado.
**Auth:** Sí

### 14. Obtener Usuario por ID
**Endpoint:** `GET /api/usuarios/:id`
**Descripción:** Obtiene los datos de perfil de un usuario específico.
**Auth:** Sí

### 15. Actualizar Usuario
**Endpoint:** `PUT /api/usuarios/:id`
**Descripción:** Actualiza los datos de un usuario.
**Auth:** Sí
**Body:**
```json
{ "nombre": "Nuevo Nombre", "email": "nuevo@email.com", "rol": "admin" }
```

### 16. Crear Usuario (Admin)
**Endpoint:** `POST /api/usuarios`
**Descripción:** Crea un usuario directamente desde el panel de administración.
**Auth:** Sí

### 17. Eliminar Usuario
**Endpoint:** `DELETE /api/usuarios/:id`
**Descripción:** Elimina un usuario del sistema.
**Auth:** Sí

### 18. Eliminar Trabajador
**Endpoint:** `DELETE /api/trabajadores/:id`
**Descripción:** Elimina un trabajador y su usuario asociado.
**Auth:** Sí

---

## 📅 Asignaciones

### 19. Asignar Encuesta
**Endpoint:** `POST /api/asignaciones`
**Descripción:** Asigna una encuesta a una lista de usuarios (trabajadores).
**Auth:** Sí
**Body:**
```json
{
  "id_encuesta": 1,
  "usuarios": [101, 102, 103],
  "fecha_asignacion": "2024-01-01"
}
```

### 20. Historial de Asignaciones
**Endpoint:** `GET /api/assignments`
**Descripción:** Obtiene el historial global de asignaciones.
**Auth:** Sí

### 21. Mis Asignaciones
**Endpoint:** `GET /api/my-assignments`
**Descripción:** Obtiene las encuestas asignadas al usuario autenticado.
**Auth:** Sí

---

## 📊 Dashboard y Estadísticas

### 22. Estadísticas Generales
**Endpoint:** `GET /api/dashboard/stats`
**Descripción:** Obtiene contadores para el dashboard (encuestas activas, usuarios, respuestas, pendientes).
**Auth:** Sí

### 23. Historial de Envíos
**Endpoint:** `GET /api/historial-envios`
**Descripción:** Obtiene el historial de encuestas enviadas por el usuario creador con estadísticas de respuesta.
**Auth:** Sí

### 24. Reenviar Encuesta
**Endpoint:** `POST /api/historial-envios/:id/reenviar`
**Descripción:** Envía notificaciones de recordatorio a los usuarios que tienen la encuesta pendiente.
**Auth:** Sí

---

## 🔔 Notificaciones

### 25. Obtener Notificaciones
**Endpoint:** `GET /api/notificaciones`
**Descripción:** Obtiene las notificaciones del usuario.
**Auth:** Sí

### 26. Marcar como Leída
**Endpoint:** `PUT /api/notificaciones/:id/leida`
**Descripción:** Marca una notificación específica como leída.
**Auth:** Sí

### 27. Eliminar Notificación
**Endpoint:** `DELETE /api/notificaciones/:id`
**Descripción:** Elimina una notificación.
**Auth:** Sí

### 28. Contar No Leídas
**Endpoint:** `GET /api/notificaciones/no-leidas/count`
**Descripción:** Obtiene el número de notificaciones no leídas para el badge.
**Auth:** Sí

### 29. Marcar Todas como Leídas
**Endpoint:** `PUT /api/notificaciones/marcar-todas-leidas`
**Descripción:** Marca todas las notificaciones del usuario como leídas.
**Auth:** Sí