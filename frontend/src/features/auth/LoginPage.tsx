import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';

import { loginUser, useAuthActions } from '../../services/auth';
import type { LoginRequest } from '../../types/api';
import '../../styles/auth.css';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { login } = useAuthActions();

  const [form, setForm] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      login(data);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigate((location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/', {
        replace: true,
      });
    },
    onError: (err) => {
      console.error(err);
      setError('Invalid credentials. Please try again.');
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
          <h1>Pet AI Model</h1>
          <p>Sign in to continue exploring your pet assistant.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <footer>
          <span>
            Don&apos;t have an account? <Link to="/register">Create one</Link>
          </span>
        </footer>
      </div>
    </div>
  );
};

