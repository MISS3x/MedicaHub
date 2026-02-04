'use client'

import { useState, useEffect } from 'react'
import { useAdminAuth } from './AdminAuthContext'
import { LogOut, Trash2, RefreshCw } from 'lucide-react'
import { toggleAppStatus, deleteUserAccount, getAdminUsers } from './actions'

interface AdminUser {
    user_id: string
    full_name: string
    email: string
    organization: string
    tier: string
    credits: number
    brain_enabled: boolean
    termolog: boolean
    eventlog: boolean
    medlog: boolean
    voicelog: boolean
    reporty: boolean
    patients: boolean
    sterilog: boolean
}

const APP_COLUMNS = [
    { key: 'termolog', label: 'TermoLog' },
    { key: 'eventlog', label: 'EventLog' },
    { key: 'medlog', label: 'MedLog' },
    { key: 'voicelog', label: 'VoiceLog' },
    { key: 'reporty', label: 'Reporty' },
    { key: 'patients', label: 'Pacienti' },
    { key: 'sterilog', label: 'SteriLog' },
]


export default function AdminDashboard() {
    const { logout } = useAdminAuth()
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [editingCredits, setEditingCredits] = useState<{ [key: string]: number }>({})

    const loadData = async () => {
        setRefreshing(true)
        const data = await getAdminUsers()
        setUsers(data)
        setRefreshing(false)
    }

    useEffect(() => {
        loadData()

        // Data refresh každých 10 sekund (ne full reload)
        const interval = setInterval(() => {
            loadData()
        }, 10000)

        return () => clearInterval(interval)
    }, [])

    const handleToggle = async (email: string, appCode: string, currentStatus: boolean) => {
        setLoading(`${email}-${appCode}`)

        const result = await toggleAppStatus(email, appCode, !currentStatus)

        if (result.success) {
            setUsers(prev => prev.map(user =>
                user.email === email
                    ? { ...user, [appCode]: !currentStatus }
                    : user
            ))
        } else {
            alert(`Chyba: ${result.error}`)
        }

        setLoading(null)
    }

    const handleCreditsUpdate = async (email: string, newCredits: number) => {
        setLoading(`credits-${email}`)

        const { updateCredits } = await import('./actions')
        const result = await updateCredits(email, newCredits)

        if (result.success) {
            setUsers(prev => prev.map(user =>
                user.email === email
                    ? { ...user, credits: newCredits }
                    : user
            ))
            // Clear editing state
            const newEditing = { ...editingCredits }
            delete newEditing[email]
            setEditingCredits(newEditing)
        } else {
            alert(`Chyba: ${result.error}`)
        }

        setLoading(null)
    }

    const handleBrainToggle = async (email: string, currentStatus: boolean) => {
        setLoading(`brain-${email}`)

        const { toggleBrain } = await import('./actions')
        const result = await toggleBrain(email, !currentStatus)

        if (result.success) {
            setUsers(prev => prev.map(user =>
                user.email === email
                    ? { ...user, brain_enabled: !currentStatus }
                    : user
            ))
        } else {
            alert(`Chyba: ${result.error}`)
        }

        setLoading(null)
    }

    const handleDelete = async (userId: string, email: string) => {
        if (!confirm(`Opravdu smazat účet ${email}? Tato akce je nevratná!`)) {
            return
        }

        setLoading(`delete-${userId}`)
        const result = await deleteUserAccount(userId)

        if (result.success) {
            setUsers(prev => prev.filter(u => u.user_id !== userId))
        } else {
            alert(`Chyba: ${result.error}`)
        }

        setLoading(null)
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Medica<span className="text-blue-600">Hub</span> <span className="text-base font-normal text-slate-500">Admin</span>
                        </h1>
                        <button
                            onClick={loadData}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Obnovit
                        </button>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        Odhlásit
                    </button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex gap-2">
                        <a
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-semibold"
                        >
                            Uživatelé
                        </a>
                        <a
                            href="/admin/community"
                            className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Komunita
                        </a>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1600px] mx-auto p-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">Celkem uživatelů</p>
                        <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">FREE účty</p>
                        <p className="text-2xl font-bold text-slate-600">{users.filter(u => u.tier === 'free').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">PRO účty</p>
                        <p className="text-2xl font-bold text-purple-600">{users.filter(u => u.tier === 'pro').length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                        <p className="text-sm text-slate-600 mb-1">Celkové credits</p>
                        <p className="text-2xl font-bold text-green-600">{users.reduce((sum, u) => sum + u.credits, 0)}</p>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Jméno</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                                    <th className="px-3 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Organizace</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Tier</th>
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Credits</th>
                                    <th className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase" title="VoiceMedica Brain">🧠</th>
                                    {APP_COLUMNS.map(app => (
                                        <th key={app.key} className="px-2 py-3 text-center text-xs font-semibold text-slate-600 uppercase" title={app.label}>
                                            {app.label.slice(0, 4)}
                                        </th>
                                    ))}
                                    <th className="px-3 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Akce</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.user_id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-3 py-3 font-medium text-slate-900">{user.full_name || 'N/A'}</td>
                                        <td className="px-3 py-3 text-slate-600 font-mono text-xs">{user.email}</td>
                                        <td className="px-3 py-3 text-slate-600">{user.organization}</td>
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={async () => {
                                                    const newTier = user.tier === 'pro' ? 'free' : 'pro'
                                                    setLoading(`tier-${user.email}`)

                                                    const { updateTier } = await import('./actions')
                                                    const result = await updateTier(user.email, newTier)

                                                    if (result.success) {
                                                        setUsers(prev => prev.map(u => {
                                                            if (u.email === user.email) {
                                                                // Když přepínáme na PRO, zapnout všechny aplikace v UI
                                                                if (newTier === 'pro') {
                                                                    return {
                                                                        ...u,
                                                                        tier: newTier,
                                                                        termolog: true,
                                                                        eventlog: true,
                                                                        medlog: true,
                                                                        voicelog: true,
                                                                        reporty: true,
                                                                        patients: true,
                                                                        sterilog: true
                                                                    }
                                                                } else {
                                                                    // Když přepínáme na FREE, jen změnit tier
                                                                    return { ...u, tier: newTier }
                                                                }
                                                            }
                                                            return u
                                                        }))
                                                    } else {
                                                        alert(`Chyba: ${result.error}`)
                                                    }

                                                    setLoading(null)
                                                }}
                                                disabled={loading === `tier-${user.email}`}
                                                className={`inline-block px-2 py-0.5 rounded text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity ${user.tier === 'pro'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-slate-100 text-slate-700'
                                                    } ${loading === `tier-${user.email}` ? 'opacity-50' : ''}`}
                                                title="Klikněte pro změnu"
                                            >
                                                {user.tier.toUpperCase()}
                                            </button>
                                        </td>
                                        <td className="px-3 py-3 text-center">
                                            {editingCredits[user.email] !== undefined ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <input
                                                        type="number"
                                                        value={editingCredits[user.email]}
                                                        onChange={(e) => setEditingCredits({ ...editingCredits, [user.email]: parseInt(e.target.value) || 0 })}
                                                        className="w-16 px-2 py-1 text-sm border border-blue-300 rounded text-center font-mono"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => handleCreditsUpdate(user.email, editingCredits[user.email])}
                                                        disabled={loading === `credits-${user.email}`}
                                                        className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded disabled:opacity-50"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const newEditing = { ...editingCredits }
                                                            delete newEditing[user.email]
                                                            setEditingCredits(newEditing)
                                                        }}
                                                        className="px-2 py-1 bg-slate-300 hover:bg-slate-400 text-slate-700 text-xs rounded"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <span
                                                    onClick={() => setEditingCredits({ ...editingCredits, [user.email]: user.credits })}
                                                    className="font-mono text-slate-900 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
                                                    title="Klikněte pro úpravu"
                                                >
                                                    {user.credits}
                                                </span>
                                            )}
                                        </td>
                                        {/* Brain Toggle */}
                                        <td className="px-2 py-3 text-center">
                                            <button
                                                onClick={() => handleBrainToggle(user.email, user.brain_enabled)}
                                                disabled={loading === `brain-${user.email}`}
                                                className={`w-5 h-5 rounded border-2 transition-all mx-auto flex items-center justify-center ${user.brain_enabled
                                                    ? 'bg-blue-500 border-blue-600'
                                                    : 'bg-white border-slate-300'
                                                    } ${loading === `brain-${user.email}` ? 'opacity-50' : 'hover:scale-110 cursor-pointer'}`}
                                                title={`${user.brain_enabled ? 'Vypnout' : 'Zapnout'} VoiceMedica Brain`}
                                            >
                                                {user.brain_enabled && (
                                                    <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </button>
                                        </td>
                                        {APP_COLUMNS.map(app => {
                                            const isEnabled = user[app.key as keyof AdminUser] as boolean
                                            const isLoading = loading === `${user.email}-${app.key}`

                                            return (
                                                <td key={app.key} className="px-2 py-3 text-center">
                                                    <button
                                                        onClick={() => handleToggle(user.email, app.key, isEnabled)}
                                                        disabled={isLoading}
                                                        className={`w-5 h-5 rounded border-2 transition-all mx-auto flex items-center justify-center ${isEnabled
                                                            ? 'bg-green-500 border-green-600'
                                                            : 'bg-white border-slate-300'
                                                            } ${isLoading ? 'opacity-50' : 'hover:scale-110 cursor-pointer'}`}
                                                        title={`${isEnabled ? 'Vypnout' : 'Zapnout'} ${app.label}`}
                                                    >
                                                        {isEnabled && (
                                                            <svg className="w-full h-full text-white p-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                </td>
                                            )
                                        })}
                                        <td className="px-3 py-3 text-center">
                                            <button
                                                onClick={() => handleDelete(user.user_id, user.email)}
                                                disabled={loading === `delete-${user.user_id}`}
                                                className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors disabled:opacity-50"
                                                title="Smazat účet"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {users.length === 0 && !refreshing && (
                    <div className="text-center py-12 text-slate-500">
                        Žádní uživatelé v databázi
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="max-w-[1600px] mx-auto px-6 border-t border-slate-200">
                <div className="flex gap-2">
                    <a
                        href="/admin"
                        className="flex items-center gap-2 px-4 py-3 border-b-2 border-blue-600 text-blue-600 font-semibold"
                    >
                        Uživatelé
                    </a>
                    <a
                        href="/admin/community"
                        className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Komunita
                    </a>
                </div>
            </div>
        </div>
    )
}
