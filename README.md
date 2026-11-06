# Veterinaria Cariñositos · Frontend

Interfaz del CRM veterinario desarrollada con **Next.js App Router y TypeScript** para gestionar tutores, pacientes, consultas clínicas, turnos e inventario. Consume la API REST del backend Django; PostgreSQL y las reglas de negocio se administran desde ese backend.

Proyecto integrador de Programación III, conectado con el backend de Ingeniería de Software.

> Documento basado en los componentes compartidos y en el desarrollo realizado. Contrastar los archivos y comandos con la versión actual del repositorio antes de la entrega. El frontend fue desplegado en Vercel y el backend en Render. Se importaron 131 registros desde la base local a PostgreSQL en Render. Queda pendiente documentar la verificación completa del frontend publicado; no se afirma que exista una suite de pruebas automatizadas.

<a id="indice"></a>

## Índice

- [Repositorios y documentación](#repositorios-y-documentacion)
- [Tecnologías](#tecnologias)
- [Arquitectura y conexión con Django](#arquitectura-y-conexion-con-django)
- [Rutas principales](#rutas-principales)
- [Componentes y formularios](#componentes-y-formularios)
- [Autenticación y permisos](#autenticacion-y-permisos)
- [Tema claro y oscuro con Context API](#tema-claro-y-oscuro-con-context-api)
- [Perfil y ajustes de cuenta](#perfil-y-ajustes-de-cuenta)
- [Identidad visual](#identidad-visual)
- [Recursos estáticos y capturas](#recursos-estaticos-y-capturas)
- [Carga de datos y manejo de estados](#carga-de-datos-y-manejo-de-estados)
- [Instalación y ejecución](#instalacion-y-ejecucion)
- [Comprobaciones y requisitos de la EFI](#comprobaciones-y-requisitos-de-la-efi)
- [Organización y despliegue](#organizacion-y-despliegue)
- [Pendientes de entrega](#pendientes-de-entrega)

<a id="repositorios-y-documentacion"></a>

## Repositorios y documentación

- [Repositorio del frontend](https://github.com/MAngeloni-dev/frontend).
- [Repositorio del backend](https://github.com/MAngeloni-dev/backend).
- [Modelo de datos del frontend](docs/modelo_datos_frontend.md): tipos, relaciones y contratos de intercambio.
- [Modelo relacional del backend](https://github.com/MAngeloni-dev/backend/blob/master/docs/modelo_datos.md): disponible cuando ese archivo se publique en la rama indicada.
- Trello: **agregar enlace del tablero**.
- Integrantes: **completar nombres**.
- Frontend en Vercel: **agregar URL pública del proyecto**.
- Backend en Render: **agregar URL pública del servicio**.

Los enlaces de despliegue se completan con las direcciones reales; no incluir direcciones de conexión de PostgreSQL ni credenciales.

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
| `/mi-cuenta` | Edición de nombre, apellido y foto; cambio de contraseña. |
| `/dashboard` | Resumen y acceso a pacientes. |
| `/tutores` | Listado con búsqueda y paginación. |
| `/tutores/nuevo` | Alta de tutor. |
| `/tutores/[id]` | Ficha y pacientes asociados. |
| `/tutores/[id]/editar` | Edición del tutor. |
| `/tutores/[id]/pacientes/nuevo` | Alta de paciente con tutor asociado. |
| `/pacientes` | Búsqueda, filtros por especie y estado y botón Nuevo paciente. |
| `/pacientes/nuevo` | Selección del tutor responsable antes de completar el alta. |
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
| `MovimientoStockForm` | Registro de movimientos y visualización del saldo estimado. |
| `LogoutButton` | Cierre de sesión desde el menú de perfil. |
| `PerfilMenu` | Foto o iniciales, nombre y acceso a Mi cuenta. |
| `MiCuentaForm` | Formularios separados de perfil y contraseña. |
| `ThemeToggle` | Selector de modo claro y oscuro. |

Los componentes de inventario son `MedicamentoForm`, `LoteForm` y `MovimientoStockForm`, según los archivos compartidos.

Los formularios de gestión usan React Hook Form y Zod. El formulario de Mi cuenta usa FormData y validaciones de entrada, además de las validaciones del backend. Los esquemas trabajados incluyen `tutor-schema.ts`, `paciente-schema.ts` y `turno-schema.ts`, además de los esquemas de inventario. Se muestran errores por campo, estados de envío y mensajes devueltos por Django.

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

Se incorporaron variantes `dark:` en listados, fichas, formularios y avisos de tutores, pacientes, turnos e inventario. Se adaptaron medicamentos, lotes, registro de movimientos, historial de stock y alertas. Se conserva una comprobación visual final de las rutas menos frecuentes antes de la entrega.

[↑ Volver al índice](#indice)

<a id="perfil-y-ajustes-de-cuenta"></a>

## Perfil y ajustes de cuenta

El encabezado muestra `PerfilMenu`, con foto o iniciales, nombre, acceso a **Ajustes de mi cuenta** y `LogoutButton`. La página `/mi-cuenta` carga la identidad mediante `djangoGet` y la entrega a `MiCuentaForm`.

Se implementaron dos formularios independientes:

- **Perfil:** nombre, apellido y foto. El archivo se envía mediante FormData; no se define manualmente Content-Type porque el navegador debe incluir el límite multipart.
- **Contraseña:** contraseña actual, nueva y confirmación. Django verifica la actual, aplica sus validadores y guarda el hash mediante `set_password`. Después del éxito, la interfaz solicita cerrar sesión y redirige al login.

| Ruta de Next.js | Operación | Backend utilizado |
| --- | --- | --- |
| GET `/api/cuenta` | Consultar la cuenta | GET `/api/usuarios/me/` |
| PATCH `/api/cuenta` | Guardar nombre, apellido y foto | PATCH `/api/usuarios/me/perfil/` |
| POST `/api/cuenta` | Cambiar contraseña | POST `/api/usuarios/me/password/` |
| GET `/api/cuenta/foto` | Servir la foto del usuario autenticado | Consulta la identidad y recupera su imagen desde Django. |

Se admiten fotos JPG, PNG o WebP de hasta 5 MB. Django comprueba el archivo y limita ancho y alto a 4096 píxeles. La ruta de foto de Next.js sólo admite el directorio y formato de nombre esperados de las fotos de perfil. El navegador no utiliza la dirección interna `backend:8000`.

El email se muestra como dato de consulta. Esta pantalla no permite editar username, rol ni permisos. Django toma la cuenta desde `request.user`, sin recibir un ID de otro usuario para modificarlo.

La configuración del backend incorpora `CHECK_REVOKE_TOKEN=True` para comprobar que el token corresponda a la contraseña vigente. Al habilitarla se debe volver a iniciar sesión. Las fotos se almacenan bajo `MEDIA_ROOT` en Django; durante el desarrollo se sirven con la configuración de media y `DEBUG=True`. La persistencia y entrega de estos archivos deben configurarse para producción.

[↑ Volver al índice](#indice)

<a id="identidad-visual"></a>

## Identidad visual

- Paleta morada para el CRM y menú lateral con íconos SVG propios, sin una dependencia adicional de íconos.
- Menú con resaltado al pasar el cursor o enfocar con teclado.
- La clase `.crm-theme` redefine los tonos `--color-teal-*` con valores morados dentro del CRM, para reutilizar las clases ya existentes.
- Los errores y avisos mantienen rojo y ámbar para distinguir su función.
- El login utiliza un fondo ilustrado de Veterinaria Cariñositos con animales de compañía y tarjeta centrada. Su archivo se ubica en `public/images/login-veterinaria.png`.
- En móvil el fondo usa `cover`, de modo que puede recortar laterales; la identidad también aparece en la tarjeta.

[↑ Volver al índice](#indice)

<a id="recursos-estaticos-y-capturas"></a>

## Recursos estáticos y capturas

La carpeta `public` expone archivos por URL sin incluir la palabra public. Por ejemplo:

```text
public/images/login-veterinaria.png
```

se utiliza como `/images/login-veterinaria.png`.

El fondo del login se incluye en el repositorio. Las fotos personales se guardan en el backend y no se incorporan a `public` ni al historial de Git.

Antes de entregar, agregar capturas reales en `docs/capturas/`: login, dashboard, selección de tutor para un nuevo paciente, turnero, medicamento con sus lotes, alertas y Mi cuenta. No incluir contraseñas, tokens ni datos personales reales.

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
| Next.js desplegado en Vercel | `https://TU-BACKEND.onrender.com` |

El nombre `backend` debe coincidir con el servicio real del Compose. Crear `.env.local` si se ejecuta Next.js localmente o configurar la variable en el servicio de Compose. No versionar archivos de entorno con secretos.

### Con Docker

Desde la carpeta `backend`, donde está el archivo de Compose:

```powershell
docker compose --profile frontend up -d --build
docker compose ps
docker compose logs --tail=60 frontend
```

El servicio `frontend` es opcional en el Compose mediante `profiles: ["frontend"]`; por eso se habilita explícitamente. Sin ese perfil, el comando general levanta sólo el backend y la base de datos.

En una base nueva, ejecutar desde `backend`:

```powershell
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Asignar a la cuenta el rol operativo correspondiente desde la administración de Django. El archivo `backend/.env` debe contener `POSTGRES_PASSWORD` y `DJANGO_SECRET_KEY` con valores propios. El frontend no necesita conocer esos secretos.

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

Pruebas manuales a conservar: edición de nombre y apellido; subida y visualización de foto; rechazo de contraseña actual incorrecta; cambio de contraseña y nuevo acceso; inicio/cierre/renovación de sesión; acceso con tres roles; alta y edición de tutor/paciente; selección dependiente de raza; turnos y conflictos; movimientos de stock; alertas; estados vacíos; cambio de tema y navegación con teclado.

[↑ Volver al índice](#indice)

<a id="organizacion-y-despliegue"></a>

## Organización y despliegue

Las tareas se organizan en Trello y los repositorios se sincronizan mediante Git. Adjuntar evidencias reales de ramas, commits descriptivos y pull requests; no dar por aplicado un flujo sólo por describirlo aquí.

### Despliegue realizado

| Parte | Plataforma | Estado registrado |
| --- | --- | --- |
| Frontend Next.js | Vercel | Despliegue indicado como realizado; falta registrar la prueba funcional completa. |
| Backend Django | Render, servicio Docker | Servicio público funcionando. |
| PostgreSQL | Render | Importación completada: 131 registros desde la base local. |

El frontend y el backend se publican por separado. Vercel consulta la API pública de Render; no necesita que Docker permanezca abierto en la computadora del desarrollador.

### Configuración del frontend en Vercel

1. Subir los cambios del frontend y su lockfile a GitHub.
2. Importar el repositorio en Vercel.
3. Seleccionar **Next.js** como framework.
4. Elegir como Root Directory la carpeta que contiene `package.json`.
5. Mantener los comandos de construcción y salida detectados para Next.js.
6. Configurar `DJANGO_API_URL` en las variables de entorno del proyecto.
7. Desplegar y abrir `/login`.

Ejemplo del valor de la variable:

```dotenv
DJANGO_API_URL=https://TU-BACKEND.onrender.com
```

Reemplazar el dominio por el real, sin `/api/` ni barra final. La variable se usa en el servidor de Next.js y no lleva `NEXT_PUBLIC_`. No colocar en Vercel la contraseña de PostgreSQL ni la clave secreta de Django: pertenecen al backend.

Después de cambiar una variable de entorno en Vercel, generar un nuevo despliegue para aplicarla.

### Backend y datos

Django utiliza Gunicorn en Render mediante `sh /app/start-render.sh`. El script ejecuta `collectstatic`, aplica las migraciones y arranca el servidor en el puerto indicado por Render. WhiteNoise entrega los archivos estáticos.

Las variables principales del backend son `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False` y `DATABASE_URL`. El hostname de Render se incorpora a `ALLOWED_HOSTS` mediante la configuración compartida. Los orígenes de CORS y CSRF se autorizan según el tipo de petición; no usar comodines para resolver errores de acceso.

Los datos locales se exportaron a un JSON y se importaron en PostgreSQL remoto con `loaddata`. Los usuarios conservan los hashes de sus contraseñas. El archivo de exportación contiene información sensible y queda excluido de Git. Las bases local y remota son independientes: no se sincronizan automáticamente.

### Verificación del sitio publicado

- Iniciar sesión y consultar tutores, pacientes, turnos y medicamentos.
- Crear un registro de prueba y comprobarlo después de recargar.
- Verificar el cierre y la renovación de sesión.
- Probar permisos de cada rol y cambio de tema.
- Comprobar el flujo desde otro navegador o con Docker local apagado.
- Verificar Mi cuenta y documentar por separado la persistencia de fotos.

### Límites del alojamiento gratuito

Render puede suspender el servicio por inactividad y tardar en responder al primer acceso. Antes de una demostración, abrir el backend y esperar a que responda.

La base PostgreSQL gratuita de Render vence a los 30 días desde su creación. Registrar esa fecha y preparar una copia de seguridad antes del vencimiento.

El almacenamiento local del servicio gratuito es temporal. Las fotos de perfil no se transfieren con el JSON ni tienen persistencia garantizada en ese disco. La solución de almacenamiento permanente de fotos queda pendiente; no se presenta como resuelta.

[↑ Volver al índice](#indice)

<a id="pendientes-de-entrega"></a>

## Pendientes de entrega

- [ ] Completar enlaces de Trello e integrantes.
- [ ] Revisar este documento contra los archivos actuales.
- [x] Incorporar estilos claro/oscuro en inventario y sus formularios.
- [x] Agregar menú de perfil y pantalla Mi cuenta.
- [x] Incorporar íconos y paleta morada al CRM.
- [ ] Conservar evidencia de las pruebas de foto y cambio de contraseña.
- [ ] Revisar las pantallas en tamaños de escritorio y móvil.
- [ ] Confirmar qué pantallas de internaciones se incorporarán al frontend; tener endpoints no significa tener interfaz.
- [ ] Implementar y ejecutar las pruebas automatizadas exigidas.
- [ ] Verificar lint y build con los scripts reales.
- [ ] Agregar capturas actuales sin credenciales ni tokens.
- [x] Publicar el backend en Render.
- [x] Importar los datos locales en PostgreSQL de Render (131 registros).
- [x] Realizar el despliegue del frontend en Vercel, según lo informado.
- [ ] Completar las URL públicas y verificar los flujos del frontend publicado.
- [ ] Resolver y verificar el almacenamiento permanente de fotos de perfil.
- [ ] Registrar el vencimiento de la base gratuita y conservar una copia de seguridad.

Las imágenes por raza quedaron fuera del alcance actual. El perfil editable se incorporó posteriormente con nombre, apellido, foto y contraseña. El calendario implementado es propio y no depende de Google Calendar.


[↑ Volver al índice](#indice)
