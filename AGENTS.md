# Reglas de Desarrollo para el Backend (AGENTS.md)

Este documento define las directrices arquitectónicas, técnicas y de codificación específicas y obligatorias para todo desarrollo dentro del directorio **`backend/`**.

---

## 1. Pila Tecnológica del Servidor

* **Runtime:** Node.js 20 LTS nativo (Linux en Render). **Prohibido el uso de Docker.**
* **Framework:** Express.js (ES Modules `import / export`).
* **ORM:** Sequelize con dialecto PostgreSQL (`pg`, `pg-hstore`).
* **Base de Datos:** PostgreSQL 15+ en Supabase con conexión segura obligatoria (SSL `rejectUnauthorized: false`).
* **Seguridad y Cifrado:** `bcrypt` (10 rounds mínimo), `jsonwebtoken` (JWT Bearer Token), `cors`, `dotenv`.
* **Procesamiento de Archivos e IA:** `multer` (gestión de subida de archivos), OpenAI API (`gpt-4o` / `gpt-4o-mini`), DeepSeek API (`deepseek-chat`).

---

## 2. Flujo de Arquitectura de N-Capas (Estricto)

El backend sigue un flujo de datos unidireccional estricto:

$$\text{Rutas (routers)} \longrightarrow \text{Middlewares} \longrightarrow \text{Controladores} \longrightarrow \text{Servicios} \longrightarrow \text{Repositorios} \longrightarrow \text{Modelos (ORM)} \longleftrightarrow \text{PostgreSQL}$$

### Responsabilidades por Capa:

1. **`src/routers/` (`*.routes.js`):**
   * Único propósito: mapear métodos HTTP (`GET`, `POST`, `PUT`, `DELETE`) a rutas URI.
   * Asignar middlewares (`authMiddleware`, `validateDto`) y asociar la función del controlador correspondiente.
   * **Prohibido:** Contener lógica de negocio, manipulación de base de datos o llamadas a APIs externas.

2. **`src/middlewares/` (`*.middleware.js`):**
   * Validación de token JWT en encabezados (`Authorization: Bearer <token>`).
   * Validación de esquema de datos de entrada (DTOs) antes de llegar al controlador.
   * Manejador centralizado de errores (`error.middleware.js`).
   * Configuración de subida de archivos con Multer (`upload.middleware.js`).

3. **`src/controllers/` (`*Controller.js`):**
   * Extraer datos de la petición (`req.body`, `req.params`, `req.query`, `req.user`).
   * Invocar el método correspondiente de la capa `services`.
   * Retornar respuestas HTTP estandarizadas con los códigos correspondientes:
     * `200 OK` (Lectura exitosa o actualización)
     * `201 Created` (Creación de recurso)
     * `400 Bad Request` (Datos inválidos o faltantes)
     * `401 Unauthorized` (Token ausente o inválido)
     * `403 Forbidden` (Rol insuficiente)
     * `404 Not Found` (Recurso no encontrado)
     * `500 Internal Server Error` (Fallo no controlado)

4. **`src/services/` (`*Service.js`):**
   * **Único lugar donde reside la lógica de negocio.**
   * Orquestación de casos de uso (ej: ensamblar prompts, llamar a OpenAI/DeepSeek, calcular tokens, parsear JSON estricto, aplicar Taxonomía de Bloom).
   * **Nunca** importar directamente Sequelize ni ejecutar sentencias SQL. Todas las consultas deben solicitarse a la capa `repositories`.

5. **`src/repositories/` (`*Repository.js`):**
   * Aislamiento de consultas de base de datos.
   * Encapsula los métodos de los modelos de Sequelize (`findAll`, `findByPk`, `create`, `update`, `destroy`, transacciones).
   * Retorna objetos planos o instancias de modelos listas para el consumo del servicio.

6. **`src/models/` (`NombreModelo.js`):**
   * Definición de esquemas de datos Sequelize mapeados a las tablas de PostgreSQL.
   * Configuración de relaciones (`hasMany`, `belongsTo`, `belongsToMany`) centralizadas en `src/models/index.js`.

7. **`src/helpers/` y `src/config/`:**
   * Utilidades puras y desacopladas (generación/verificación de JWT, hash de passwords, formateadores de texto).
   * Conexión a la base de datos (`database.js`).

---

## 3. Convenciones de Nomenclatura y Base de Datos

* **Tablas en PostgreSQL:** Minúsculas, plural y `snake_case` (ej. `usuarios`, `evaluaciones`, `preguntas`).
* **Llaves Primarias:**
  * `id` tipo `UUID` con `defaultValue: DataTypes.UUIDV4` para entidades dinámicas.
  * `id` tipo `INTEGER` autoincremental para catálogos estáticos (`roles`, `programas_academicos`).
* **Llaves Foráneas:** Nombre de la entidad en singular seguido de `_id` (ej. `docente_id`, `asignatura_id`, `evaluacion_id`).
* **Marcas de Tiempo:** `created_at` y `updated_at` (configuradas mediante `timestamps: true` con alias en Sequelize).

---

## 4. Formato Estándar de Respuestas API REST

### Respuesta Exitosa:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación realizada con éxito"
}
```

### Respuesta de Error:
```json
{
  "success": false,
  "error": "Mensaje legible del error",
  "details": null
}
```

---

## 5. Reglas Críticas de Seguridad y Entorno

1. **Variables de Entorno:**
   * Toda credencial (`DATABASE_URL`, `JWT_SECRET`, `PORT`, `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`) debe leerse estrictamente desde `process.env`.
   * Siempre mantener actualizado el archivo `.env.example`.
2. **Sanitización de Prompts e IA:**
   * Todo texto extraído de materiales subidos por el docente debe ser limpiado y validado en tamaño antes de inyectarse en los prompts de IA para evitar inyecciones y desbordamiento de contexto.
   * Las respuestas del LLM deben ser forzadas a JSON estructurado y parseadas con bloques `try / catch` defensivos.

---

## 6. Principio DRY y Arquitectura Anti-Monolítica (Backend)

1. **Cumplimiento Estricto del Principio DRY:**
   * Prohibido duplicar lógica de validación, formateo de respuestas, manejo de errores o queries recurrentes.
   * Toda lógica común debe residir en `middlewares/` (validaciones DTO, permisos) o `helpers/` (transformadores de datos, generadores de tokens, funciones matemáticas/estadísticas).
   * Los repositorios deben centralizar las consultas complejas para no repetir lógica de Sequelize en múltiples servicios.

2. **Prohibición de Archivos Monolíticos (Responsabilidad Única):**
   * **Controladores Delgados (*Skinny Controllers*):** Un controlador solo debe orquestar la entrada y salida HTTP. Nunca debe superar ~80-100 líneas ni incluir lógica de negocio.
   * **Servicios Especializados (*Focused Services*):** Ningún archivo de servicio debe convertirse en un *God Service*. Si un caso de uso requiere múltiples pasos (ej. procesar PDF, extraer texto, generar prompt, llamar IA, validar JSON y guardar examen), cada subproceso complejo debe delegarse a módulos auxiliares dentro de `services/` (ej. `TextExtractionService.js`, `PromptBuilderService.js`, `ExamValidatorService.js`).
   * **Modelos Claros:** Cada archivo de modelo solo define un esquema de entidad y sus relaciones directas.

---

## 7. Conmutación Modular de Funcionalidades (Feature Flags / Suscripciones)

1. **Gestión Centralizada de Features (`src/config/features.js`):**
   * Cada módulo o funcionalidad no troncal (ej. Ingesta de archivos, Generación con IA, Exportación avanzada, Rúbricas formativas, Control Antifraude) debe registrarse en el gestor de características.
   * Su activación se evalúa a partir de variables de entorno (`FEATURE_*`) o del plan de suscripción del usuario.

2. **Middleware Protector (`src/middlewares/feature.middleware.js`):**
   * Aplicar `requireFeature('CLAVE_FEATURE')` en las rutas que correspondan a módulos conmutables.
   * Si la funcionalidad está apagada, se devuelve una respuesta estandarizada HTTP 403 o 402:
     ```json
     {
       "success": false,
       "error": "La funcionalidad 'CLAVE_FEATURE' no está habilitada en este entorno o plan de suscripción",
       "code": "FEATURE_DISABLED"
     }
     ```
   * Ningún controlador o servicio debe ejecutarse si la bandera está inactiva, protegiendo recursos, tokens de IA y procesamiento.

---

## 8. Política de Commits Atómicos y Frecuentes (Git)

1. **Obligatoriedad de Commits Atómicos:**
   * Se debe realizar commit ante cada avance significativo, atómico y probado (ej. nuevo endpoint, corrección de bug, migración de modelo o documentación).
   * No acumular múltiples responsabilidades en un solo commit.

2. **Convención Convencional Estricta:**
   * Formato: `<tipo>(<alcance>): <descripción>`
   * Tipos: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`, `style:`.

3. **Estructura de Repositorios Independientes:**
   * El proyecto se gestiona exclusivamente a través de dos repositorios Git independientes:
     * Backend: `https://github.com/jaimezzapata/back-proyecto-grados.git` (en `backend/`).
     * Frontend: `https://github.com/jaimezzapata/front-proyecto-grados.git` (en `frontend/`).
   * No se utiliza ni se realizan commits en el repositorio global de la raíz; todo versionamiento se ejecuta directamente dentro de cada proyecto respectivo (`backend/` o `frontend/`).



