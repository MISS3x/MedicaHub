import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PatientsPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-12">
                    <Link href="/hub" className="mr-4 p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <Link href="/hub" className="h-8 w-8 relative mr-3 hidden sm:block hover:opacity-80 transition-opacity">
                        <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight"><span className="text-blue-600">Pacienti</span> <span className="text-slate-400 font-normal">| Centrální správa pacientů</span></h1>
                </div>

                <div className="flex items-center justify-center">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Pacienti</h1>
                        <p className="text-lg text-slate-600 mb-8">
                            Centrální správa pacientů
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-blue-800">
                            <p className="font-medium">🚧 Připravujeme pro vás</p>
                            <p className="mt-2 text-sm">
                                Tato funkce je ve vývoji a bude brzy k dispozici.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
