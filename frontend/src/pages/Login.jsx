import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
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
      await login(form);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Unable to sign in');
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Your files, exactly where you left them.">
      <form onSubmit={submit} className="auth-form">
        <label>
          Email
          <input name="email" type="email" required value={form.email} onChange={updateField} />
        </label>
        <label>
          Password
          <input name="password" type="password" required value={form.password} onChange={updateField} />
        </label>
        {error && <p className="error">{error}</p>}
        <button className="primary-button" type="submit">Sign in <span>→</span></button>
      </form>
      <p className="auth-switch">New to Keep? <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="brand-mark">secure file storage<span>.</span></div>
        <div className="art-copy">
          <p className="eyebrow">PRIVATE BY DEFAULT</p>
          <h1>A quieter place<br />for your files.</h1>
          <p>Simple storage with the confidence that your work stays yours.</p>
        </div>
        <div className="art-stamp">EST. 2026<br /><strong>01</strong></div>
      </section>
      <section className="auth-panel">
        <div className="auth-content">
          <div className="mobile-brand">keep<span>.</span></div>
          <p className="eyebrow">YOUR PERSONAL VAULT</p>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
