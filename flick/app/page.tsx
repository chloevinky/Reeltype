'use client';

import { useState } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (status === 'authenticated') {
    router.push('/swipe');
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        username,
        pin,
        action: mode,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/swipe');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex flex-col">
      {/* Hero section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo and tagline */}
        <div className="text-center mb-12">
          <div className="text-7xl mb-4">🎬</div>
          <h1 className="text-4xl font-bold text-white mb-3">Flick</h1>
          <p className="text-zinc-400 text-lg max-w-xs mx-auto">
            Swipe on movies. Match with friends. Watch together.
          </p>
        </div>

        {/* Auth form */}
        <div className="w-full max-w-sm">
          <div className="bg-zinc-900/50 backdrop-blur-sm rounded-3xl p-6 border border-zinc-800/50">
            {/* Mode toggle */}
            <div className="flex bg-zinc-800/50 rounded-xl p-1 mb-6">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username input */}
              <div>
                <label htmlFor="username" className="block text-sm text-zinc-400 mb-1.5">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="yourname"
                  className="w-full px-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl border border-zinc-700 focus:border-emerald-500 transition-colors"
                  required
                  autoComplete="username"
                  maxLength={30}
                />
              </div>

              {/* PIN input */}
              <div>
                <label htmlFor="pin" className="block text-sm text-zinc-400 mb-1.5">
                  PIN (4-6 digits)
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••"
                  className="w-full px-4 py-3 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl border border-zinc-700 focus:border-emerald-500 transition-colors pin-input text-xl tracking-widest"
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                />
              </div>

              {/* Error message */}
              {error && (
                <p className="text-rose-400 text-sm text-center">{error}</p>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || username.length < 2 || pin.length < 4}
                className="w-full py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {mode === 'register' ? 'Creating account...' : 'Signing in...'}
                  </span>
                ) : (
                  mode === 'register' ? 'Create Account' : 'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Help text */}
          <p className="text-center text-zinc-500 text-sm mt-4">
            {mode === 'register'
              ? 'Choose a username and a PIN you\'ll remember'
              : 'Enter your username and PIN to continue'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-zinc-600 text-sm">
          Made for movie nights 🍿
        </p>
      </footer>
    </div>
  );
}
