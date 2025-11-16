import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { FormEvent } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';

import { loginUser, useAuthActions, requestPasswordReset, resetPassword } from '../../services/auth';
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
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);

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

  // Password reset mutations
  const requestResetMutation = useMutation({
    mutationFn: requestPasswordReset,
    onSuccess: () => {
      setResetStep('verify');
      setError(null);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.detail || 'Failed to send reset code. Please try again.';
      setError(errorMessage);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (data: { email: string; code: string; newPassword: string }) =>
      resetPassword(data.email, data.code, data.newPassword),
    onSuccess: () => {
      setShowPasswordReset(false);
      setResetStep('request');
      setResetEmail('');
      setResetCode('');
      setNewPassword('');
      setNewPasswordConfirm('');
      setError(null);
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    },
    onError: (err: any) => {
      const errorMessage = err?.response?.data?.detail || 'Failed to reset password. Please try again.';
      setError(errorMessage);
    },
  });

  const handleRequestReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const emailError = validateEmail(resetEmail);
    if (emailError) {
      setError(emailError);
      return;
    }
    requestResetMutation.mutate(resetEmail);
  };

  const handleResetPassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!resetCode || resetCode.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setError('Passwords do not match.');
      return;
    }

    resetPasswordMutation.mutate({
      email: resetEmail,
      code: resetCode,
      newPassword: newPassword,
    });
  };

  const handleBackToLogin = () => {
    setShowPasswordReset(false);
    setResetStep('request');
    setResetEmail('');
    setResetCode('');
    setNewPassword('');
    setNewPasswordConfirm('');
    setError(null);
  };

  if (showPasswordReset) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <header>
            <h1>Reset Password</h1>
            <p>{resetStep === 'request' ? 'Enter your email to receive a reset code.' : 'Enter the code and your new password.'}</p>
          </header>

          {resetStep === 'request' ? (
            <form className="auth-form" onSubmit={handleRequestReset}>
              <div className="auth-field">
                <label htmlFor="reset-email">
                  <FiMail className="auth-icon" />
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => {
                    setResetEmail(e.target.value);
                    setError(null);
                  }}
                />
              </div>

              {error && (
                <div className="auth-error-message" role="alert">
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="auth-submit-button"
                  style={{ flex: 1, background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Back to Login
                </button>
                <button
                  type="submit"
                  disabled={requestResetMutation.isPending || !resetEmail}
                  className="auth-submit-button"
                  style={{ flex: 1 }}
                >
                  {requestResetMutation.isPending ? (
                    <>
                      <span className="auth-spinner"></span>
                      Sending…
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label htmlFor="reset-code">
                  <FiLock className="auth-icon" />
                  Verification Code
                </label>
                <input
                  id="reset-code"
                  type="text"
                  required
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setResetCode(value);
                    setError(null);
                  }}
                  maxLength={6}
                  style={{ letterSpacing: '8px', textAlign: 'center', fontFamily: 'monospace', fontSize: '18px' }}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="reset-new-password">
                  <FiLock className="auth-icon" />
                  New Password
                </label>
                <div className="auth-password-wrapper">
                  <input
                    id="reset-new-password"
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Enter new password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError(null);
                    }}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    aria-label={showResetPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showResetPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reset-password-confirm">
                  <FiLock className="auth-icon" />
                  Confirm New Password
                </label>
                <div className="auth-password-wrapper">
                  <input
                    id="reset-password-confirm"
                    type={showResetPasswordConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="Confirm new password"
                    value={newPasswordConfirm}
                    onChange={(e) => {
                      setNewPasswordConfirm(e.target.value);
                      setError(null);
                    }}
                    minLength={8}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowResetPasswordConfirm(!showResetPasswordConfirm)}
                    aria-label={showResetPasswordConfirm ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showResetPasswordConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error-message" role="alert">
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setResetStep('request');
                    setResetCode('');
                    setNewPassword('');
                    setNewPasswordConfirm('');
                    setError(null);
                  }}
                  className="auth-submit-button"
                  style={{ flex: 1, background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={
                    resetPasswordMutation.isPending ||
                    resetCode.length !== 6 ||
                    !newPassword ||
                    newPassword.length < 8 ||
                    newPassword !== newPasswordConfirm
                  }
                  className="auth-submit-button"
                  style={{ flex: 1 }}
                >
                  {resetPasswordMutation.isPending ? (
                    <>
                      <span className="auth-spinner"></span>
                      Resetting…
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          )}

          <footer>
            <span>
              Remember your password? <button type="button" onClick={handleBackToLogin} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>Sign in</button>
            </span>
          </footer>
        </div>
      </div>
    );
  }

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
          <span style={{ marginTop: '8px', display: 'block' }}>
            <button
              type="button"
              onClick={() => setShowPasswordReset(true)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', padding: 0, font: 'inherit' }}
            >
              Forgot password?
            </button>
          </span>
        </footer>
      </div>
    </div>
  );
};

