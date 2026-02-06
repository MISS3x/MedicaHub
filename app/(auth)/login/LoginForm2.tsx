'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginForm() {
    // State
    const [viewMode, setViewMode] = useState<'crossroads' | 'login'>('crossroads');
    const [email, setEmail] = useState('demo@medicahub.cz');
    const [password, setPassword] = useState('123456');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            console.log('Attempting client-side login...');
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('Login failed:', error.message);
                setError(error.message);
                setIsLoading(false);
                return;
            }

            console.log('Login successful, refreshing session...');
            // Force a router refresh to update server components
            router.refresh();

            console.log('Redirecting to /hub...');
            router.replace('/hub');

        } catch (err: any) {
            console.error('Unexpected error:', err);
            setError('Neočekávaná chyba při přihlášení.');
            setIsLoading(false);
        }
    };

    const handleDemoLogin = () => {
        // Use default 'demo' credentials
        setEmail('demo@medicahub.cz');
        setPassword('123456'); // Ensure this matches reality or use a specific demo flow
        handleLogin();
    };

    // --- VIEW: LOGIN FORM ---
    if (viewMode === 'login') {
        return (
            <div className="space-y-4">
                {/* Back Button */}
                <button
                    onClick={() => setViewMode('crossroads')}
                    className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors mb-2"
                >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    Zpět na rozcestník
                </button>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="doktor@medicahub.cz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Heslo</label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 mt-6 shadow-sm shadow-blue-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Přihlašování...
                            </>
                        ) : (
                            'Přihlásit se'
                        )}
                    </button>
                </form>
            </div>
        );
    }

    // --- VIEW: CROSSROADS ---
    return (
        <div className="flex flex-col gap-4">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            {/* 1. DEMO Button */}
            <button
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
                <div className="flex items-center justify-center gap-2">
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : (
                        <span className="text-xl">Otevři DEMO</span>
                    )}
                    {!isLoading && <svg className="w-5 h-5 text-blue-200 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>}
                </div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>

            <div className="grid grid-cols-2 gap-3 mt-2">
                {/* 2. Login Button */}
                <button
                    onClick={() => setViewMode('login')}
                    className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-all"
                >
                    Přihlásit se
                </button>

                {/* 3. Register Button */}
                <Link
                    href="/signup"
                    className="w-full bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-3 rounded-lg transition-all text-center flex items-center justify-center"
                >
                    Registrovat
                </Link>
            </div>

            <div className="mt-2 text-center">
                <p className="text-xs text-slate-400">Vyberte si způsob vstupu do aplikace.</p>
            </div>
        </div>
    );
}
