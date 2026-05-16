# 🛡️ Documento de Mecanismos de Seguridad - ALPERCOL

Este documento define los estándares, protocolos y mecanismos de seguridad requeridos para proteger la integridad, confidencialidad y disponibilidad de la aplicación de gestión de encuestas ALPERCOL.

---

## 1. Autenticación y Gestión de Identidad

### 1.1. Hashing de Contraseñas
- **Mecanismo:** Uso de **Bcrypt** para el almacenamiento de contraseñas.
- **Configuración:** Cost factor (salt rounds) mínimo de 10.
- **Implementación:** Las contraseñas nunca deben guardarse en texto plano en la base de datos `usuario`.

### 1.2. Gestión de Sesiones (Tokens)
- **Mecanismo:** JSON Web Tokens (JWT).
- **Vigencia:** Los tokens deben tener un tiempo de expiración corto (ej. 24 horas máximo, idealmente menos con refresh tokens).
- **Firma:** Uso de una clave secreta (`JWT_SECRET`) compleja y almacenada en variables de entorno, nunca en el código fuente.
- **Almacenamiento Seguro:** 
  - *Actual:* `localStorage` (Vulnerable a XSS).
  - *Requerido:* Migrar a **Cookies HttpOnly** y **Secure** para prevenir el robo de tokens mediante scripts maliciosos.

### 1.3. Políticas de Contraseñas
- **Requisito:** Mínimo 8 caracteres, incluyendo al menos una mayúscula y un número.
- **Validación:** Debe realizarse tanto en el Frontend (`gestionar-usuario.js`) como en el Backend (`server.js`) antes del hash.

---

## 2. Control de Acceso (Autorización)

### 2.1. RBAC (Role-Based Access Control)
- **Roles Definidos:** Administrador, Digitador, Trabajador.
- **Middleware:** Uso estricto de `authMiddleware` en todas las rutas protegidas.
- **Validación de Propiedad:** 
  - Los usuarios solo pueden ver/editar sus propios datos o asignaciones.
  - Validación en backend para asegurar que un `id_usuario` en la URL corresponda al token del solicitante (prevención de IDOR - Insecure Direct Object References).

---

## 3. Seguridad en la Comunicación y Red

### 3.1. Encriptación en Tránsito
- **Protocolo:** **HTTPS** (TLS 1.2 o superior) obligatorio para todas las comunicaciones entre cliente y servidor.
- **Certificados:** Implementación de certificados SSL válidos.

### 3.2. CORS (Cross-Origin Resource Sharing)
- **Configuración:** Restringir el middleware `cors()` en `server.js` para aceptar peticiones únicamente de dominios de confianza (whitelisting), en lugar de permitir `*`.

---

## 4. Protección de Datos y Backend

### 4.1. Prevención de Inyección SQL
- **Mecanismo:** Uso exclusivo de **Consultas Parametrizadas** (Prepared Statements) en todas las interacciones con MySQL.
- **Implementación:** Uso de `?` como placeholder en `db.execute` (ya implementado, se debe mantener estrictamente).

### 4.2. Validación y Sanitización de Entradas
- **Entrada:** Validar tipos de datos (email, fechas, números) en el servidor usando librerías como `express-validator` o Joi.
- **Salida:** Escapar caracteres especiales al renderizar datos en el frontend para prevenir **XSS (Cross-Site Scripting)**, especialmente en títulos y descripciones de encuestas.

### 4.3. Cabeceras de Seguridad HTTP
- **Herramienta:** Implementar librería **Helmet** en Express.
- **Cabeceras Críticas:**
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY` (o SAMEORIGIN)
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy` (CSP)

### 4.4. Limitación de Tasa (Rate Limiting)
- **Objetivo:** Prevenir ataques de fuerza bruta y DDoS capa aplicación.
- **Implementación:** Usar `express-rate-limit` en rutas sensibles como `/login` y `/api/registro`.
  - *Ejemplo:* Máximo 5 intentos de login fallidos por IP cada 15 minutos.

---

## 5. Gestión de Configuración e Infraestructura

### 5.1. Variables de Entorno
- **Herramienta:** `dotenv`.
- **Práctica:** El archivo `.env` debe estar incluido en `.gitignore`.
- **Datos Sensibles:** Credenciales de BD, Secretos JWT, Puertos.

### 5.2. Manejo de Errores
- **Producción:** No exponer stack traces (trazas de error) al cliente. Devolver mensajes genéricos ("Error interno del servidor") mientras se registra el detalle en los logs del servidor.

---

## 6. Auditoría y Monitoreo

### 6.1. Logs de Seguridad
- Registrar eventos críticos:
  - Inicios de sesión exitosos y fallidos.
  - Creación/Eliminación de usuarios.
  - Asignación masiva de encuestas.
  - Errores de base de datos.

---

## Resumen de Implementación Actual vs. Requerida

| Mecanismo | Estado Actual | Acción Requerida |
| :--- | :---: | :--- |
| **JWT** | ✅ Implementado | Mover a Cookies HttpOnly. |
| **Bcrypt** | ✅ Implementado | Mantener cost factor actualizado. |
| **SQL Injection** | ✅ Protegido | Mantener uso de `?` en queries. |
| **Rate Limiting** | ❌ No existe | Instalar `express-rate-limit`. |
| **Secure Headers** | ❌ No existe | Instalar `helmet`. |
| **HTTPS** | ❌ Localhost | Configurar en despliegue/proxy inverso. |
| **Validación Input** | ⚠️ Parcial | Reforzar validación en Backend. |