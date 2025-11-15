import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

import { loginUser, useAuthActions } from '../../services/auth';
import type { LoginRequest } from '../../types/api';
import '../../styles/auth.css';

type FieldErrors = {
  email?: string;
  password?: string;
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { login } = useAuthActions();
  const emailInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<LoginRequest>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    emailInputRef.current?.focus();
    if ((location.state as { registered?: boolean })?.registered) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const validateEmail = (email: string): string | undefined => {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  };

  const validatePassword = (password: string): string | undefined => {
    if (!password) {
      return 'Password is required';
    }
    return undefined;
  };

  const handleBlur = (field: keyof LoginRequest) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') {
      const emailError = validateEmail(form.email);
      setErrors((prev) => ({ ...prev, email: emailError }));
    } else if (field === 'password') {
      const passwordError = validatePassword(form.password);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  const handleChange = (field: keyof LoginRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);

    if (touched[field]) {
      if (field === 'email') {
        const emailError = validateEmail(value);
        setErrors((prev) => ({ ...prev, email: emailError }));
      } else if (field === 'password') {
        const passwordError = validatePassword(value);
        setErrors((prev) => ({ ...prev, password: passwordError }));
      }
    }
  };

  const mutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      login(data);
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigate((location.state as { from?: { pathname?: string } })?.from?.pathname ?? '/', {
        replace: true,
      });
    },
    onError: (err: any) => {
      console.error(err);
      const errorMessage =
        err?.response?.data?.detail || err?.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(errorMessage);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      return;
    }

    mutation.mutate(form);
  };

  const isFormValid = !errors.email && !errors.password && form.email && form.password;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header>
          <h1>AI Chat Platform</h1>
          <p>Sign in to continue chatting with AI assistant.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">
              <FiMail className="auth-icon" />
              Email
            </label>
            <input
              ref={emailInputRef}
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={touched.email && errors.email ? 'auth-input-error' : ''}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
            />
            {touched.email && errors.email && (
              <span id="email-error" className="auth-field-error" role="alert">
                {errors.email}
              </span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="password">
              <FiLock className="auth-icon" />
              Password
            </label>
            <div className="auth-password-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                onBlur={() => handleBlur('password')}
                className={touched.password && errors.password ? 'auth-input-error' : ''}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {touched.password && errors.password && (
              <span id="password-error" className="auth-field-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {showSuccessMessage && (
            <div className="auth-success-message" role="alert">
              <FiCheckCircle />
              Account created successfully! Please sign in.
            </div>
          )}

          {error && (
            <div className="auth-error-message" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending || !isFormValid} className="auth-submit-button">
            {mutation.isPending ? (
              <>
                <span className="auth-spinner"></span>
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
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

