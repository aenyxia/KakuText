import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { loginSchema, type LoginFormValues } from '@/features/auth/authSchemas';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function LoginPage() {
  const session = useAppStore((s) => s.session);
  const authReady = useAppStore((s) => s.authReady);
  const navigate = useNavigate();
  const location = useLocation();

  const [serverError, setServerError] = useState<string | null>(null);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');

  const redirectToPath =
    (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  if (authReady && session) {
    return <Navigate to={redirectToPath} replace />;
  }

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    setMascotMood('thinking');

    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setMascotMood('sleepy');
      // Generic message prevents user enumeration
      setServerError('Invalid email or password, or email not yet confirmed.');
      return;
    }

    setMascotMood('cheering');
    navigate(redirectToPath, { replace: true });
  };

  const handleGoogleLogin = async () => {
    setServerError(null);
    setIsOAuthLoading(true);
    setMascotMood('thinking');

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setIsOAuthLoading(false);
      setMascotMood('sleepy');
      setServerError('Could not start Google sign-in. Please try again.');
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 text-ink">
      <div className="w-full max-w-md space-y-5 rounded-paper border-[1.5px] border-ink bg-paper p-6 shadow-paper sm:p-8">
        <div className="flex flex-col items-center text-center">
          <KakuMascot mood={mascotMood} size="lg" />
          <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">
            Welcome back to KakuText
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in to open your cozy rich-text stationery desk.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-card border-[1.5px] border-danger-text bg-danger/20 px-3.5 py-2.5 text-sm font-bold text-danger-text"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <div className="space-y-1.5">
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex justify-end">
              <Link
                to="/reset-password"
                className="inline-flex min-h-11 items-center text-xs font-bold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="relative flex items-center justify-center">
          <span aria-hidden="true" className="w-full border-t border-line" />
          <span className="bg-paper px-3 text-xs font-bold text-muted uppercase">or</span>
          <span aria-hidden="true" className="w-full border-t border-line" />
        </div>

        <Button
          type="button"
          variant="secondary"
          size="md"
          isLoading={isOAuthLoading}
          onClick={handleGoogleLogin}
          className="w-full"
        >
          Continue with Google
        </Button>

        <p className="text-center text-sm text-muted">
          New to KakuText?{' '}
          <Link
            to="/signup"
            className="inline-flex min-h-11 items-center font-extrabold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}