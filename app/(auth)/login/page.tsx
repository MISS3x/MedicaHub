import { login } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import LoginForm from './LoginForm2'

export default function LoginPage({ searchParams }: { searchParams: { error?: string, action?: string } }) {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <Link href="/" className="flex flex-col items-center group">
                        <div className="h-16 w-16 mb-4 relative group-hover:scale-105 transition-transform duration-300">
                            <Image src="/logo.svg" alt="MedicaHub" fill className="object-contain" />
                        </div>
                        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight group-hover:text-blue-600 transition-colors">MedicaHub</h1>
                    </Link>
                    <p className="text-gray-500 text-sm mt-2">Přihlaste se ke svému účtu</p>
                </div>

                {/* ENV CHECK */}
                {(!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg mb-6 text-xs break-all">
                        <strong>Configuration Error:</strong> Missing Supabase Environment Variables.
                        <br />
                        URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING'}
                        <br />
                        KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'}
                    </div>
                )}

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

                <LoginForm />

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
