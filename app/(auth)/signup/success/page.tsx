import Link from 'next/link'
import Image from 'next/image'
import { MailCheck } from 'lucide-react'

export default function SignupSuccessPage() {
    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 p-4 sm:p-6">
            <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6 sm:p-8 border border-gray-100 text-center">
                <div className="flex justify-center mb-6">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                        <MailCheck size={40} />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">Registrace byla úspěšná!</h1>

                <div className="space-y-4 text-gray-600 mb-8">
                    <p>
                        Děkujeme za registraci. Na váš email jsme odeslali potvrzovací odkaz.
                    </p>
                    <p className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
                        Pro aktivaci účtu prosím klikněte na odkaz v emailu. Poté se budete moci přihlásit.
                    </p>
                </div>

                <Link
                    href="/login"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-colors shadow-md shadow-blue-200"
                >
                    Přejít na přihlášení
                </Link>

                <div className="mt-6">
                    <p className="text-xs text-gray-400">
                        Nedorazil vám email? Zkontrolujte složku SPAM.
                    </p>
                </div>
            </div>

            <div className="mt-8">
                <div className="relative h-8 w-32 opacity-50 grayscale">
                    <Image src="/logo.svg" alt="FineMedica Hub" fill className="object-contain" />
                </div>
            </div>
        </div>
    )
}
