import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import {
  recoverRequestSchema,
  updatePasswordSchema,
  type RecoverRequestValues,
  type UpdatePasswordValues,
} from '@/features/auth/authSchemas';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function ResetPasswordPage() {
  const session = useAppStore((s) => s.session);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isRecoveryMode, setIsRecoveryMode] = useState<boolean>(() =>
    Boolean(searchParams.get('code'))
  );
  const [requestSent, setRequestSent] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [mascotMood, setMascotMood] = useState<MascotMood>('thinking');

  // Exchange recovery code or listen for PASSWORD_RECOVERY event
  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      supabase.auth
        .exchangeCodeForSession(code)
        .then(({ error }) => {
          if (error) {
            setServerError('Recovery link expired or invalid. Please request a new one.');
            setIsRecoveryMode(false);
            setMascotMood('sleepy');
          } else {
            setIsRecoveryMode(true);
            setMascotMood('happy');
          }
        })
        .catch(() => {
          setServerError('Could not verify recovery link.');
          setIsRecoveryMode(false);
        });
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
        setMascotMood('happy');
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  const requestForm = useForm<RecoverRequestValues>({
    resolver: zodResolver(recoverRequestSchema),
    defaultValues: { email: '' },
  });

  const updateForm = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const handleRequestSubmit = async (values: RecoverRequestValues) => {
    setServerError(null);
    setMascotMood('thinking');

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setMascotMood('sleepy');
      setServerError('Could not send recovery email right now. Please try again shortly.');
      return;
    }

    setMascotMood('cheering');
    setRequestSent(true);
  };

  const handleUpdateSubmit = async (values: UpdatePasswordValues) => {
    setServerError(null);
    setMascotMood('thinking');

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    if (error) {
      setMascotMood('sleepy');
      setServerError(error.message || 'Could not update password. Please try again.');
      return;
    }

    setMascotMood('cheering');
    showToast('Password updated! Welcome back.', 'success');
    navigate('/', { replace: true });
  };

  const showNewPasswordPhase = isRecoveryMode || Boolean(session);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 text-ink">
      <div className="w-full max-w-md space-y-5 rounded-paper border-[1.5px] border-ink bg-paper p-6 shadow-paper sm:p-8">
        <div className="flex flex-col items-center text-center">
          <KakuMascot mood={mascotMood} size="lg" />
          <h1 className="mt-2 text-2xl font-black tracking-tight text-ink">
            {showNewPasswordPhase ? 'Set a New Password' : 'Reset Your Password'}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {showNewPasswordPhase
              ? 'Choose a strong new password (8–72 characters) for your account.'
              : 'Enter your email address and we will send you a password recovery link.'}
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

        {showNewPasswordPhase ? (
          <form
            onSubmit={updateForm.handleSubmit(handleUpdateSubmit)}
            noValidate
            className="space-y-4"
          >
            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              error={updateForm.formState.errors.password?.message}
              {...updateForm.register('password')}
            />

            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              placeholder="Repeat your new password"
              error={updateForm.formState.errors.confirmPassword?.message}
              {...updateForm.register('confirmPassword')}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={updateForm.formState.isSubmitting}
              className="w-full"
            >
              {updateForm.formState.isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        ) : requestSent ? (
          <div
            role="status"
            aria-live="polite"
            className="space-y-4 rounded-card border border-dashed border-(--border-dashed) bg-canvas/80 p-4 text-center"
          >
            <p className="text-sm font-bold text-ink">
              If an account exists for that email, a password reset link is on its way.
            </p>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg shadow-soft transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form
            onSubmit={requestForm.handleSubmit(handleRequestSubmit)}
            noValidate
            className="space-y-4"
          >
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={requestForm.formState.errors.email?.message}
              {...requestForm.register('email')}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={requestForm.formState.isSubmitting}
              className="w-full"
            >
              {requestForm.formState.isSubmitting ? 'Sending link...' : 'Send Reset Link'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center font-extrabold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}