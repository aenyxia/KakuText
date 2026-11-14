import { Link } from 'react-router-dom';
import { KakuMascot, type MascotMood } from '@/components/mascot/KakuMascot';

interface AuthShellProps {
  title: string;
  subtitle: string;
  mood: MascotMood;
}

function AuthRouteCard({ title, subtitle, mood }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas p-4 text-ink">
      <div className="w-full max-w-md space-y-4 rounded-paper border-[1.5px] border-ink bg-paper p-6 text-center shadow-paper">
        <KakuMascot mood={mood} size="lg" label={`Kaku mascot (${mood})`} />
        <h1 className="text-2xl font-black text-ink">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-pill border-[1.5px] border-ink bg-accent px-5 py-2.5 text-sm font-bold text-accent-fg shadow-soft transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Return to Workspace
        </Link>
      </div>
    </div>
  );
}

export function LoginPage() {
  return (
    <AuthRouteCard
      title="Welcome Back to KakuText"
      subtitle="Email/password & PKCE login form will be wired here in MOD-004."
      mood="happy"
    />
  );
}

export function SignupPage() {
  return (
    <AuthRouteCard
      title="Create Your Cozy Account"
      subtitle="Registration with email confirmation will be wired here in MOD-004."
      mood="cheering"
    />
  );
}

export function AuthCallbackPage() {
  return (
    <AuthRouteCard
      title="Completing Sign-In..."
      subtitle="PKCE OAuth & email verification token exchange runs on this route."
      mood="thinking"
    />
  );
}

export function ResetPasswordPage() {
  return (
    <AuthRouteCard
      title="Reset Password"
      subtitle="Two-phase recovery request and password update form lives here."
      mood="thinking"
    />
  );
}