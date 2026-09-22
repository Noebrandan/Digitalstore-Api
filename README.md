# DigitalStore API

API REST para un e-commerce de productos digitales, desarrollada para el Cuarto Proyecto Integrador.

## Autor

Brandan, Noelia Agustina

## Repositorio y deploy

- Repositorio: https://github.com/Noebrandan/Digitalstore-Api
- Deploy: https://digitalstore-api-production-a5d5.up.railway.app

## Stack

- Node.js `v24.18.0` recomendado
- NestJS `11.0.1`
- TypeScript `5.7.3`
- Prisma `6.19.3`
- PostgreSQL
- pnpm
- JWT y Passport
- bcrypt
- class-validator y class-transformer
- Helmet
- @nestjs/throttler
- Jest y Supertest

## Requisitos

- Node.js `v24.18.0` recomendado
- pnpm
- PostgreSQL o una instancia PostgreSQL disponible, como Railway

## Instalacion

Clonar el repositorio e instalar las dependencias:

```bash
git clone https://github.com/Noebrandan/Digitalstore-Api.git
cd Digitalstore-Api
pnpm install
```

Crear un archivo `.env` a partir de `.env.example` y completar las variables necesarias.

Generar el cliente de Prisma:

```bash
pnpm exec prisma generate
```

Aplicar las migraciones:

```bash
pnpm exec prisma migrate deploy
```

Iniciar la aplicacion en modo desarrollo:

```bash
pnpm run start:dev
```

La API utiliza el puerto configurado en `PORT`.

## Variables de entorno

| Variable | Descripcion |
|---|---|
| `DATABASE_URL` | URL de conexion a la base de datos PostgreSQL. |
| `JWT_SECRET` | Secreto utilizado para firmar los access tokens. |
| `JWT_ACCESS_EXPIRES_IN` | Tiempo de expiracion de los access tokens, por ejemplo `15m`. |
| `JWT_REFRESH_SECRET` | Secreto utilizado para firmar los refresh tokens. |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de expiracion de los refresh tokens, por ejemplo `7d`. |
| `PORT` | Puerto donde se ejecuta la API. |
| `CORS_ORIGIN` | Origen permitido para las solicitudes CORS. |

## Autenticacion

La API utiliza dos tipos de tokens JWT:

- **Access token:** se utiliza para acceder a las rutas protegidas y tiene una duracion corta.
- **Refresh token:** permite obtener un nuevo access token y tiene una duracion mas prolongada.

Las contrasenas se almacenan utilizando bcrypt. El refresh token se guarda hasheado en la base de datos y se invalida al cerrar sesion.

Para enviar un access token se debe utilizar el header:

```http
Authorization: Bearer <access_token>
```

## Endpoints

### App

| Metodo | Ruta | Autenticacion | Rol |
|---|---|---|---|
| `GET` | `/` | No | Ninguno |

### Auth

| Metodo | Ruta | Autenticacion | Rol |
|---|---|---|---|
| `POST` | `/auth/register` | No | Ninguno |
| `POST` | `/auth/login` | No | Ninguno |
| `POST` | `/auth/refresh` | No | Ninguno |
| `POST` | `/auth/logout` | Si | Ninguno |

`/auth/register` y `/auth/login` tienen throttling especifico para limitar intentos repetidos.

### Products

| Metodo | Ruta | Autenticacion | Rol |
|---|---|---|---|
| `GET` | `/products` | No | Ninguno |
| `GET` | `/products/:id` | No | Ninguno |
| `POST` | `/products` | Si | Ninguno |
| `PATCH` | `/products/:id` | Si | Ninguno |
| `DELETE` | `/products/:id` | Si | Ninguno |

Las operaciones de modificacion verifican que el usuario sea propietario del producto o tenga permisos de administrador. La eliminacion de productos utiliza soft delete, por lo que el registro no se elimina fisicamente de la base de datos.

### Orders

| Metodo | Ruta | Autenticacion | Rol |
|---|---|---|---|
| `POST` | `/orders` | Si | Ninguno |
| `GET` | `/orders` | Si | Ninguno |
| `GET` | `/orders/:id` | Si | Ninguno |
| `PATCH` | `/orders/:id/status` | Si | `ADMIN` |

Las ordenes pertenecen al usuario que las crea. La actualizacion del estado de una orden requiere el rol `ADMIN`.

## Modelo de datos

El proyecto utiliza los siguientes modelos principales:

- **User:** usuarios registrados y sus credenciales.
- **Product:** productos digitales publicados por usuarios.
- **Order:** ordenes realizadas por usuarios.
- **OrderItem:** tabla intermedia entre ordenes y productos.

`OrderItem` guarda `unitPrice`, lo que permite conservar el precio del producto en el momento de la compra aunque posteriormente cambie.

Los estados posibles de una orden son:

- `PENDING`
- `PAID`
- `CANCELLED`
- `REFUNDED`

## Seguridad

La API incorpora:

- Validacion de datos mediante DTOs.
- Proteccion de rutas mediante JWT.
- Hashing de contrasenas con bcrypt.
- Helmet para headers de seguridad.
- CORS configurado explicitamente.
- Throttling global.
- Throttling especifico para registro e inicio de sesion.
- Control de acceso por roles en las operaciones administrativas.

## Decisiones tecnicas

### Prisma 6 en lugar de Prisma 7

Se utiliza Prisma `6.19.3` porque permite trabajar con la configuracion tradicional de `schema.prisma`, que resulta mas simple y estable para este proyecto. Prisma 7 introdujo cambios importantes en su arquitectura y configuracion que no son necesarios para cumplir los objetivos de la API.

### Access token y refresh token sin rotacion

El access token tiene una duracion corta y se utiliza para acceder a las rutas protegidas. El refresh token dura mas tiempo y permite obtener un nuevo access token cuando el anterior expira.

En este proyecto no se rota el refresh token durante el refresh. Se mantiene el mismo token hasta que expire o el usuario cierre sesion, lo que simplifica la implementacion y facilita su explicacion.

### Soft delete en Products

Los productos no se eliminan fisicamente. Al eliminarlos, se actualiza `isActive` a `false`.

Esto permite conservar el historial y evitar problemas con productos que podrian estar asociados a ordenes existentes. Los productos inactivos dejan de aparecer en las consultas publicas.

## Scripts disponibles

```bash
pnpm run start
pnpm run start:dev
pnpm run start:prod
pnpm run build
pnpm run test
pnpm run test:e2e
pnpm run test:cov
pnpm run format
pnpm run lint
pnpm run prisma:generate
pnpm run prisma:migrate
pnpm run prisma:studio
```

## Tests

Ejecutar los tests unitarios:

```bash
pnpm test
```

Ejecutar los tests end-to-end:

```bash
pnpm test:e2e
```

Los tests e2e utilizan una base de datos separada configurada mediante `.env.test`.
