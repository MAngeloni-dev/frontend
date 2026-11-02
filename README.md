# Veterinaria Cariñositos · Frontend

Interfaz del CRM veterinario desarrollada con **Next.js App Router y TypeScript** para gestionar tutores, pacientes, consultas clínicas, turnos e inventario. Consume la API REST del backend Django; PostgreSQL y las reglas de negocio se administran desde ese backend.

Proyecto integrador de Programación III, conectado con el backend de Ingeniería de Software.

> Documento basado en los componentes compartidos y en el desarrollo realizado. Contrastar los archivos y comandos con la versión actual del repositorio antes de la entrega. Las pruebas automatizadas y el despliegue público no se presentan como finalizados.

<a id="indice"></a>

## Índice

- [Repositorios y documentación](#repositorios-y-documentacion)
- [Tecnologías](#tecnologias)
- [Arquitectura y conexión con Django](#arquitectura-y-conexion-con-django)
- [Rutas principales](#rutas-principales)
- [Componentes y formularios](#componentes-y-formularios)
- [Autenticación y permisos](#autenticacion-y-permisos)
- [Tema claro y oscuro con Context API](#tema-claro-y-oscuro-con-context-api)
- [Carga de datos y manejo de estados](#carga-de-datos-y-manejo-de-estados)
- [Instalación y ejecución](#instalacion-y-ejecucion)
- [Comprobaciones y requisitos de la EFI](#comprobaciones-y-requisitos-de-la-efi)
- [Organización y despliegue](#organizacion-y-despliegue)
- [Pendientes de entrega](#pendientes-de-entrega)

[↑ Volver al índice](#indice)

<a id="repositorios-y-documentacion"></a>

## Repositorios y documentación

- [Repositorio del frontend](https://github.com/MAngeloni-dev/frontend).
- [Repositorio del backend](https://github.com/MAngeloni-dev/backend).
- [Modelo de datos del frontend](docs/modelo_datos_frontend.md): tipos, relaciones y contratos de intercambio.
- [Modelo relacional del backend](https://github.com/MAngeloni-dev/backend/blob/main/docs/modelo_datos.md): disponible cuando ese archivo se publique en la rama indicada.
- Trello: **agregar enlace del tablero**.
- Integrantes: **completar nombres**.
- Sitio público: **pendiente de desplegar y verificar**.

[↑ Volver al índice](#indice)

<a id="tecnologias"></a>

## Tecnologías

| Tecnología | Uso en el proyecto |
| --- | --- |
| Next.js App Router | Rutas, layouts, componentes de servidor y Route Handlers. |
| React + TypeScript | Componentes y contratos tipados para props, formularios y respuestas. |
| Tailwind CSS | Estilos adaptables y variantes `dark:`. |
| React Hook Form | Registro de campos, envío y estados de formulario. |
| Zod y zodResolver | Validación de entradas antes del envío y en rutas intermediarias. |
| Context API | Estado global del tema mediante `ThemeProvider` y `useTheme`. |
| Fetch | Consultas y mutaciones HTTP. |
| Docker Compose | Ejecución del frontend junto con Django y PostgreSQL. |

Las versiones efectivas se consultan en `package.json` y `package-lock.json`. `npm ci` instala las versiones fijadas en el lockfile.

[↑ Volver al índice](#indice)

<a id="arquitectura-y-conexion-con-django"></a>

## Arquitectura y conexión con Django

La interfaz combina componentes de servidor y componentes cliente:

- Los componentes de servidor consultan Django mediante `djangoGet` y leen las cookies del servidor.
- Los componentes cliente gestionan eventos, formularios y estado interactivo.
- Los formularios envían peticiones a Route Handlers de Next.js bajo `/api/`.
- Esos handlers validan entradas, leen el token desde cookies y llaman a Django con `Authorization: Bearer`.
- Django decide los permisos y valida las reglas definitivas; ocultar botones en React no reemplaza esos controles.

| Archivo o directorio | Responsabilidad |
| --- | --- |
| `src/app/layout.tsx` | Layout raíz, estilos globales, fuentes y proveedor del tema. |
| `src/app/globals.css` | Tailwind, variables de color y variante manual `dark`. |
| `src/app/(crm)/layout.tsx` | Menú y estructura compartida de la zona de gestión. |
| `src/app/(crm)/` | Pantallas de trabajo; el grupo `(crm)` no forma parte de la URL. |
| `src/app/api/` | Route Handlers que intermedian las operaciones hacia Django. |
| `src/components/` | Formularios, historial clínico y botones reutilizables. |
| `src/context/ThemeContext.tsx` | Contexto del tema claro/oscuro. |
| `src/lib/django.ts` | Consulta autenticada de servidor y manejo de 401/404. |
| `src/lib/django-list.ts` | `djangoGetAll`: recuperación de catálogos paginados. |
| `src/lib/*-schema.ts` | Esquemas Zod, tipos y conversión de formularios a payloads. |

[↑ Volver al índice](#indice)

<a id="rutas-principales"></a>

## Rutas principales

| URL | Función |
| --- | --- |
| `/login` | Inicio de sesión del equipo. |
| `/renovar-sesion` | Flujo de renovación del acceso. |
| `/dashboard` | Resumen y acceso a pacientes. |
| `/tutores` | Listado con búsqueda y paginación. |
| `/tutores/nuevo` | Alta de tutor. |
| `/tutores/[id]` | Ficha y pacientes asociados. |
| `/tutores/[id]/editar` | Edición del tutor. |
| `/tutores/[id]/pacientes/nuevo` | Alta de paciente con tutor asociado. |
| `/pacientes` | Búsqueda y filtros por especie y estado. |
| `/pacientes/[id]` | Ficha, observaciones e historia clínica según rol. |
| `/pacientes/[id]/editar` | Edición del paciente. |
| `/pacientes/[id]/consultas/nueva` | Registro de consulta clínica. |
| `/turnos` | Listado de turnos y filtros. |
| `/turnos/nuevo` | Reserva de un turno. |
| `/turnos/[id]` | Datos y acciones sobre el turno. |
| `/turnos/[id]/editar` | Edición o reprogramación de un turno abierto. |
| `/turnos/calendario` | Calendario mensual propio, sin Google Calendar. |
| `/medicamentos` | Listado y búsqueda de medicamentos. |
| `/medicamentos/nuevo` | Alta de medicamento según permisos. |
| `/medicamentos/[id]` | Ficha, existencias y lotes asociados. |
| `/medicamentos/[id]/lotes/nuevo` | Alta de lote. |
| `/lotes/[id]/movimientos/nuevo` | Registro de ingreso, retiro o ajuste. |
| `/movimientos-stock` | Historial de cambios de existencias. |
| `/inventario/alertas` | Vencidos y próximos a vencer; acceso a stock bajo. |

`[id]` representa un segmento dinámico. En la URL real se utiliza un número. Los listados guardan filtros y página en parámetros de consulta para conservar la navegación.

[↑ Volver al índice](#indice)

<a id="componentes-y-formularios"></a>

## Componentes y formularios

| Componente | Responsabilidad |
| --- | --- |
| `TutorForm` | Alta y edición del tutor. |
| `PacienteForm` | Alta y edición del animal, con razas filtradas por especie. |
| `TutorEstadoButton` | Cambio de estado del tutor según permisos. |
| `PacienteEstadoButton` | Cambio de estado del paciente según permisos. |
| `HistorialConsultas` | Últimas consultas clínicas del paciente. |
| `TurnoForm` | Reserva y edición de fechas, paciente, profesional y motivo. |
| `TurnoAcciones` | Confirmar, cancelar o marcar como atendido. |
| `MedicamentoForm` | Alta del medicamento y sus características. |
| `LoteForm` | Registro del lote y su vencimiento. |
| `MovimientoForm` | Registro de movimientos y visualización del saldo estimado. |
| `LogoutButton` | Cierre de sesión. |

Los nombres de los componentes de inventario deben contrastarse con sus imports actuales antes de la presentación.

Los formularios usan React Hook Form y Zod. Los esquemas trabajados incluyen `tutor-schema.ts`, `paciente-schema.ts` y `turno-schema.ts`, además de los esquemas de inventario. Se muestran errores por campo, estados de envío y mensajes devueltos por Django.

En `PacienteForm`, cambiar la especie borra la selección anterior de raza. El tutor se conserva al editar un paciente; la ruta de alta ya identifica al tutor responsable.

[↑ Volver al índice](#indice)

<a id="autenticacion-y-permisos"></a>

## Autenticación y permisos

El inicio de sesión consulta el backend JWT mediante `/api/auth/login`. Los tokens se guardan en cookies HttpOnly desde el servidor, no en el contexto React ni en localStorage.

- `/api/auth/refresh` solicita la renovación del acceso.
- `djangoGet` redirige a renovar sesión si hay refresh y el acceso está ausente o vencido; de lo contrario, a `/login`.
- Un 404 del recurso consultado se transforma en `notFound()`.
- Las mutaciones que contemplan renovación reintentan una sola vez después de un 401.
- Los errores de conexión o 5xx no deben provocar reintentos automáticos de escrituras que puedan duplicarse.
- Los Route Handlers de mutación verifican el origen de la petición según la implementación compartida.

| Rol | Comportamiento de la interfaz |
| --- | --- |
| Administrador | Acceso de gestión y acciones clínicas e inventario según la API. |
| Veterinario | Acceso clínico y gestión de inventario; no implica administración de roles. |
| Recepción | Gestión operativa de tutores, pacientes y turnos; inventario de consulta y sin acciones clínicas restringidas. |

`/api/usuarios/me/` devuelve la identidad y el rol. La interfaz utiliza esa respuesta para mostrar acciones; el backend vuelve a verificar los permisos en cada operación.

[↑ Volver al índice](#indice)

<a id="tema-claro-y-oscuro-con-context-api"></a>

## Tema claro y oscuro con Context API

`src/context/ThemeContext.tsx` define el contexto mediante `createContext`, lo expone mediante `ThemeProvider` y permite consumirlo con `useTheme`, que utiliza `useContext`.

El valor compartido incluye `theme` y `toggleTheme`. El proveedor guarda la preferencia de tema en localStorage, actualiza la clase `dark` del elemento HTML y establece `colorScheme`. La implementación adaptada utiliza `useSyncExternalStore` para sincronizar la preferencia del navegador sin llamar a setState directamente durante el efecto de lectura inicial.

En `globals.css`:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Cada tarjeta, tabla, campo y mensaje debe definir colores legibles con variantes `dark:`. El selector global ya funciona; la adaptación visual se está aplicando por pantalla. **Medicamentos, historial de stock y alertas de inventario están pendientes de completar en la última revisión compartida.**

[↑ Volver al índice](#indice)

<a id="carga-de-datos-y-manejo-de-estados"></a>

## Carga de datos y manejo de estados

Las pantallas con consultas dinámicas se organizan con un componente de contenido asíncrono dentro de `Suspense` y un fallback accesible. En los casos trabajados se usa `await connection()` antes de acceder a datos y valores que dependen de la petición, evitando los problemas de prerenderizado detectados durante el desarrollo.

- Carga: mensajes con `role="status"`, `aria-busy` y esqueletos visuales.
- Error: mensajes legibles; el error de negocio de Django se muestra sin asumir éxito.
- Vacío: explicación cuando una lista no tiene resultados.
- No encontrado: IDs inválidos y recursos inexistentes usan `notFound()`.
- Fechas: las pantallas de turnos muestran horarios de Argentina; los campos `datetime-local` se convierten antes del envío a Django.

La API devuelve listados con `count`, `next`, `previous` y `results`. Los catálogos completos se recuperan mediante `djangoGetAll` cuando el selector necesita todas sus opciones, sin confundir el objeto paginado con un array.

[↑ Volver al índice](#indice)

<a id="instalacion-y-ejecucion"></a>

## Instalación y ejecución

### Estructura de trabajo

Los repositorios se clonan como carpetas hermanas porque el Compose del backend utiliza el frontend vecino:

```text
EFI-veterinaria/
    backend/
    frontend/
```

### Dependencias locales

Desde la carpeta `frontend`, donde están `package.json` y `package-lock.json`:

```powershell
npm ci
```

Este comando prepara el entorno local, incluido el editor. No instala automáticamente paquetes dentro de un contenedor ya existente. Para reconstruir el servicio se utiliza Docker Compose.

### Variables de entorno

`DJANGO_API_URL` es una variable de servidor: no debe llevar el prefijo `NEXT_PUBLIC_`.

| Entorno de Next.js | Valor de ejemplo |
| --- | --- |
| Next.js ejecutado dentro de Compose | `http://backend:8000` |
| Next.js ejecutado en la PC, Django publicado en 8000 | `http://localhost:8000` |

El nombre `backend` debe coincidir con el servicio real del Compose. Crear `.env.local` si se ejecuta Next.js localmente o configurar la variable en el servicio de Compose. No versionar archivos de entorno con secretos.

### Con Docker

Desde la carpeta `backend`, donde está el archivo de Compose:

```powershell
docker compose up -d --build
docker compose ps
docker compose logs --tail=60 frontend
```

Abrir [http://localhost:3000/login](http://localhost:3000/login). Usar `localhost` de forma consistente; se detectaron problemas de recursos de desarrollo al alternarlo con `127.0.0.1`.

### Sin ejecutar Next.js en Docker

Con Django disponible y `DJANGO_API_URL` configurada, desde `frontend`:

```powershell
npm run dev
```

No iniciar simultáneamente dos servidores sobre el mismo puerto. Consultar `package.json` para confirmar los scripts disponibles.

[↑ Volver al índice](#indice)

<a id="comprobaciones-y-requisitos-de-la-efi"></a>

## Comprobaciones y requisitos de la EFI

| Punto técnico trabajado | Evidencia en el frontend |
| --- | --- |
| Rutas principales y anidadas | Árbol de `src/app/(crm)` y tabla de rutas. |
| Segmentos dinámicos | Fichas y edición de tutores, pacientes, turnos y medicamentos. |
| Componentes reutilizables | Formularios y botones compartidos. |
| Consumo de API REST | `djangoGet`, `djangoGetAll` y Route Handlers. |
| Formularios y validación | React Hook Form + Zod en altas y ediciones. |
| Estado global con Context API | `ThemeProvider` y `useTheme`. |
| Autenticación propia mediante backend | JWT de Django y cookies HttpOnly. |
| Estilos adaptables | Tailwind, layouts flex/grid y tablas con desplazamiento horizontal. |

Esta tabla sirve de mapa de evidencias; debe contrastarse con la consigna exacta de Next.js y el código actual, sin incluir requisitos correspondientes a Astro.

Para revisar scripts existentes:

```powershell
npm run
```

Si están definidos en `package.json`, ejecutar `npm run lint` y `npm run build`. Los tests automatizados requeridos para la entrega deben implementarse y ejecutarse antes de marcarlos como completos; este documento no afirma que esa suite ya exista.

Pruebas manuales a conservar: inicio/cierre/renovación de sesión; acceso con tres roles; alta y edición de tutor/paciente; selección dependiente de raza; turnos y conflictos; movimientos de stock; alertas; estados vacíos; cambio de tema y navegación con teclado.

[↑ Volver al índice](#indice)

<a id="organizacion-y-despliegue"></a>

## Organización y despliegue

Las tareas se organizan en Trello y los repositorios se sincronizan mediante Git. Adjuntar evidencias reales de ramas, commits descriptivos y pull requests; no dar por aplicado un flujo sólo por describirlo aquí.

El destino previsto es **Vercel para Next.js** y **Render para Django**. Antes de cerrar el despliegue se deben verificar `DJANGO_API_URL`, HTTPS, cookies, orígenes autorizados, acceso a la API y construcción de producción. No se proporcionó una URL pública verificada.

[↑ Volver al índice](#indice)

<a id="pendientes-de-entrega"></a>

## Pendientes de entrega

- [ ] Completar enlaces de Trello e integrantes.
- [ ] Revisar este documento contra los archivos actuales.
- [ ] Terminar los estilos claro/oscuro de inventario y sus formularios.
- [ ] Confirmar qué pantallas de internaciones se incorporarán al frontend; tener endpoints no significa tener interfaz.
- [ ] Implementar y ejecutar las pruebas automatizadas exigidas.
- [ ] Verificar lint y build con los scripts reales.
- [ ] Agregar capturas actuales sin credenciales ni tokens.
- [ ] Publicar y verificar el despliegue.

El perfil editable y las imágenes por raza se descartaron del alcance actual. El calendario implementado es propio y no depende de Google Calendar.
