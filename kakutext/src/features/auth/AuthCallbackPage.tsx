import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { supabase } from '@/lib/supabase';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function completeAuthCallback() {
      const errorDescription = searchParams.get('error_description');
      if (errorDescription) {
        if (!isCancelled) setErrorMessage(errorDescription);
        return;
      }

      const code = searchParams.get('code');
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (!isCancelled) {
            setErrorMessage(error.message || 'Verification link expired or already used.');
          }
          return;
        }
        if (!isCancelled) {
          navigate('/', { replace: true });
        }
        return;
      }

      // Fallback if detectSessionInUrl already processed the session
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        if (!isCancelled) navigate('/', { replace: true });
      } else if (!isCancelled) {
        setErrorMessage('No verification code found. Please request a fresh link.');
      }
    }

    void completeAuthCallback();

    return () => {
      isCancelled = true;
    };
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-8 text-ink">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-md space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 text-center shadow-paper sm:p-8"
      >
        <KakuMascot mood={errorMessage ? 'sleepy' : 'thinking'} size="lg" />

        {errorMessage ? (
          <>
            <h1 className="text-2xl font-black text-ink">Verification Issue</h1>
            <p className="text-sm font-bold text-danger-text">{errorMessage}</p>
            <Link
              to="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg shadow-soft transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Return to Sign In
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-ink">Preparing your desk...</h1>
            <p className="text-sm text-muted">
              Verifying your session securely. You will be redirected in a moment.
            </p>
          </>
        )}
      </div>
    </div>
  );
}