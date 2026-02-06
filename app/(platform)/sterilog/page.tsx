import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SteriLogPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-8">
                    <Link href="/hub" className="mr-4 p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <Link href="/hub" className="h-8 w-8 relative mr-3 hidden sm:block hover:opacity-80 transition-opacity">
                        <img src="/logo.svg" alt="Logo" className="w-full h-full object-contain" />
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight"><span className="text-blue-600">SteriLog</span> <span className="text-slate-400 font-normal">| Evidence sterilizačních procesů</span></h1>
                </div>

                <div className="flex items-center justify-center h-[60vh] bg-white rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-300">Coming Soon</p>
                        <p className="text-slate-400 mt-2">Na této aplikaci usilovně pracujeme.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
