# Turnos Médicos — Boilerplate (sin schema)

Stack: **React (Vite) + Node/Express + MySQL**. Incluye autenticación con **JWT**, roles y **recuperación de contraseña**.

## Requisitos
- Node.js 18+
- MySQL 8+ 

## 1) Base de datos
Importá tu esquema en la base `turnos_db` asegurando:
- Tabla `usuarios(id, dni, email, hash_contrasena, nombre, apellido, rol, email_verificado, creado)`
- Tabla `password_resets(id, user_id, token, expires_at, creado)` con FK a `usuarios(id)`

## 2) Backend
```bash
cd backend
cp .env.example .env
# editá .env con tus credenciales MySQL
npm i
npm run dev
# API: http://localhost:4000/api
```

Endpoints:
- `POST /api/auth/register` { nombre, apellido, email, password, role?, dni? }
- `POST /api/auth/login` { email, password }
- `GET /api/auth/me`  (Bearer token)
- `POST /api/auth/forgot` { email }   (usa header `x-origin` para construir URL de reset)
- `POST /api/auth/reset` { token, password }

## 3) Frontend
```bash
cd frontend
cp .env.example .env
npm i
npm run dev
# App: http://localhost:5173
```

## LOGUEARSE COMO ADMIN

mail: admin@turnos.local
contraseña: Clave123!

## LOGUEARSE COMO MEDICO

mail: cualquier mail de medico que se encuentre en schema.sql, por ej: sofia.paredes@cardio.local
contraseña: Clave123!

## COMANDO PARA USAR CON DOCKER
Abrir terminal o CMD en la carpeta raíz del proyecto (donde se encuentra el archivo `docker-compose.yml`) y ejecutar:
```bash
docker compose up --build -d
```
Esto levantará los contenedores para el backend, frontend y la base de datos MySQL.
Luego, podés acceder a la aplicación en `http://localhost:5173`.


