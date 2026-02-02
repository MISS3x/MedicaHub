import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function MedLogPage() {
    const supabase = createClient()

    // Basic auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-white">
            {/* App Header */}
            <header className="border-b border-gray-100 bg-white sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/hub" className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-500">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="font-semibold text-lg text-gray-900">MedLog</h1>
                    </div>
                    <div>
                        {/* Context/Actions placeholder */}
                    </div>
                </div>
            </header>

            {/* App Content Placeholder */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-8 text-center">
                    <h2 className="text-xl font-medium text-emerald-900 mb-2">Aplikace MedLog se připravuje</h2>
                    <p className="text-emerald-700">Zde bude brzy dostupná funkcionalita pro evidenci léků.</p>
                </div>
            </main>
        </div>
    )
}
