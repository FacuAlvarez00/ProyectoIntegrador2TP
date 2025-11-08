import React, { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Especialidades(){
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState(null);
  const token = localStorage.getItem('token');

  async function load(){
    const data = await api(`/especialidades?search=${encodeURIComponent(search)}`, { token });
    setItems(data);
  }
  useEffect(() => { load(); }, []);

  async function crear(e){
    e.preventDefault();
    await api('/especialidades', { method:'POST', token, body:{ nombre } });
    setNombre('');
    await load();
  }
  async function actualizar(e){
    e.preventDefault();
    await api(`/especialidades/${editId}`, { method:'PUT', token, body:{ nombre } });
    setEditId(null); setNombre('');
    await load();
  }
  async function eliminar(id){
    if (!confirm('¿Eliminar especialidad?')) return;
    await api(`/especialidades/${id}`, { method:'DELETE', token });
    await load();
  }
  function editar(item){
    setEditId(item.id);
    setNombre(item.nombre);
  }
  async function buscar(e){
    e.preventDefault();
    await load();
  }

  return (
    <div className="container mt-3">
      <h2>ABM de Especialidades</h2>

      <form className="row g-2 mb-3" onSubmit={buscar}>
        <div className="col-auto">
          <input className="form-control" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="col-auto">
          <button className="btn btn-secondary">Buscar</button>
        </div>
      </form>

      <form className="row g-2 mb-3" onSubmit={editId ? actualizar : crear}>
        <div className="col-auto">
          <input className="form-control" placeholder="Nombre de especialidad" value={nombre} onChange={e=>setNombre(e.target.value)} required/>
        </div>
        <div className="col-auto">
          {editId ? (
            <>
              <button className="btn btn-primary" type="submit">Guardar</button>
              <button className="btn btn-outline-secondary ms-2" type="button" onClick={()=>{setEditId(null); setNombre('')}}>Cancelar</button>
            </>
          ) : (
            <button className="btn btn-success" type="submit">Crear</button>
          )}
        </div>
      </form>

      <table className="table table-striped">
        <thead><tr><th>#</th><th>Nombre</th><th>Acciones</th></tr></thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id}>
              <td>{it.id}</td>
              <td>{it.nombre}</td>
              <td>
                <button className="btn btn-sm btn-outline-primary me-2" onClick={()=>editar(it)}>Editar</button>
                <button className="btn btn-sm btn-outline-danger" onClick={()=>eliminar(it.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
