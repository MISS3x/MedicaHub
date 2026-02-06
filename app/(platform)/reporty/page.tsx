import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ReportyPage() {
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
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight"><span className="text-blue-600">Reporty</span> <span className="text-slate-400 font-normal">| Analytika a přehledy</span></h1>
                </div>

                <div className="flex items-center justify-center">
                    <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-4">Reporty</h1>
                        <p className="text-lg text-slate-600 mb-8">
                            Analytika a přehledy provozu
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
