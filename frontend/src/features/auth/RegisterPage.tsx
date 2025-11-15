import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

import { registerUser } from '../../services/auth';
import type { RegisterRequest } from '../../types/api';
import '../../styles/auth.css';

type FieldErrors = {
  display_name?: string;
  email?: string;
  password?: string;
};

type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (password.length < 8) return 'weak';
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const criteriaCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (criteriaCount <= 2) return 'weak';
  if (criteriaCount === 3) return 'medium';
  return 'strong';
};

export const RegisterPage = () => {
  const navigate = useNavigate();
  const displayNameInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<RegisterRequest>({
    email: '',
    password: '',
    display_name: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>('weak');

  useEffect(() => {
    displayNameInputRef.current?.focus();
  }, []);

  const validateDisplayName = (name: string): string | undefined => {
    if (!name) {
      return 'Display name is required';
    }
    if (name.length < 2) {
      return 'Display name must be at least 2 characters';
    }
    if (name.length > 50) {
      return 'Display name must be less than 50 characters';
    }
    return undefined;
  };

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
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return undefined;
  };

  const handleBlur = (field: keyof RegisterRequest) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'display_name') {
      const nameError = validateDisplayName(form.display_name);
      setErrors((prev) => ({ ...prev, display_name: nameError }));
    } else if (field === 'email') {
      const emailError = validateEmail(form.email);
      setErrors((prev) => ({ ...prev, email: emailError }));
    } else if (field === 'password') {
      const passwordError = validatePassword(form.password);
      setErrors((prev) => ({ ...prev, password: passwordError }));
    }
  };

  const handleChange = (field: keyof RegisterRequest, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);

    if (field === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }

    if (touched[field]) {
      if (field === 'display_name') {
        const nameError = validateDisplayName(value);
        setErrors((prev) => ({ ...prev, display_name: nameError }));
      } else if (field === 'email') {
        const emailError = validateEmail(value);
        setErrors((prev) => ({ ...prev, email: emailError }));
      } else if (field === 'password') {
        const passwordError = validatePassword(value);
        setErrors((prev) => ({ ...prev, password: passwordError }));
      }
    }
  };

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      navigate('/login', { state: { registered: true } });
    },
    onError: (err: any) => {
      console.error(err);
      const errorMessage =
        err?.response?.data?.detail || err?.response?.data?.message || 'Registration failed. Please try again with a different email.';
      setError(errorMessage);
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const nameError = validateDisplayName(form.display_name);
    const emailError = validateEmail(form.email);
    const passwordError = validatePassword(form.password);

    if (nameError || emailError || passwordError) {
      setErrors({ display_name: nameError, email: emailError, password: passwordError });
      setTouched({ display_name: true, email: true, password: true });
      return;
    }

    mutation.mutate(form);
  };

  const isFormValid = !errors.display_name && !errors.email && !errors.password && form.display_name && form.email && form.password;

  const passwordRequirements = [
    { text: 'At least 8 characters', met: form.password.length >= 8 },
    { text: 'Contains uppercase letter', met: /[A-Z]/.test(form.password) },
    { text: 'Contains lowercase letter', met: /[a-z]/.test(form.password) },
    { text: 'Contains number', met: /[0-9]/.test(form.password) },
  ];

  return (
    <div className="auth-container">
      <div className="auth-card">
        <header>
          <h1>Create your account</h1>
          <p>Start chatting with GLM 4.5 Air AI assistant.</p>
        </header>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="display_name">
              <FiUser className="auth-icon" />
              Display name
            </label>
            <input
              ref={displayNameInputRef}
              id="display_name"
              name="display_name"
              required
              placeholder="Enter your display name"
              value={form.display_name}
              onChange={(e) => handleChange('display_name', e.target.value)}
              onBlur={() => handleBlur('display_name')}
              className={touched.display_name && errors.display_name ? 'auth-input-error' : ''}
              aria-invalid={touched.display_name && !!errors.display_name}
              aria-describedby={touched.display_name && errors.display_name ? 'display_name-error' : undefined}
            />
            {touched.display_name && errors.display_name && (
              <span id="display_name-error" className="auth-field-error" role="alert">
                {errors.display_name}
              </span>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="email">
              <FiMail className="auth-icon" />
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
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
                minLength={8}
                autoComplete="new-password"
                placeholder="Create a password"
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
            {form.password && (
              <div className="auth-password-strength">
                <div className="auth-password-strength-bar">
                  <div
                    className={`auth-password-strength-fill auth-password-strength-${passwordStrength}`}
                    style={{ width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%' }}
                  />
                </div>
                <span className={`auth-password-strength-text auth-password-strength-${passwordStrength}`}>
                  {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                </span>
              </div>
            )}
            {form.password && (
              <div className="auth-password-requirements">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className={`auth-password-requirement ${req.met ? 'auth-requirement-met' : ''}`}>
                    <FiCheck className="auth-requirement-icon" />
                    <span>{req.text}</span>
                  </div>
                ))}
              </div>
            )}
            {touched.password && errors.password && (
              <span id="password-error" className="auth-field-error" role="alert">
                {errors.password}
              </span>
            )}
          </div>

          {error && (
            <div className="auth-error-message" role="alert">
              {error}
            </div>
          )}

          <button type="submit" disabled={mutation.isPending || !isFormValid} className="auth-submit-button">
            {mutation.isPending ? (
              <>
                <span className="auth-spinner"></span>
                Creating account…
              </>
            ) : (
              'Create account'
            )}
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

