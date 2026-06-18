import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signup(name, email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center font-display text-3xl text-accent">
          CINEVAULT
        </Link>
        <div className="rounded-lg border border-line bg-surface p-8">
          <h1 className="mb-6 text-xl font-semibold text-white">Create your account</h1>
          {error && (
            <p className="mb-4 rounded border border-accent/40 bg-accent-muted/40 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Name" value={name} onChange={setName} autoComplete="name" required />
            <Field label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p className="-mt-2 text-xs text-ink-faint">At least 8 characters.</p>
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded bg-accent py-2.5 font-semibold text-white transition hover:bg-accent-hover disabled:opacity-60"
            >
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>
          <p className="mt-6 text-sm text-ink-faint">
            Already have an account?{' '}
            <Link to="/login" className="text-white underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, ...rest }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink-dim">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-line bg-surface2 px-3 py-2.5 text-white outline-none focus:border-gold"
        {...rest}
      />
    </label>
  );
}
