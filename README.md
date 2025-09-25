# Turnos Médicos — Boilerplate (sin schema)

Stack: **React (Vite) + Node/Express + MySQL**. Incluye autenticación con **JWT**, roles y **recuperación de contraseña**.
Este paquete NO trae el schema SQL porque lo manejás desde tu documento / script.

## Requisitos
- Node.js 18+
- MySQL 8+ (o MariaDB compatible)

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

> Ajustá `VITE_API_URL` si tu backend corre en otro host/puerto.
