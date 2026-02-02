import { login } from './actions'
import Image from 'next/image'

export default function LoginPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 mb-4 relative">
                        <Image src="/logo.svg" alt="FineMedica Hub" fill className="object-contain" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">FineMedica Hub</h1>
                    <p className="text-gray-500 text-sm mt-2">Přihlaste se ke svému účtu</p>
                </div>

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            defaultValue="demo@finemedica.cz"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="doktor@finemedica.cz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Heslo</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            defaultValue="demo123"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        formAction={login}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 mt-6 shadow-sm shadow-blue-200"
                    >
                        Přihlásit se
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} FineMedica. Všechna práva vyhrazena.
            </div>
        </div>
    )
}
