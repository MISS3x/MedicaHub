'use client'

import { useState } from 'react'
import { useAdminAuth } from './AdminAuthContext'
import { Lock } from 'lucide-react'

export default function AdminLockScreen() {
    const { login } = useAdminAuth()
    const [pin, setPin] = useState('')
    const [error, setError] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const success = login(pin)

        if (!success) {
            setError(true)
            setPin('')
            setTimeout(() => setError(false), 2000)
        }
    }

    const handleKeypadClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num)
        }
    }

    const handleClear = () => {
        setPin('')
        setError(false)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                        <Lock className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Panel</h1>
                    <p className="text-slate-300 text-sm">Zadejte 4-místný PIN kód</p>
                </div>

                {/* PIN Display */}
                <div className="flex justify-center gap-3 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-14 h-14 rounded-xl flex items-center justify-center border-2 transition-all ${error
                                    ? 'border-red-500 bg-red-500/10 animate-shake'
                                    : pin.length > i
                                        ? 'border-blue-500 bg-blue-500/20'
                                        : 'border-white/30 bg-white/5'
                                }`}
                        >
                            {pin.length > i && (
                                <div className="w-3 h-3 bg-white rounded-full" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Keypad */}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => handleKeypadClick(num.toString())}
                                className="h-14 bg-white/10 hover:bg-white/20 text-white text-xl font-semibold rounded-xl transition-all active:scale-95 border border-white/10"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={handleClear}
                            className="h-14 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 border border-white/10"
                        >
                            Vymazat
                        </button>
                        <button
                            type="button"
                            onClick={() => handleKeypadClick('0')}
                            className="h-14 bg-white/10 hover:bg-white/20 text-white text-xl font-semibold rounded-xl transition-all active:scale-95 border border-white/10"
                        >
                            0
                        </button>
                        <button
                            type="submit"
                            disabled={pin.length !== 4}
                            className="h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-white/10 disabled:text-white/30 text-white text-sm font-semibold rounded-xl transition-all active:scale-95 border border-blue-500 disabled:border-white/10"
                        >
                            OK
                        </button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <p className="text-red-400 text-center text-sm mt-4 animate-pulse">
                        Nesprávný PIN kód
                    </p>
                )}
            </div>

            <style jsx>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                .animate-shake {
                    animation: shake 0.3s ease-in-out;
                }
            `}</style>
        </div>
    )
}
