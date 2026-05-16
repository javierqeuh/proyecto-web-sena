# Estructura Final Recomendada para la Aplicación

## 📦 Organización de Archivos

```
backend-alpercol/
├── index.html                 (Login - Página pública)
├── registro.html              (Registro - Página pública)
├── interfasz-ingreso.html     (Inicio - Página pública)
│
├── dashboard.html             (Dashboard principal)
├── perfil.html                (Perfil de usuario)
├── crear-encuesta.html        (Crear encuesta)
├── responder-encuesta.html    (Responder encuesta)
├── resultados-y-reportes.html (Ver reportes)
├── asignar-encuesta.html      (Asignar encuesta)
├── gestionar-usuario.html     (Gestionar usuarios)
├── notificaciones.html        (Notificaciones)
├── historia-envio.html        (Historial)
├── revicion-respuesta.html    (Revisar respuestas)
├── encuesta-publica.html      (Encuesta anónima)
│
├── js/
│   ├── index-login.js         (Lógica de login - AUTENTICACIÓN)
│   ├── navigation.js          (Lógica de navegación global - NAVEGACIÓN)
│   ├── main.js                (Script principal - INICIALIZACIÓN)
├── common.js                  (Funciones comunes - UTILIDADES)
├── dashboard.js               (Lógica de páginas específicas - LÓGICA)
│
├── img/
│   └── ...                    (Imágenes)
│
├── style.css                  (Estilos globales)
├── style2.css                 (Estilos del dashboard)
├── registro.css               (Estilos del registro)
├── ingresostyle.css           (Estilos del inicio)
│
├── server.js                  (Servidor Express)
├── db.js                      (Configuración de BD)
├── authMiddleware.js          (Middleware de autenticación)
├── package.json               (Dependencias)
│
├── ANALISIS_ARQUITECTURA.md   (Este documento)
└── MEJORAS_APLICADAS.md       (Mejoras realizadas)
```

---

## 🔗 Dependencias Entre Archivos

### Páginas Públicas (Sin Protección)
```
index.html
  └── js/index-login.js      (Maneja autenticación)

registro.html
  └── (Maneja registro de usuario)

interfasz-ingreso.html
  └── (Página de bienvenida)
```

### Páginas Protegidas (Requieren Token)
```
Todas las demás páginas (dashboard.html, perfil.html, etc.)
  ├── common.js              (Protección de rutas + utilidades)
  ├── navigation.js          (Navegación global)
  └── dashboard.js           (Lógica específica de la página)
```

---

## 📋 Flujo de Ejecución

### 1. Primer Acceso (Usuario No Autenticado)
```
1. User accede a http://localhost:3000
2. Servidor redirige a index.html
3. Se carga index-login.js
4. Usuario ve formulario de login
5. Usuario ingresa credenciales
6. Se valida en cliente y se envía a POST /login
7. Servidor valida credenciales
8. Si válido, se almacena token en localStorage
9. Redirección a dashboard.html
```

### 2. Acceso a Dashboard (Usuario Autenticado)
```
1. common.js verifica si hay token
   - Si NO hay token → Redirección a index.html
   - Si SÍ hay token → Continúa cargando la página
2. Se carga navigation.js (maneja navegación)
3. Se carga dashboard.js (lógica específica)
4. Página funciona completamente
```

### 3. Navegación Entre Páginas
```
1. Usuario hace click en un nav-item
2. navigation.js captura el click
3. Lee el atributo data-target
4. Redirige a la página (window.location.href)
5. En la nueva página, se repite el flujo #2
```

### 4. Logout
```
1. Usuario hace click en "Cerrar Sesión"
2. navigation.js captura el click
3. Limpia localStorage y sessionStorage
4. Muestra notificación de éxito
5. Redirección a index.html
```

---

## 🎯 Responsabilidades de Cada Archivo

### `common.js` - UTILIDADES Y SEGURIDAD
```javascript
✓ Protección de rutas (verificar token)
✓ Funciones auxiliares globales
  - showAppNotification()
  - setButtonLoadingState()
  - showFormError()
  - clearAllFormErrors()
✓ Hacer funciones globales
```

### `navigation.js` - NAVEGACIÓN GLOBAL
```javascript
✓ Manejo de clicks en nav-items
✓ Lectura de atributo data-target
✓ Redirección a URL correcta
✓ Manejo de logout
✓ Limpieza de sesión
```

### `index-login.js` - AUTENTICACIÓN
```javascript
✓ Validación de formulario
✓ Llamada a API /login
✓ Almacenamiento de token/usuario
✓ Manejo de errores
✓ Redirección a dashboard
```

### `dashboard.js` - LÓGICA ESPECÍFICA
```javascript
✓ Crear encuestas
  - Agregar/eliminar preguntas
  - Agregar/eliminar opciones
  - Envío a API /surveys
✓ Filtrar notificaciones
✓ Gestionar usuarios
✓ Asignar encuestas
```

---

## 📊 Matriz de Acceso

| Archivo | index.html | registro.html | dashboard.html | perfil.html | ... |
|---------|:----------:|:-------------:|:--------------:|:-----------:|:---:|
| common.js | ❌ | ❌ | ✅ | ✅ | ✅ |
| navigation.js | ❌ | ❌ | ✅ | ✅ | ✅ |
| index-login.js | ✅ | ❌ | ❌ | ❌ | ❌ |
| dashboard.js | ❌ | ❌ | ✅ | ✅ | ✅ |

---

## 🔒 Flujo de Seguridad

### Protección en Cliente
```javascript
// En common.js - Se ejecuta SIEMPRE
if (!publicPages.includes(currentPage)) {
    if (!localStorage.getItem('userToken')) {
        window.location.href = 'index.html';
    }
}
```

### Protección en Servidor
```javascript
// En server.js - Se ejecutaría CON middleware de autenticación
app.use('/api/protected', authMiddleware);
```

---

## 📱 Datos en localStorage

### Después del Login
```javascript
localStorage = {
  userToken: '{"id_usuario": 1, "nombre": "Juan", "email": "juan@example.com", "rol": "usuario"}',
  userRole: 'usuario',
  userName: 'Juan'
}
```

### Después del Logout
```javascript
localStorage = {} // Completamente vacío
sessionStorage = {} // Completamente vacío
```

---

## ✅ Checklist de Coherencia

- [x] Cada archivo tiene una responsabilidad clara
- [x] No hay duplicación de código
- [x] La navegación funciona correctamente
- [x] La autenticación es coherente
- [x] El logout limpia todo correctamente
- [x] La protección de rutas funciona
- [x] Las funciones auxiliares son accesibles globalmente
- [x] Los datos de BD se insertan correctamente
- [x] Los errores se manejan consistentemente
- [x] La estructura es mantenible y escalable

---

## 🚀 Cómo Usar Esta Documentación

1. **Para entender la arquitectura:** Lee `ANALISIS_ARQUITECTURA.md`
2. **Para ver qué se mejoró:** Lee `MEJORAS_APLICADAS.md`
3. **Para implementar nuevas funciones:** Sigue las responsabilidades aquí definidas
4. **Para debugging:** Usa la matriz de flujo para identificar dónde está el problema

---

## 📞 Soporte

Si necesitas:
- Agregar nueva página → Sigue el patrón de `dashboard.html`
- Agregar nueva funcionalidad → Agrega lógica en `dashboard.js`
- Agregar funciones auxiliares → Agrégate a `common.js`
- Cambiar flujo de navegación → Modifica `navigation.js`
- Cambiar lógica de login → Modifica `index-login.js`

