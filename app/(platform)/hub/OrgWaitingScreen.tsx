'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function OrgWaitingScreen() {
    const router = useRouter();

    useEffect(() => {
        // Auto refresh every 3 seconds
        const interval = setInterval(() => {
            router.refresh();
        }, 3000);

        return () => clearInterval(interval);
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Nastavujeme váš účet...</h2>
                <p className="text-slate-500 mb-6">
                    Váš účet se právě vytváří. Stránka se automaticky obnoví za 3 sekundy.
                </p>
                <button
                    onClick={() => router.refresh()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full"
                >
                    Obnovit nyní
                </button>
            </div>
        </div>
    );
}
