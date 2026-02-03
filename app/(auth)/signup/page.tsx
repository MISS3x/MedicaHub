import { signup } from './actions'
import Image from 'next/image'
import Link from 'next/link'

export default function SignupPage({ searchParams }: { searchParams: { error?: string } }) {

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100">
                <div className="flex flex-col items-center mb-8">
                    <div className="h-16 w-16 mb-4 relative">
                        <Image src="/logo.svg" alt="MedicaHub" fill className="object-contain" />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Vytvořit účet</h1>
                    <p className="text-gray-500 text-sm mt-2">Zaregistrujte svou ordinaci</p>
                </div>

                {searchParams?.error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
                        {searchParams.error}
                    </div>
                )}

                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="fullName">Celé Jméno</label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="MUDr. Jan Novák"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="orgName">Název Ordinace</label>
                        <input
                            id="orgName"
                            name="orgName"
                            type="text"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="Ordinace Praktického Lékaře s.r.o."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="doktor@ordinace.cz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">Heslo</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base text-gray-900 placeholder:text-gray-400"
                            placeholder="Minimálně 6 znaků"
                        />
                    </div>

                    <button
                        formAction={signup}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors duration-200 mt-6 shadow-sm shadow-blue-200"
                    >
                        Zaregistrovat se
                    </button>

                    <div className="mt-4 text-center">
                        <span className="text-sm text-gray-500">Již máte účet? </span>
                        <Link href="/login" className="text-sm font-medium text-blue-600 hover:text-blue-500 hover:underline transition-colors">
                            Přihlásit se
                        </Link>
                    </div>
                </form>
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
                &copy; {new Date().getFullYear()} MedicaHub s.r.o. Všechna práva vyhrazena.
            </div>
        </div>
    )
}
