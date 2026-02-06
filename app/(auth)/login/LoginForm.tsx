'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginForm() {
    const [email, setEmail] = useState('demo@medicahub.cz');
    const [password, setPassword] = useState('123456');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
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

    return (
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
    );
}
