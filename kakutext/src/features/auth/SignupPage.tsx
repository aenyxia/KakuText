import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, Navigate } from 'react-router-dom';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { signupSchema, type SignupFormValues } from '@/features/auth/authSchemas';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function SignupPage() {
  const session = useAppStore((s) => s.session);
  const authReady = useAppStore((s) => s.authReady);

  const [serverError, setServerError] = useState<string | null>(null);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>('happy');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  if (authReady && session) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    setMascotMood('thinking');

    const trimmedName = values.displayName?.trim();
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: trimmedName ? { display_name: trimmedName } : undefined,
      },
    });

    if (error) {
      setMascotMood('sleepy');
      setServerError(error.message || 'Could not create your account. Please try again.');
      return;
    }

    setMascotMood('cheering');
    setSubmittedEmail(values.email);
  };

  if (submittedEmail) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 text-ink">
        <div className="w-full max-w-md space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 text-center shadow-paper sm:p-8">
          <KakuMascot mood="cheering" size="lg" label="Cheering Kaku mascot" />
          <h1 className="text-2xl font-black text-ink">Check your inbox!</h1>
          <p className="text-sm text-muted">
            We sent a confirmation link to <strong className="text-ink">{submittedEmail}</strong>.
            Click the link in your email to activate your workspace.
          </p>
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg shadow-soft transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 text-ink">
      <div className="w-full max-w-md space-y-5 rounded-paper border-[1.5px] border-ink bg-paper p-6 shadow-paper sm:p-8">
        <div className="flex flex-col items-center text-center">
          <KakuMascot mood={mascotMood} size="lg" />
          <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">
            Create your KakuText account
          </h1>
          <p className="mt-1 text-sm text-muted">
            Free, open-source stationery notes with distraction-free formatting.
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
            label="Display name (optional)"
            type="text"
            autoComplete="name"
            placeholder="Cozy Writer"
            error={errors.displayName?.message}
            {...register('displayName')}
          />

          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            hint="Use at least 8 characters (up to 72)."
            error={errors.password?.message}
            {...register('password')}
          />

          <Button type="submit" size="lg" isLoading={isSubmitting} className="w-full">
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center font-extrabold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}