
import React, { useState } from 'react';
import { Hexagon, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Basic Validation Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(email);
  const isFormValid = isEmailValid && password.trim().length > 0;

  const handleGithubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      });
      if (error) throw error;
      // OAuth redirect handles the rest
    } catch (err: any) {
      setError(err.message || 'GitHub auth failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setError(null);

    try {
        if (isRegistering) {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            if (data.session) {
                onLoginSuccess(data.session.access_token);
            } else {
                // If email confirmation is enabled, session might be null
                 setError("Please check your email for confirmation link.");
            }
        } else {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            if (data.session) {
                onLoginSuccess(data.session.access_token);
            }
        }
    } catch (err: any) {
        setError(err.message || 'Authentication failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-600 to-indigo-800 transform -skew-y-6 origin-top-left -translate-y-20 z-0"></div>
      
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl z-10 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-50 rounded-full mb-6 text-indigo-600 shadow-sm">
                <Hexagon size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{isRegistering ? 'Create Account' : 'Welcome Back'}</h1>
            <p className="text-sm text-gray-500">
                {isRegistering ? 'Join NexusFlow to start organizing' : 'Sign in to access your NexusFlow workspace'}
            </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-3 animate-[fadeIn_0.2s_ease-out]">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <button
                type="button"
                onClick={handleGithubLogin}
                className="w-full bg-gray-900 text-white font-bold py-3 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
                <GithubIcon size={20} />
                <span>Continue with GitHub</span>
            </button>

            <div className="flex items-center gap-4">
                <div className="h-px bg-gray-200 flex-1"></div>
                <span className="text-xs text-gray-400 font-medium uppercase">Or with Email</span>
                <div className="h-px bg-gray-200 flex-1"></div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Email Address</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm
                                ${email && !isEmailValid ? 'border-red-300 focus:ring-red-200' : 'border-gray-200'}
                            `}
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2 flex justify-between">
                        <span>Password</span>
                        {!isRegistering && <a href="#" className="text-indigo-600 hover:text-indigo-800 capitalize font-medium">Forgot?</a>}
                    </label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <Lock size={18} />
                        </div>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={!isFormValid || isLoading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform active:scale-[0.98]"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={20} className="animate-spin" />
                        {isRegistering ? 'Creating Account...' : 'Signing In...'}
                    </>
                ) : (
                    <>
                        {isRegistering ? 'Sign Up' : 'Sign In'} <ArrowRight size={18} />
                    </>
                )}
            </button>
        </form>

        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
                {isRegistering ? 'Already have an account?' : "Don't have an account?"} 
                <button 
                    type="button"
                    onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                    className="ml-1 text-indigo-600 font-bold hover:underline"
                >
                    {isRegistering ? 'Sign In' : 'Create one'}
                </button>
            </p>
        </div>
      </div>
      
      <div className="mt-8 text-center text-gray-400 text-xs">
          &copy; 2024 NexusFlow Inc. All rights reserved.
      </div>
    </div>
  );
};

// Simple internal icon for Github to avoid importing if not available in lucid-react version, 
// though lucide usually has 'Github'. I'll define it locally to be safe or use lucide's if I import it.
// Let's rely on standard lucide-react import in the main file update if possible, 
// but since I am replacing partial content, I will add the Sub-Component here or import it.
// Wait, I need to check imports. The previous tool call showed imports.
// I will add 'Github' to imports in a separate call if needed, but 'lucide-react' has it.
// Actually, to be safe and avoid multi-step errors if 'Github' isn't in the named imports I see:
// I'll add `import { Github } from 'lucide-react'` in a separate step or just use a custom SVG here.
// I will use a custom SVG component for Github to be 100% sure and self-contained in this replacement block?
// No, I can't declare a component inside a component easily without warnings.
// I will assume 'Github' is available in lucide-react or just use a helper. 
// Let's try adding it to the imports first.

const GithubIcon = ({ size = 24 }: { size?: number }) => (
    <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
    >
        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
        <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
);
