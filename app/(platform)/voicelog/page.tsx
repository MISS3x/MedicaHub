export default function VoiceLogPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-50 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12 text-center">
                <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 mb-4">VoiceLog</h1>
                <p className="text-lg text-slate-600 mb-8">
                    AI hlasové záznamy pro lékaře
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
