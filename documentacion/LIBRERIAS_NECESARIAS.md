# 📚 CATÁLOGO DE LIBRERÍAS Y DEPENDENCIAS - ALPERCOL

Este documento detalla los recursos técnicos necesarios para el funcionamiento, seguridad y visualización de la aplicación, separados por entorno de ejecución.

---

## 🖥️ 1. BACKEND (ENTORNO DEL SERVIDOR)

Estas librerías se ejecutan bajo Node.js, se gestionan a través de **NPM** y están listadas en el archivo `package.json`.

### 1.1. Dependencias Principales (Production)
| Librería | Versión Sugerida | Propósito | Estado Actual |
| :--- | :--- | :--- | :--- |
| **express** | ^4.18.x | Framework web para manejar rutas y servidor HTTP. | ✅ Instalado |
| **mysql2** | ^3.x.x | Cliente de base de datos MySQL optimizado (soporta promesas). | ✅ Instalado |
| **bcrypt** | ^5.1.x | Hashing seguro de contraseñas. | ✅ Instalado |
| **jsonwebtoken** | ^9.0.x | Generación y validación de tokens de sesión (JWT). | ✅ Instalado |
| **cors** | ^2.8.x | Middleware para permitir peticiones entre dominios (Cross-Origin). | ✅ Instalado |
| **dotenv** | ^16.x.x | Carga de variables de entorno desde archivo `.env`. | ✅ Instalado |
| **helmet** | ^7.x.x | **Seguridad:** Configura cabeceras HTTP seguras (protección XSS, CSP, etc.). | ✅ Instalado |
| **express-rate-limit** | ^7.x.x | **Seguridad:** Limita intentos de conexión repetidos (prevención fuerza bruta). | ✅ Instalado |
| **express-validator** | ^7.x.x | **Validación:** Sanitización y validación de datos de entrada en el servidor. | ✅ Instalado |
| **multer** | ^1.4.x | (Opcional) Manejo de subida de archivos si se requiere adjuntar evidencias. | ⚠️ Opcional |

### 1.2. Dependencias de Desarrollo (DevDependencies)
| Librería | Propósito |
| :--- | :--- |
| **nodemon** | Reinicio automático del servidor al detectar cambios en el código. |

---

## 2. Frontend (Interfaz de Usuario)

Estas librerías se integran mediante CDN en los archivos HTML o se descargan localmente en la carpeta `js/libs`.

### 2.1. Visualización y UI
| Librería | Uso en el Proyecto |
| :--- | :--- |
| **Chart.js** | Generación de gráficos estadísticos para el módulo de **Reportes y Análisis** (RF-14, RF-15). |
| **SweetAlert2** | Reemplazo estético y funcional para los `alert()` nativos del navegador (Mejora UX). |
| **FontAwesome** | Iconografía para botones y menús (versión Free 6.x). |

### 2.2. Utilidades y Exportación
| Librería | Uso en el Proyecto |
| :--- | :--- |
| **jspdf** | Generación de archivos PDF desde el navegador para exportar reportes (RF-17). |
| **SheetJS (xlsx)** | Exportación de tablas de datos a formato Excel (.xlsx) (RF-17). |
| **html2canvas** | Captura de pantalla de elementos DOM para incluirlos en reportes PDF. |

---

## 3. Base de Datos e Infraestructura

| Componente | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Motor BD** | **MySQL 8.0** | Sistema de gestión de base de datos relacional. |
| **Cliente GUI** | **MySQL Workbench** / **DBeaver** | Herramientas recomendadas para administración visual de la BD. |

---

## 4. Instrucciones de Instalación

Para instalar las dependencias faltantes del backend, ejecutar en la terminal:

```bash
npm install helmet express-rate-limit express-validator
```