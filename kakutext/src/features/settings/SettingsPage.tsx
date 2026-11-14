import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, LogOut, Moon, Sun, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { KakuMascot } from '@/components/mascot/KakuMascot';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { TextField } from '@/components/ui/TextField';
import { useToast } from '@/components/ui/Toast';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';
import { profileUpdateSchema, type ProfileUpdateInput } from '@/lib/validation';
import { useAppStore, type ThemeMode } from '@/stores/useAppStore';

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const session = useAppStore((s) => s.session);
  const storeTheme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const resetOnSignOut = useAppStore((s) => s.resetOnSignOut);

  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [isSigningOut, setIsSigningOut] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      display_name: '',
      theme: storeTheme,
    },
  });

  const selectedTheme = watch('theme');

  useEffect(() => {
    if (!profile) return;
    reset({
      display_name: profile.display_name || session?.user?.email?.split('@')[0] || 'Cozy Writer',
      theme: profile.theme === 'dark' ? 'dark' : 'light',
    });
  }, [profile, session?.user?.email, reset]);

  const handleSelectTheme = (nextTheme: ThemeMode) => {
    setValue('theme', nextTheme, { shouldDirty: true });
    setTheme(nextTheme);
  };

  const onSubmit = async (values: ProfileUpdateInput) => {
    try {
      await updateProfile.mutateAsync(values);
      showToast('Settings saved!', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not save settings.', 'error');
    }
  };

  const handleSignOut = async (scope: 'local' | 'global' = 'local') => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut({ scope });
      queryClient.clear();
      resetOnSignOut();
      navigate('/login', { replace: true });
    } catch (err) {
      setIsSigningOut(false);
      showToast(err instanceof Error ? err.message : 'Sign-out failed.', 'error');
    }
  };

  return (
    <div className="min-h-dvh bg-canvas text-ink">
      <header className="border-b-[1.5px] border-ink bg-toolbar px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-pill border-[1.5px] border-ink bg-paper px-3.5 py-2 text-sm font-extrabold text-ink shadow-soft hover:bg-tab-active focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to Workspace</span>
          </Link>

          <span className="text-lg font-black tracking-tight text-ink">SETTINGS</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-paper border-[1.5px] border-ink bg-paper p-5 shadow-paper sm:p-6">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <KakuMascot mood="cheering" size="md" label="Kaku cheering your profile settings" />
            <div className="min-w-0">
              <h1 className="text-xl font-black text-ink">Profile & Preferences</h1>
              <p className="truncate text-xs font-bold text-muted">
                Signed in as {session?.user?.email ?? 'Unknown user'}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="mt-5 space-y-4">
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-5 space-y-5">
              <TextField
                label="Display name"
                placeholder="Your cozy pen name"
                maxLength={50}
                hint="1 to 50 characters, synced across your devices."
                error={errors.display_name?.message}
                {...register('display_name')}
              />

              <fieldset className="space-y-2">
                <legend className="text-sm font-extrabold text-ink">Pastel stationery theme</legend>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={selectedTheme === 'light'}
                    onClick={() => handleSelectTheme('light')}
                    className={cn(
                      'flex min-h-12 cursor-pointer items-center gap-3 rounded-card border-[1.5px] p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                      selectedTheme === 'light'
                        ? 'border-ink bg-tab-active shadow-soft'
                        : 'border-line bg-canvas/50 hover:border-ink'
                    )}
                  >
                    <Sun className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-extrabold text-ink">Light Pastel</p>
                      <p className="text-xs text-muted">Warm cream & apricot paper</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    aria-pressed={selectedTheme === 'dark'}
                    onClick={() => handleSelectTheme('dark')}
                    className={cn(
                      'flex min-h-12 cursor-pointer items-center gap-3 rounded-card border-[1.5px] p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink',
                      selectedTheme === 'dark'
                        ? 'border-ink bg-tab-active shadow-soft'
                        : 'border-line bg-canvas/50 hover:border-ink'
                    )}
                  >
                    <Moon className="h-5 w-5 shrink-0 text-ink" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-extrabold text-ink">Dark Pastel</p>
                      <p className="text-xs text-muted">Cozy twilight espresso tones</p>
                    </div>
                  </button>
                </div>
              </fieldset>

              <div className="flex justify-end pt-1">
                <Button type="submit" variant="primary" isLoading={isSubmitting}>
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                  <span>Save Preferences</span>
                </Button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-paper border-[1.5px] border-ink bg-paper p-5 shadow-paper sm:p-6">
          <h2 className="text-base font-black text-ink">Session & Security</h2>
          <p className="mt-1 text-xs text-muted">
            Sign out of this browser or revoke all active sessions across your devices.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="secondary"
              isLoading={isSigningOut}
              onClick={() => handleSignOut('local')}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out</span>
            </Button>

            <Button
              type="button"
              variant="danger"
              isLoading={isSigningOut}
              onClick={() => handleSignOut('global')}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Sign Out All Devices</span>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}