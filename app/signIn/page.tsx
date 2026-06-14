'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { FaGithub, FaGoogle, FaLock, FaUserPlus } from 'react-icons/fa';

type LoginState = {
  email: string;
  password: string;
};

type RegisterState = {
  name: string;
  email: string;
  password: string;
};

type ViewMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('login');
  const [loginForm, setLoginForm] = useState<LoginState>({
    email: '',
    password: '',
  });
  const [registerForm, setRegisterForm] = useState<RegisterState>({
    name: '',
    email: '',
    password: '',
  });
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleCredentialsSignIn = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setIsLoggingIn(true);

    try {
      const result = await signIn('credentials', {
        email: loginForm.email,
        password: loginForm.password,
        callbackUrl: '/dashboard',
        redirect: false,
      });

      if (result?.ok) {
        router.push('/dashboard');
        return;
      }

      const statusResponse = await fetch(
        `/api/login-status?email=${encodeURIComponent(loginForm.email)}`,
      );
      const status = (await statusResponse.json()) as {
        locked?: boolean;
        remainingAttempts?: number;
      };

      if (status.locked) {
        setAuthError(
          'La cuenta fue bloqueada temporalmente por muchos intentos fallidos.',
        );
        return;
      }

      if (typeof status.remainingAttempts === 'number') {
        setAuthError(
          `Correo o contraseña incorrectos. Te quedan ${status.remainingAttempts} intento(s).`,
        );
        return;
      }

      setAuthError('Correo o contraseña incorrectos.');
    } catch {
      setAuthError('No se pudo iniciar sesión en este momento.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setAuthError('');
    setAuthMessage('');
    await signIn('github', {
      callbackUrl: '/dashboard',
    });
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    setAuthMessage('');
    await signIn('google', {
      callbackUrl: '/dashboard',
    });
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');
    setAuthMessage('');
    setIsRegistering(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setAuthError(payload.message ?? 'No se pudo completar el registro.');
        return;
      }

      setAuthMessage(payload.message ?? 'Usuario registrado correctamente.');
      setLoginForm({
        email: registerForm.email,
        password: '',
      });
      setView('login');
      setRegisterForm({
        name: '',
        email: '',
        password: '',
      });
    } catch {
      setAuthError('No se pudo registrar el usuario en este momento.');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#1f2937_0%,#0f172a_35%,#020617_100%)] px-4 py-10 text-white">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-cyan-300">
            NextAuth.js
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
            Acceso unificado con credenciales, GitHub y Google.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
            Registra usuarios locales con contraseña cifrada, protege el acceso
            contra intentos repetidos y permite iniciar sesión con proveedores OAuth.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              'Credenciales seguras con bcrypt',
              'Bloqueo temporal por intentos fallidos',
              'GitHub como proveedor adicional',
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6 rounded-3xl bg-white p-6 text-slate-900 shadow-2xl sm:p-8">
          <div className="grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => {
                setView('login');
                setAuthError('');
                setAuthMessage('');
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                view === 'login'
                  ? 'bg-slate-950 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setView('register');
                setAuthError('');
                setAuthMessage('');
              }}
              className={`rounded-xl px-4 py-3 text-sm font-semibold transition ${
                view === 'register'
                  ? 'bg-slate-950 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Crear cuenta
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              onClick={handleGoogleSignIn}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-medium transition hover:bg-slate-100"
            >
              <FaGoogle />
              Google
            </button>

            <button
              onClick={handleGitHubSignIn}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 font-medium text-white transition hover:bg-slate-800"
            >
              <FaGithub />
              GitHub
            </button>
          </div>

          {view === 'login' ? (
            <div className="rounded-2xl bg-slate-100 p-5">
              <h2 className="mb-4 text-xl font-semibold">Iniciar sesión</h2>
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Correo</label>
                  <input
                    type="email"
                    required
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Contraseña</label>
                  <input
                    type="password"
                    required
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaLock />
                  {isLoggingIn ? 'Validando...' : 'Entrar con credenciales'}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 p-5">
              <h2 className="mb-4 text-xl font-semibold">Registro</h2>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Nombre</label>
                  <input
                    type="text"
                    required
                    value={registerForm.name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Correo</label>
                  <input
                    type="email"
                    required
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Contraseña</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isRegistering}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-950 px-4 py-3 font-semibold text-slate-950 transition hover:bg-slate-950 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FaUserPlus />
                  {isRegistering ? 'Registrando...' : 'Crear cuenta'}
                </button>
              </form>
            </div>
          )}

          {authError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {authError}
            </div>
          )}

          {authMessage && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {authMessage}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
