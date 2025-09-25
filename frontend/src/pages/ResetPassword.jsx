import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function ResetPassword(){
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const token = sp.get('token') || '';

  useEffect(() => {
    if (!token) { setError('Token faltante'); }
  }, [token]);

  async function submit(e){
    e.preventDefault();
    setMsg(''); setError('');
    try{
      await api('/auth/reset', { method:'POST', body:{ token, password } });
      setMsg('Contraseña restablecida. Redirigiendo al login...');
      setTimeout(()=> navigate('/login'), 1500);
    }catch(err){ setError(err.message); }
  }

  return (
    <div className="card">
      <h2>Definir nueva contraseña</h2>
      {msg && <p>{msg}</p>}
      {error && <p style={{color:'#ff8a8a'}}>{error}</p>}
      <form onSubmit={submit}>
        <div className="row"><input type="password" placeholder="Nueva contraseña" value={password} onChange={e=>setPassword(e.target.value)} /></div>
        <div className="row"><button>Guardar</button></div>
      </form>
    </div>
  );
}
