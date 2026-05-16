# 📋 REQUISITOS FUNCIONALES DEL SISTEMA (ALPERCOL)

Este documento detalla los requisitos funcionales del sistema, organizados por módulos y roles de usuario.

---

## 🔐 1. Módulo de Acceso y General

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RF-01** | **Inicio de Sesión** | El sistema debe permitir a los usuarios (Administradores, Digitadores, Trabajadores) ingresar con sus credenciales (email y contraseña). |
| **RF-02** | **Registro de Usuarios** | El sistema debe permitir el registro de nuevos usuarios en la base de datos. |
| **RF-03** | **Recuperación de Contraseña** | El sistema debe permitir a los usuarios restablecer su contraseña en caso de olvido. |
| **RF-04** | **Interfaz Principal (Landing)** | El sistema debe mostrar una interfaz principal pública con información del producto e información de la empresa antes o después del login. |

---

## 📝 2. Módulo de Gestión de Encuestas (Rol: Digitador/Admin)

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RF-05** | **Crear Encuestas** | El usuario debe poder crear nuevas encuestas, definiendo título, descripción y preguntas. |
| **RF-06** | **Gestión de Preguntas** | El sistema debe permitir digitar preguntas de diferentes tipos (texto, opción múltiple, escala, etc.). |
| **RF-07** | **Edición y Eliminación** | El usuario debe poder modificar o eliminar encuestas existentes. |
| **RF-08** | **Guardado Automático (Borrador)** | El sistema debe guardar automáticamente los cambios en la encuesta (en almacenamiento local o sesión) antes de que el usuario la publique, evitando pérdida de datos. |
| **RF-09** | **Búsqueda de Encuestas** | El sistema debe permitir buscar encuestas por nombre, fecha y hora de creación. |
| **RF-10** | **Asignación de Encuestas** | El usuario debe poder asignar encuestas a trabajadores específicos o grupos de usuarios para su diligenciamiento. |

---

## 👷 3. Módulo de Respuesta (Rol: Trabajador)

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RF-11** | **Responder Encuestas** | El trabajador debe poder acceder y responder las preguntas de las encuestas que se le han asignado. |
| **RF-12** | **Visualización de Asignaciones** | El trabajador debe poder ver un listado de las encuestas pendientes y completadas. |
| **RF-13** | **Recepción de Notificaciones** | El sistema debe notificar al trabajador cuando se le ha asignado una nueva encuesta. |

---

## 📊 4. Módulo de Reportes y Análisis

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RF-14** | **Dashboard General** | El sistema debe mostrar un tablero con el conteo total de encuestas (activas, pendientes, completadas). |
| **RF-15** | **Conteo Detallado** | El sistema debe realizar el conteo de respuestas pregunta por pregunta y sumarlas para generar un reporte total. |
| **RF-16** | **Historial de Envíos** | El sistema debe generar un historial de los envíos realizados a cada usuario, detallando fecha, hora y año. |
| **RF-17** | **Exportación de Datos** | El sistema debe permitir descargar las encuestas y sus resultados en formatos de documento (PDF, Word) u hoja de cálculo (Excel/CSV). |
| **RF-18** | **Notificación de Finalización** | El sistema debe notificar (visual o por correo) cuando una encuesta ha finalizado su ciclo o se ha completado el conteo total. |

---

## 🔔 5. Notificaciones del Sistema

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RF-19** | **Alertas de Asignación** | Notificar al trabajador inmediatamente cuando se le asigna una tarea. |
| **RF-20** | **Alertas de Estado** | Notificar al administrador/digitador sobre el progreso de las encuestas. |

---

## 🛠️ Matriz de Trazabilidad (Estado Actual)

| Requisito | Estado en Código | Archivo Relacionado |
|:---|:---|:---|
| RF-01 (Login) | ✅ Implementado | `server.js` / `index-login.js` |
| RF-02 (Registro) | ✅ Implementado | `server.js` / `registro.js` |
| RF-03 (Recuperar Pass) | ❌ Pendiente | No encontrado en backend |
| RF-04 (Info Empresa) | ✅ Implementado | `index.html` |
| RF-05 (Crear) | ✅ Implementado | `crear-encuesta.js` |
| RF-06 (Tipos Pregunta) | ✅ Implementado | `crear-encuesta.js` |
| RF-07 (Eliminar) | ✅ Implementado | `gestionar-usuario.js` / `server.js` |
| RF-08 (Auto-save) | ✅ Implementado | `crear-encuesta.js` (sessionStorage) |
| RF-09 (Buscar) | ✅ Implementado | `resultados-y-reportes.js` (Filtros) |
| RF-10 (Asignar) | ✅ Implementado | `asignar-encuesta.js` |
| RF-11 (Responder) | ✅ Implementado | `responder-encuesta.js` |
| RF-12 (Ver Asignaciones)| ✅ Implementado | `notificaciones.js` |
| RF-13 (Notif. Worker) | ✅ Implementado | `notificaciones.js` |
| RF-14 (Dashboard) | ✅ Implementado | `resultados-y-reportes.js` |
| RF-15 (Conteo Pregunta)| ✅ Implementado | `resultados-y-reportes.js` |
| RF-16 (Historial) | ✅ Implementado | `historia-envio.js` |
| RF-17 (Exportar) | ⚠️ Parcial | Exporta a CSV (Excel), falta PDF/Word |
| RF-18 (Notif. Fin) | ⚠️ Parcial | Lógica en dashboard, falta alerta específica |

---

**Convenciones:**
- ✅ **Implementado:** La funcionalidad existe en el código actual.
- ⚠️ **Parcial:** Existe una implementación base pero difiere ligeramente del requisito (ej. formato de exportación).
- ❌ **Pendiente:** No se encontró lógica asociada en los archivos actuales.