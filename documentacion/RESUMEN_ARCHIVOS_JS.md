# Resumen de Archivos JavaScript Creados/Modificados

## Fecha: 15 de enero de 2026 (v3.0 - Final)

---

## 📋 Archivos JavaScript Creados

### 1. **`js/crear-encuesta.js`** ✅
**Propósito:** Gestionar la creación de encuestas con preguntas dinámicas
**Ubicación:** `/backend-alpercol/js/crear-encuesta.js`
**Página asociada:** `crear-encuesta.html`

**Funcionalidades:**
- ✅ Agregar preguntas de forma dinámica
- ✅ Agregar opciones para preguntas de opción múltiple
- ✅ Validar que haya preguntas con contenido
- ✅ Guardar borrador en sessionStorage
- ✅ Recuperar borrador si existe
- ✅ Publicar encuesta al servidor (`POST /surveys`)
- ✅ Mostrar notificaciones de éxito/error
- ✅ Manejo de autenticación con token

**Métodos principales:**
- `addQuestionBlock()` - Crea bloque de pregunta dinámico
- `validateQuestions()` - Valida preguntas obligatorias
- `collectSurveyData()` - Reúne datos del formulario
- `publishSurvey()` - Envía al servidor
- `saveDraft()` - Guarda borrador en sessionStorage
- `restoreDraftIfExists()` - Recupera borrador guardado

**Dependencias:**
- `common.js` (para `window.showAppNotification()` y `window.setButtonLoadingState()`)
- `navigation.js` (carga automática)

---

### 2. **`js/responder-encuesta.js`** ✅
**Propósito:** Permitir a usuarios responder encuestas disponibles
**Ubicación:** `/backend-alpercol/js/responder-encuesta.js`
**Página asociada:** `responder-encuesta.html`

**Funcionalidades:**
- ✅ Cargar listado de encuestas disponibles
- ✅ Mostrar detalles de encuesta seleccionada
- ✅ Campos de respuesta según tipo de pregunta:
  - Texto (textarea)
  - Opción múltiple (radio buttons)
  - Sí/No (radio buttons)
- ✅ Validar respuestas obligatorias
- ✅ Enviar respuestas al servidor (`POST /surveys/{id}/responses`)
- ✅ Volver al listado de encuestas
- ✅ Manejo de autenticación

**Métodos principales:**
- `loadSurveysList()` - Obtiene encuestas disponibles
- `loadSurveyDetails(surveyId)` - Carga detalles de una encuesta
- `displaySurveyDetails(survey)` - Renderiza preguntas según tipo
- `validateResponses()` - Valida respuestas obligatorias
- `collectResponses()` - Reúne respuestas del formulario
- `submitResponses()` - Envía respuestas al servidor

**Dependencias:**
- `common.js`
- `navigation.js`

---

### 3. **`js/perfil.js`** ✅
**Propósito:** Gestionar el perfil del usuario autenticado
**Ubicación:** `/backend-alpercol/js/perfil.js`
**Página asociada:** `perfil.html`

**Funcionalidades:**
- ✅ Cargar datos del perfil desde servidor (`GET /api/usuarios/{id}`)
- ✅ Mostrar datos en modo lectura
- ✅ Permitir edición de nombre, email, teléfono
- ✅ Guardar cambios de perfil (`PUT /api/usuarios/{id}`)
- ✅ Cambiar contraseña (`PUT /api/usuarios/{id}/password`)
- ✅ Validar email y contraseña
- ✅ Actualizar localStorage con datos nuevos
- ✅ Modo edición/lectura con botones de control

**Métodos principales:**
- `loadUserProfile()` - Obtiene datos del usuario
- `displayUserProfile(user)` - Muestra datos en formulario
- `activateEditMode()` - Activa modo edición
- `deactivateEditMode()` - Desactiva modo edición
- `validateProfileForm()` - Valida datos de perfil
- `saveProfile()` - Guarda cambios de perfil
- `validatePasswordForm()` - Valida nueva contraseña
- `changePassword()` - Cambia contraseña del usuario

**Validaciones:**
- Email válido (regex)
- Contraseña: mín 8 caracteres, 1 mayúscula, 1 número
- Teléfono: mín 10 dígitos
- Contraseña actual requerida para cambiar

**Dependencias:**
- `common.js`
- `navigation.js`

---

### 4. **`js/resultados-y-reportes.js`** ✅
**Propósito:** Mostrar resultados y estadísticas de encuestas
**Ubicación:** `/backend-alpercol/js/resultados-y-reportes.js`
**Página asociada:** `resultados-y-reportes.html`

**Funcionalidades:**
- ✅ Cargar listado de encuestas creadas por usuario
- ✅ Filtrar por estado (activas/cerradas)
- ✅ Mostrar detalles con estadísticas de respuestas
- ✅ Gráficos de barra con porcentajes para:
  - Opción múltiple (cuenta y %)
  - Sí/No (cuenta y %)
  - Texto (muestra primeras 5 respuestas)
- ✅ Exportar resultados a Excel (CSV)
- ✅ Botón para ver todas las respuestas (redirige a revisión)
- ✅ Mostrar estado de encuestas (Activa/Cerrada)

**Métodos principales:**
- `loadSurveysList()` - Obtiene encuestas del usuario
- `loadSurveyDetails(surveyId)` - Obtiene respuestas
- `displaySurveyResults(surveyData)` - Renderiza estadísticas
- `exportToExcel()` - Descarga CSV con resultados
- `exportToPdf()` - Prepara exportación PDF (requiere librería)
- `viewAllResponses()` - Redirige a página de revisión

**Filtros:**
- Todas las encuestas
- Encuestas activas (fecha límite >= hoy)
- Encuestas cerradas (fecha límite < hoy)

**Dependencias:**
- `common.js`
- `navigation.js`

---

### 5. **`js/asignar-encuesta.js`** ✅
**Propósito:** Asignar encuestas a trabajadores/usuarios
**Ubicación:** `/backend-alpercol/js/asignar-encuesta.js`
**Página asociada:** `asignar-encuesta.html`

**Funcionalidades:**
- ✅ Cargar listado de encuestas disponibles
- ✅ Cargar listado de trabajadores/usuarios
- ✅ Búsqueda de trabajadores (por nombre/email)
- ✅ Seleccionar múltiples trabajadores (checkboxes)
- ✅ Generar token de acceso público
- ✅ Mostrar URL de acceso público
- ✅ Validar que se seleccione encuesta y trabajadores
- ✅ Enviar asignación al servidor (`POST /api/asignaciones`)
- ✅ Limpiar formulario después de asignar

**Métodos principales:**
- `loadSurveys()` - Obtiene encuestas
- `loadWorkers()` - Obtiene trabajadores
- `displayWorkersList(workers)` - Renderiza checkboxes de trabajadores
- `filterWorkers(searchTerm)` - Filtra trabajadores por búsqueda
- `generatePublicToken()` - Crea token y URL pública
- `validateAssignment()` - Valida selecciones
- `submitAssignment()` - Envía asignación al servidor

**Validaciones:**
- Encuesta seleccionada es obligatoria
- Al menos 1 trabajador es obligatorio
- Búsqueda dinámicamente actualiza lista

**Dependencias:**
- `common.js`
- `navigation.js`

---

### 6. **`js/gestionar-usuario.js`** ✅
**Propósito:** Gestionar usuarios y trabajadores del sistema
**Ubicación:** `/backend-alpercol/js/gestionar-usuario.js`
**Página asociada:** `gestionar-usuario.html`

**Funcionalidades:**
- ✅ Tabs para cambiar entre "Usuarios" y "Trabajadores"
- ✅ Cargar listado de usuarios (`GET /api/usuarios`)
- ✅ Cargar listado de trabajadores (`GET /api/trabajadores`)
- ✅ Crear nuevo usuario (modal form)
- ✅ Editar usuario existente (modal form)
- ✅ Eliminar usuario (`DELETE /api/usuarios/{id}`)
- ✅ Eliminar trabajador (`DELETE /api/trabajadores/{id}`)
- ✅ Mostrar estado activo/inactivo (✅/❌)
- ✅ Modal con validación
- ✅ Cerrar modal haciendo clic fuera

**Métodos principales:**
- `loadUsers()` - Obtiene usuarios
- `loadWorkers()` - Obtiene trabajadores
- `displayUsers()` - Renderiza tabla de usuarios
- `displayWorkers()` - Renderiza tabla de trabajadores
- `openCreateModal()` - Abre modal para crear
- `openEditModal(user)` - Abre modal para editar
- `closeModal()` - Cierra modal
- `validateUserForm()` - Valida datos del formulario
- `saveUser()` - Crea/actualiza usuario
- `deleteUser(userId)` - Elimina usuario
- `deleteWorker(workerId)` - Elimina trabajador

**Validaciones:**
- Nombre requerido
- Email válido (regex)
- Contraseña (si se ingresa): 8+ caracteres, 1 mayúscula, 1 número
- Contraseña solo requerida en creación

**Dependencias:**
- `common.js`
- `navigation.js`

---

### 7. **`js/notificaciones.js`** ✅
**Propósito:** Gestionar sistema de notificaciones y alertas
**Ubicación:** `/backend-alpercol/js/notificaciones.js`
**Página asociada:** `notificaciones.html`

**Funcionalidades:**
- ✅ Cargar notificaciones desde API (`GET /api/notificaciones`)
- ✅ Filtrar (todas, leídas, no leídas)
- ✅ Marcar como leída (`PUT`)
- ✅ Eliminar notificación (`DELETE`)
- ✅ Actualizar badge en menú automáticamente
- ✅ Redirección inteligente al hacer clic

**Dependencias:**
- `common.js`
- `navigation.js`

### 8. **`js/historia-envio.js`** ✅
**Propósito:** Historial y auditoría de encuestas enviadas
**Ubicación:** `/backend-alpercol/js/historia-envio.js`
**Página asociada:** `historia-envio.html`

**Funcionalidades:**
- ✅ Listado de encuestas enviadas con estadísticas
- ✅ Filtros por rango de fechas y estado
- ✅ Reenviar encuesta/recordatorio (`POST /reenviar`)
- ✅ Exportar historial a Excel (CSV)
- ✅ Cálculo de porcentaje de respuesta

**Dependencias:**
- `common.js`
- `navigation.js`

### 9. **`js/revicion-respuesta.js`** ✅
**Propósito:** Revisión detallada y cualitativa de respuestas
**Ubicación:** `/backend-alpercol/js/revicion-respuesta.js`
**Página asociada:** `revicion-respuesta.html`

**Funcionalidades:**
- ✅ Ver respuestas agrupadas por usuario
- ✅ Vista detallada expandible por pregunta
- ✅ Agregar comentarios de retroalimentación (`PUT /comentario`)
- ✅ Exportación detallada de respuestas
- ✅ Visualización de metadatos (fecha, autor)

**Dependencias:**
- `common.js`
- `navigation.js`

### 10. **`js/encuesta-publica.js`** ✅
**Propósito:** Responder encuestas de forma anónima/externa
**Ubicación:** `/backend-alpercol/js/encuesta-publica.js`
**Página asociada:** `encuesta-publica.html`

**Funcionalidades:**
- ✅ Acceso vía token público en URL
- ✅ Verificación de disponibilidad (`GET /disponible`)
- ✅ Sin autenticación requerida (modo anónimo)
- ✅ Validación de datos opcionales (email/nombre)
- ✅ Envío de respuestas (`POST /responder`)

**Dependencias:**
- Ninguna (Standalone para acceso público)

---

## 📝 Archivos HTML Actualizados

### Scripts Agregados:
```html
<!-- Cada página ahora tiene su script específico -->
<script src="js/navigation.js" defer></script>
<script src="js/[página].js" defer></script>
```

| Archivo HTML | Script agregado |
|---|---|
| `crear-encuesta.html` | `js/crear-encuesta.js` ✅ |
| `responder-encuesta.html` | `js/responder-encuesta.js` ✅ |
| `perfil.html` | `js/perfil.js` ✅ |
| `resultados-y-reportes.html` | `js/resultados-y-reportes.js` ✅ |
| `asignar-encuesta.html` | `js/asignar-encuesta.js` ✅ |
| `gestionar-usuario.html` | `js/gestionar-usuario.js` ✅ |
| `notificaciones.html` | `js/notificaciones.js` ✅ |
| `historia-envio.html` | `js/historia-envio.js` ✅ |
| `revicion-respuesta.html` | `js/revicion-respuesta.js` ✅ |
| `encuesta-publica.html` | `js/encuesta-publica.js` ✅ |

---

## 🔧 Archivos JavaScript Modificados

### **`dashboard.js`** (Limpiado)
**Cambios:**
- ❌ Removida lógica de crear-encuesta
- ✅ Comentario indicando que la lógica está en `js/crear-encuesta.js`

---

## 🌐 Endpoints API Utilizados

### Autenticación
- `POST /login` - Login de usuario

### Encuestas
- `GET /surveys` - Obtiene encuestas del usuario
- `GET /surveys/{id}` - Obtiene detalles de una encuesta
- `POST /surveys` - Crea nueva encuesta
- `GET /surveys/{id}/responses` - Obtiene respuestas de una encuesta
- `POST /surveys/{id}/responses` - Envía respuestas

### Usuarios
- `GET /api/usuarios` - Obtiene lista de usuarios
- `GET /api/usuarios/{id}` - Obtiene datos de un usuario
- `POST /api/usuarios` - Crea nuevo usuario
- `PUT /api/usuarios/{id}` - Actualiza usuario
- `PUT /api/usuarios/{id}/password` - Cambia contraseña
- `DELETE /api/usuarios/{id}` - Elimina usuario

### Trabajadores
- `GET /api/trabajadores` - Obtiene lista de trabajadores
- `DELETE /api/trabajadores/{id}` - Elimina trabajador

### Asignaciones
- `POST /api/asignaciones` - Asigna encuesta a trabajadores

---

## 🔒 Autenticación y Seguridad

### Token Management:
```javascript
// Obtener token
const token = localStorage.getItem('userToken');

// Usar en headers
headers: {
    'Authorization': `Bearer ${token}`
}

// Datos del usuario
const userStr = localStorage.getItem('userToken');
const userData = JSON.parse(userStr);
// userData = { id_usuario, nombre, email, rol }
```

### Validaciones Implementadas:
- Email: Regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Contraseña: 8+ caracteres, mínimo 1 mayúscula, 1 número
- Teléfono: Mínimo 10 dígitos
- Sesión: Redirige a login si token no existe

---

## 📊 Estructura de Formularios

### Crear Encuesta
```javascript
{
  title: string,
  description: string,
  deadline: date,
  is_mandatory: boolean,
  questions: [
    {
      text: string,
      is_mandatory: boolean,
      type: 'texto' | 'opcion_multiple' | 'si_no',
      order: number,
      options: [{ text: string }]
    }
  ]
}
```

### Responder Encuesta
```javascript
{
  responses: [
    {
      id_pregunta: number,
      respuesta: string
    }
  ]
}
```

### Asignar Encuesta
```javascript
{
  id_encuesta: number,
  usuarios: [number],
  fecha_asignacion: date,
  generar_token_publico: boolean
}
```

### Perfil
```javascript
{
  nombre: string,
  email: string,
  telefono: string
}
```

### Cambiar Contraseña
```javascript
{
  currentPassword: string,
  newPassword: string
}
```

---

## ✨ Características Destacadas

### Reutilización de Código:
- Funciones globales en `common.js`:
  - `window.showAppNotification(message, type)`
  - `window.setButtonLoadingState(buttonId, state, label)`
  - `window.showFormError(fieldId, message)`
  - `window.clearAllFormErrors()`

### Validaciones Consistentes:
- Todas las páginas validan antes de enviar
- Errores mostrados en notificaciones
- Estados de botones (loading/normal)

### UX Mejorado:
- Modales para crear/editar usuarios
- Búsqueda dinámica de trabajadores
- Gráficos de barra con porcentajes
- Exportación a Excel
- Botones de volver a listas
- Confirmaciones de eliminación

### Manejo de Errores:
- Try-catch en todas las llamadas fetch
- Mensajes de error específicos del servidor
- Fallback a mensajes genéricos
- Validación de sesión en cada página

---

## 📋 Checklist de Completitud

| Funcionalidad | Estado |
|---|---|
| Crear encuestas | ✅ Completo |
| Responder encuestas | ✅ Completo |
| Ver perfil | ✅ Completo |
| Editar perfil | ✅ Completo |
| Cambiar contraseña | ✅ Completo |
| Ver resultados | ✅ Completo |
| Filtrar reportes | ✅ Completo |
| Exportar a Excel | ✅ Completo |
| Asignar encuestas | ✅ Completo |
| Crear usuarios | ✅ Completo |
| Editar usuarios | ✅ Completo |
| Eliminar usuarios | ✅ Completo |
| Gestionar trabajadores | ✅ Completo |


---

## 📞 Referencia Rápida

### Cargar datos iniciales
```javascript
document.addEventListener('DOMContentLoaded', function () {
    if (document.body.id !== 'page-nombre') return;
    // Lógica de la página
});
```

### Hacer llamada API
```javascript
const token = localStorage.getItem('userToken');
const response = await fetch(url, {
    method: 'GET|POST|PUT|DELETE',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
});
const result = await response.json();
```

### Mostrar notificación
```javascript
window.showAppNotification('Mensaje', 'success|error|info');
```

### Cambiar estado de botón
```javascript
window.setButtonLoadingState('button-id', true, 'Cargando...');
```

---

**Última actualización:** 2024
**Versión:** 2.0 - Completa con todas las interfaces funcionales
