import * as service from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const { nombre, apellido, email, password, role = 'PACIENTE', dni } = req.body;
    const data = await service.register({ nombre, apellido, email, password, role, dni });
    res.status(201).json(data);
  } catch (e) { next(e); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const data = await service.login({ email, password });
    res.json(data);
  } catch (e) { next(e); }
}

export async function me(req, res) {
  res.json({ user: req.user });
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    await service.forgotPassword(email, req.headers['x-origin'] || '');
    res.json({ message: 'Si el email existe, se envió un enlace de recuperación.' });
  } catch (e) { next(e); }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    await service.resetPassword(token, password);
    res.json({ message: 'Contraseña restablecida' });
  } catch (e) { next(e); }
}
