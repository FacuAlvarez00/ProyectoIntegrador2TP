import * as service from '../services/users.service.js';

export async function getAllUsers(req, res, next) {
    try {
        const users = await service.getAllUsers();
        res.json(users);
    } catch (e) {
        next(e);
    }
}

export async function createAdmin(req, res, next) {
    try {
        const { nombre, apellido, email, password, dni } = req.body;
        const user = await service.createAdmin({ nombre, apellido, email, password, dni });
        res.status(201).json(user);
    } catch (e) {
        next(e);
    }
}

export async function updateUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await service.updateUserRole(parseInt(id, 10), role);
        res.json(user);
    } catch (e) {
        next(e);
    }
}

export async function updateUser(req, res, next) {
    try {
        const { id } = req.params;
        const { nombre, apellido, email, dni, password } = req.body;
        const user = await service.updateUser(parseInt(id, 10), { nombre, apellido, email, dni, password });
        res.json(user);
    } catch (e) {
        next(e);
    }
}

export async function toggleStatus(req, res, next) {
    try {
        const { id } = req.params;
        const result = await service.toggleUserStatus(parseInt(id, 10));
        res.json(result);
    } catch (e) {
        next(e);
    }
}

