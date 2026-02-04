export default function ReportyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-8">
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
    );
}
