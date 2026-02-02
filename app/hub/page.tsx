import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Thermometer, Pill, Activity, Settings } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default async function HubPage() {
    const supabase = createClient()

    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return redirect('/login')
    }

    // 2. Get Organization ID
    // Assuming profiles.id is the same as auth.users.id based on standard patterns
    const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, full_name')
        .eq('id', user.id)
        .single()

    if (!profile?.organization_id) {
        // Fallback if no profile found (cleaner handling might be needed later)
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-red-50 text-red-700 p-4 rounded-lg">
                    Chyba: Uživatel nemá přiřazenou organizaci. Kontaktujte podporu.
                </div>
            </div>
        )
    }

    // 3. Get Active Apps
    const { data: activeAppsData } = await supabase
        .from('active_apps')
        .select('app_code')
        .eq('organization_id', profile.organization_id)

    const activeApps = activeAppsData?.map(a => a.app_code) || []

    // Helper to determining if app is visible
    const showApp = (code: string) => activeApps.includes(code)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="relative h-8 w-8">
                            <Image src="/logo.svg" alt="Logo" fill className="object-contain" />
                        </div>
                        <span className="font-semibold text-gray-900 tracking-tight">FineMedica Hub</span>
                    </div>
                    <div className="text-sm text-gray-500">
                        {profile.full_name || user.email}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">Dostupné aplikace</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {/* TermoLog Card */}
                    {showApp('termolog') && (
                        <Link href="/app/termolog" className="group relative block h-full">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-200"></div>
                            <div className="relative h-full bg-white rounded-xl p-8 ring-1 ring-gray-900/5 flex flex-col items-center text-center hover:bg-gray-50 transition-colors">
                                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Thermometer size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">TermoLog</h3>
                                <p className="text-gray-500 text-sm">Monitoring teploty a vlhkosti v ordinaci.</p>
                            </div>
                        </Link>
                    )}

                    {/* MedLog Card */}
                    {showApp('medlog') && (
                        <Link href="/app/medlog" className="group relative block h-full">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl blur opacity-25 group-hover:opacity-100 transition duration-200"></div>
                            <div className="relative h-full bg-white rounded-xl p-8 ring-1 ring-gray-900/5 flex flex-col items-center text-center hover:bg-gray-50 transition-colors">
                                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                                    <Pill size={32} />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">MedLog</h3>
                                <p className="text-gray-500 text-sm">Evidence a expirace léků.</p>
                            </div>
                        </Link>
                    )}

                    {/* Fallback if no apps */}
                    {activeApps.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            Žádné aktivní aplikace. Kontaktujte správce organizace.
                        </div>
                    )}

                </div>
            </main>
        </div>
    )
}
