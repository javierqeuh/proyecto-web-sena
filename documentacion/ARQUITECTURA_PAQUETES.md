# 🏗️ Arquitectura de Paquetes y Modularización - ALPERCOL

## ¿Qué significa "dividir el código en paquetes"?

Esta recomendación se refiere al principio de ingeniería de software conocido como **Separación de Responsabilidades (Separation of Concerns)**. En lugar de tener un único archivo gigante (como el actual `server.js`) que hace todo, se organiza el código en carpetas (paquetes) donde cada una tiene una función específica y clara.

En el contexto de Node.js y Express, esto implica mover la lógica desde el archivo principal hacia módulos separados.

---

## 1. Estructura de Directorios Propuesta

Para cumplir con este requerimiento, el proyecto ALPERCOL debe migrar de una estructura monolítica a una estructura modular MVC (Modelo-Vista-Controlador) adaptada a API REST:

```text
backend-alpercol/
├── config/             # ⚙️ Configuración de base de datos y variables de entorno
│   ├── db.js
│   └── config.js
├── controllers/        # 🧠 Lógica de negocio (lo que hace la app)
│   ├── authController.js
│   ├── encuestaController.js
│   ├── usuarioController.js
│   └── reporteController.js
├── routes/             # 🛣️ Definición de rutas (endpoints)
│   ├── authRoutes.js
│   ├── encuestaRoutes.js
│   ├── usuarioRoutes.js
│   └── index.js
├── middlewares/        # 🛡️ Intermediarios (seguridad, validación)
│   ├── authMiddleware.js
│   └── validationMiddleware.js
├── models/             # 🗄️ Acceso a datos (Consultas SQL)
│   ├── Usuario.js
│   ├── Encuesta.js
│   └── Respuesta.js
├── utils/              # 🛠️ Funciones auxiliares reutilizables
│   └── helpers.js
├── server.js           # 🚀 Punto de entrada (solo configuración inicial)
└── package.json
```

---

## 2. Descripción de los Paquetes (Módulos)

### 2.1. `routes/` (Rutas)
**Responsabilidad:** Definir los endpoints (URLs) de la API y asignar qué controlador debe manejar cada petición.
- **Ejemplo:** `router.post('/login', authController.login);`
- **Beneficio:** Permite ver rápidamente qué URLs están disponibles sin ver la lógica compleja.

### 2.2. `controllers/` (Controladores)
**Responsabilidad:** Contiene la lógica principal. Recibe la petición (`req`), procesa los datos, llama al modelo y devuelve la respuesta (`res`).
- **Ejemplo:** La función que valida el email, encripta la contraseña y genera el token JWT.
- **Beneficio:** Mantiene el código ordenado y facilita las pruebas unitarias.

### 2.3. `models/` (Modelos)
**Responsabilidad:** Interactuar directamente con la base de datos. Contiene las consultas SQL (`SELECT`, `INSERT`, etc.).
- **Ejemplo:** `Usuario.findByEmail(email)`
- **Beneficio:** Si cambia la base de datos, solo se modifica esta carpeta, no toda la aplicación.

### 2.4. `middlewares/` (Intermediarios)
**Responsabilidad:** Funciones que se ejecutan antes de llegar al controlador.
- **Ejemplo:** Verificar si el token JWT es válido (`authMiddleware`) o si los datos enviados están completos.

### 2.5. `config/` (Configuración)
**Responsabilidad:** Archivos de configuración global.
- **Ejemplo:** Conexión a MySQL (`db.js`), claves secretas, puertos.

---

## 3. Ventajas de esta Arquitectura

1.  **Mantenibilidad:** Es más fácil encontrar y arreglar errores cuando sabes exactamente en qué carpeta buscar.
2.  **Escalabilidad:** Permite agregar nuevas funcionalidades (módulos) sin romper el código existente.
3.  **Colaboración:** Varios desarrolladores pueden trabajar en diferentes archivos al mismo tiempo sin generar conflictos.
4.  **Legibilidad:** Los nombres de las carpetas explican por sí mismos qué contiene el código.

---

## 4. Ejemplo de Refactorización

**Antes (`server.js`):**
```javascript
app.post('/login', async (req, res) => {
  // ... 50 líneas de código con validación, consulta SQL y respuesta ...
});
```

**Después:**

*Archivo `routes/authRoutes.js`:*
```javascript
router.post('/login', authController.login);
```

*Archivo `controllers/authController.js`:*
```javascript
exports.login = async (req, res) => {
  // ... Lógica de login ...
};
```