import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import SubmitButton from './SubmitButton'

export default function LoginPage({ searchParams }: { searchParams: { error?: string, action?: string } }) {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 mb-4 relative">
                        <Image src="/logo.svg" alt="MedicaHub" fill className="object-contain" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">MedicaHub</h1>
                    <p className="text-gray-500 text-sm mt-2">Přihlaste se ke svému účtu</p>
                </div>

                {searchParams?.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        <p className="text-sm font-medium">{searchParams.error}</p>

                        {searchParams.action === 'register' && (
                            <Link
                                href="/signup"
                                className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                            >
                                Vytvořit nový účet
                            </Link>
                        )}

                        {searchParams.action === 'reset' && (
                            <Link
                                href="/reset-password"
                                className="mt-3 block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                            >
                                Obnovit heslo
                            </Link>
                        )}
                    </div>
                )}

                <form action={login} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            defaultValue="demo@medicahub.cz"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="doktor@medicahub.cz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Heslo</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            defaultValue="123456"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="••••••••"
                        />
                    </div>

                    <SubmitButton />

                </form>

                <div className="mt-6 text-center">
                    <span className="text-sm text-gray-500">Nemáte účet? </span>
                    <Link href="/signup" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                        Zaregistrujte se
                    </Link>
                </div>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} MedicaHub s.r.o. Všechna práva vyhrazena.
            </div>
        </div>
    )
}
