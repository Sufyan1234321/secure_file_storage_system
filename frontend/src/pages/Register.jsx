import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from './Login';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  function updateField(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setError('');

    try {
      await register(form);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to create account');
    }
  }

  return (
    <AuthLayout title="Make room for what matters" subtitle="Start with a secure, personal file space.">
      <form onSubmit={submit} className="auth-form">
        <label>
          Your name
          <input name="name" required value={form.name} onChange={updateField} />
        </label>
        <label>
          Email
          <input name="email" type="email" required value={form.email} onChange={updateField} />
        </label>
        <label>
          Password
          <input name="password" type="password" minLength="8" required value={form.password} onChange={updateField} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary-button" type="submit">Create vault <span>→</span></button>
      </form>
      <p className="auth-switch">Already have a vault? <Link to="/login">Sign in</Link></p>
    </AuthLayout>
  );
}
