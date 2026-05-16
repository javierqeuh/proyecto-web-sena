# 🛡️ REQUISITOS NO FUNCIONALES DEL SISTEMA (ALPERCOL)

Este documento detalla los requisitos no funcionales (atributos de calidad) que el sistema debe cumplir para asegurar su efectividad, seguridad y mantenibilidad.

---

## 🔒 1. Seguridad

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RNF-01** | **Encriptación de Contraseñas** | Las contraseñas de los usuarios deben almacenarse en la base de datos utilizando algoritmos de hashing robustos (ej. Bcrypt). |
| **RNF-02** | **Autenticación Segura** | El sistema debe utilizar tokens de sesión (JWT) con tiempo de expiración para validar la identidad de los usuarios en cada petición. |
| **RNF-03** | **Protección de Datos en Tránsito** | Toda la comunicación entre el cliente y el servidor debe realizarse sobre protocolo HTTPS (en producción). |
| **RNF-04** | **Validación de Entradas** | El sistema debe validar y sanitizar todas las entradas de datos (formularios, parámetros URL) para prevenir inyecciones SQL y ataques XSS. |
| **RNF-05** | **Control de Acceso** | Los recursos de la API deben estar protegidos para que solo usuarios con el rol adecuado (Admin, Digitador, Trabajador) puedan acceder a ellos. |

---

## 🚀 2. Rendimiento y Eficiencia

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RNF-06** | **Tiempo de Respuesta** | El tiempo de respuesta del servidor para operaciones de lectura no debe exceder los 2 segundos bajo carga normal. |
| **RNF-07** | **Concurrencia** | El sistema debe soportar múltiples usuarios conectados simultáneamente sin degradación significativa del servicio. |
| **RNF-08** | **Optimización de Consultas** | Las consultas a la base de datos deben estar optimizadas e indexadas para evitar cuellos de botella. |

---

## 📱 3. Usabilidad y Experiencia de Usuario

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RNF-09** | **Diseño Responsivo** | La interfaz debe adaptarse correctamente a diferentes tamaños de pantalla (móviles, tablets, escritorio). |
| **RNF-10** | **Interfaz Intuitiva** | La navegación debe ser clara y consistente, permitiendo a los usuarios realizar tareas comunes con un mínimo de clics. |
| **RNF-11** | **Feedback al Usuario** | El sistema debe proporcionar retroalimentación visual inmediata ante acciones del usuario (ej. mensajes de éxito, error, carga). |

---

## ⚙️ 4. Mantenibilidad y Escalabilidad

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RNF-12** | **Arquitectura Modular** | El código debe estar organizado en módulos (controladores, rutas, modelos) para facilitar su mantenimiento y escalabilidad. |
| **RNF-13** | **Documentación Técnica** | El código fuente debe estar comentado y existir documentación sobre la API y la configuración del entorno. |
| **RNF-14** | **Estándares de Código** | El desarrollo debe seguir convenciones de codificación estándar para JavaScript/Node.js. |

---

## 🌐 5. Compatibilidad

| ID | Requisito | Descripción |
|:---|:---|:---|
| **RNF-15** | **Navegadores Soportados** | La aplicación debe ser funcional en las versiones recientes de los navegadores más populares (Chrome, Firefox, Edge, Safari). |
| **RNF-16** | **Independencia de Plataforma** | El backend debe poder ejecutarse en cualquier sistema operativo que soporte Node.js (Windows, Linux, macOS). |