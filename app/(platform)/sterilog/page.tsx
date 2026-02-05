import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function SteriLogPage() {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center mb-8">
                    <Link href="/hub" className="mr-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">SteriLog</h1>
                        <p className="text-slate-500 mt-2">Evidence sterilizačních procesů</p>
                    </div>
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
