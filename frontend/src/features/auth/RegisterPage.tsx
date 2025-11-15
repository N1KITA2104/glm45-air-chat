import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { FormEvent } from 'react';

import { registerUser } from '../../services/auth';
import type { RegisterRequest } from '../../types/api';
import '../../styles/auth.css';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterRequest>({
    email: '',
    password: '',
    display_name: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/login');
    },
    onError: (err) => {
      console.error(err);
      setError('Registration failed. Please try again with a different email.');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    mutation.mutate(form);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header>
          <h1>Create your account</h1>
          <p>Start chatting with GLM 4.5 Air about your pets.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="display_name">Display name</label>
          <input
            id="display_name"
            name="display_name"
            required
            value={form.display_name}
            onChange={(event) => setForm({ ...form, display_name: event.target.value })}
          />

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        <footer>
          <span>
            Already have an account? <Link to="/login">Sign in</Link>
          </span>
        </footer>
      </div>
    </div>
  );
};

