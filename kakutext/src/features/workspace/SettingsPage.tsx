import { useState } from 'react';
import { LogOut, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/useAppStore';

export function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const session = useAppStore((s) => s.session);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async (scope: 'local' | 'global') => {
    setIsSigningOut(true);
    const { error } = await supabase.auth.signOut({ scope });
    setIsSigningOut(false);

    if (error) {
      showToast('Could not sign out. Please try again.', 'error');
      return;
    }

    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-dvh bg-canvas px-4 py-8 text-ink">
      <div className="mx-auto max-w-lg space-y-5 rounded-paper border-[1.5px] border-ink bg-paper p-6 shadow-paper">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-2xl font-black text-ink">Preferences &amp; Profile</h1>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center rounded-pill border-[1.5px] border-ink bg-toolbar px-4 py-2 text-sm font-bold text-ink shadow-soft hover:bg-tab-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Back
          </Link>
        </div>

        <p className="text-xs font-bold text-muted">
          Signed in as <span className="text-ink">{session?.user.email ?? 'Unknown user'}</span>
        </p>

        <TextField
          label="Display name"
          defaultValue={session?.user.email?.split('@')[0] ?? 'Cozy Writer'}
        />

        <div className="flex items-center justify-between rounded-card border-[1.5px] border-ink bg-toolbar/60 p-3.5">
          <div>
            <p className="text-sm font-extrabold text-ink">Pastel Theme Mode</p>
            <p className="text-xs text-muted">Current: {theme === 'light' ? 'Light' : 'Dark'}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={toggleTheme}>
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span>Switch to {theme === 'light' ? 'Dark' : 'Light'}</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <Button
            variant="secondary"
            size="sm"
            isLoading={isSigningOut}
            onClick={() => handleSignOut('local')}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>Sign Out</span>
          </Button>

          <Button
            variant="danger"
            size="sm"
            isLoading={isSigningOut}
            onClick={() => handleSignOut('global')}
          >
            <span>Sign Out Everywhere</span>
          </Button>
        </div>
      </div>
    </div>
  );
}