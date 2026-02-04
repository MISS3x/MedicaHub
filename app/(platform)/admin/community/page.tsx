'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
    Users, Lightbulb, RefreshCw, Check, X, Trash2,
    ThumbsUp, Edit2, Eye, EyeOff, MessageSquare
} from 'lucide-react'

interface BetaRequest {
    id: string
    email: string
    full_name: string
    practice_type: string
    notes: string
    status: string
    created_at: string
}

interface FeatureRequest {
    id: string
    title: string
    description: string
    submitted_by_name: string
    submitted_by_email: string
    status: string
    votes: number
    approved: boolean
    admin_notes: string
    created_at: string
}

export default function CommunityManagement() {
    const [activeTab, setActiveTab] = useState<'beta' | 'features'>('beta')
    const [betaRequests, setBetaRequests] = useState<BetaRequest[]>([])
    const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([])
    const [loading, setLoading] = useState(false)
    const [editingFeature, setEditingFeature] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({ title: '', description: '', admin_notes: '' })

    const supabase = createClient()

    // Load all beta requests (admin can see all)
    const loadBetaRequests = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('beta_requests')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setBetaRequests(data || [])
        } catch (error) {
            console.error('Error loading beta requests:', error)
        } finally {
            setLoading(false)
        }
    }

    // Load all feature requests (admin can see all)
    const loadFeatureRequests = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('feature_requests')
                .select('*')
                .order('votes', { ascending: false })

            if (error) throw error
            setFeatureRequests(data || [])
        } catch (error) {
            console.error('Error loading feature requests:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadBetaRequests()
        loadFeatureRequests()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Update beta request status
    const updateBetaStatus = async (id: string, status: string) => {
        try {
            const { error } = await supabase
                .from('beta_requests')
                .update({ status })
                .eq('id', id)

            if (error) throw error
            await loadBetaRequests()
        } catch (error) {
            console.error('Error updating status:', error)
            alert('Chyba při aktualizaci statusu')
        }
    }

    // Delete beta request
    const deleteBetaRequest = async (id: string) => {
        if (!confirm('Opravdu smazat tento beta request?')) return

        try {
            const { error } = await supabase
                .from('beta_requests')
                .delete()
                .eq('id', id)

            if (error) throw error
            await loadBetaRequests()
        } catch (error) {
            console.error('Error deleting request:', error)
            alert('Chyba při mazání')
        }
    }

    // Update feature request
    const updateFeatureRequest = async (id: string, updates: any) => {
        try {
            const { error } = await supabase
                .from('feature_requests')
                .update(updates)
                .eq('id', id)

            if (error) throw error
            await loadFeatureRequests()
        } catch (error) {
            console.error('Error updating feature:', error)
            alert('Chyba při aktualizaci')
        }
    }

    // Toggle approved status
    const toggleApproved = async (id: string, currentStatus: boolean, currentStatusText: string) => {
        const updates: any = { approved: !currentStatus }
        if (!currentStatus && currentStatusText === 'pending') updates.status = 'approved'
        await updateFeatureRequest(id, updates)
    }

    // Update feature status
    const updateFeatureStatus = async (id: string, status: string) => {
        const updates: any = { status }
        if (status === 'approved' || status === 'implemented') updates.approved = true
        if (status === 'rejected' || status === 'spam' || status === 'pending') updates.approved = false
        await updateFeatureRequest(id, updates)
    }

    // Save edited feature
    const saveFeature = async (id: string) => {
        await updateFeatureRequest(id, {
            title: editForm.title,
            description: editForm.description,
            admin_notes: editForm.admin_notes
        })
        setEditingFeature(null)
    }

    // Delete feature request
    const deleteFeature = async (id: string) => {
        if (!confirm('Opravdu smazat tento návrh?')) return

        try {
            const { error } = await supabase
                .from('feature_requests')
                .delete()
                .eq('id', id)

            if (error) throw error
            await loadFeatureRequests()
        } catch (error) {
            console.error('Error deleting feature:', error)
            alert('Chyba při mazání')
        }
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-slate-900">
                            Správa komunity
                        </h1>
                        <button
                            onClick={() => { loadBetaRequests(); loadFeatureRequests(); }}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-sm"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Obnovit
                        </button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-[1600px] mx-auto px-6">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('beta')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'beta'
                                ? 'border-purple-600 text-purple-600 font-semibold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Users className="w-4 h-4" />
                            Beta Testing ({betaRequests.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('features')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'features'
                                ? 'border-blue-600 text-blue-600 font-semibold'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Lightbulb className="w-4 h-4" />
                            Návrhy funkcí ({featureRequests.length})
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-[1600px] mx-auto p-6">
                {activeTab === 'beta' ? (
                    /* BETA REQUESTS TABLE */
                    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Jméno</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Typ ordinace</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Poznámky</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Datum</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase">Akce</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {betaRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 font-mono text-xs text-slate-900">{request.email}</td>
                                            <td className="px-4 py-3 text-slate-700">{request.full_name || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600">{request.practice_type || '-'}</td>
                                            <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={request.notes}>
                                                {request.notes || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <select
                                                    value={request.status}
                                                    onChange={(e) => updateBetaStatus(request.id, e.target.value)}
                                                    className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${request.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        request.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                                                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                                'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="approved">Approved</option>
                                                    <option value="contacted">Contacted</option>
                                                    <option value="rejected">Rejected</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-center text-slate-500 text-xs">
                                                {new Date(request.created_at).toLocaleDateString('cs')}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => deleteBetaRequest(request.id)}
                                                    className="p-1.5 hover:bg-red-50 text-red-600 rounded transition-colors"
                                                    title="Smazat"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {betaRequests.length === 0 && !loading && (
                            <div className="text-center py-12 text-slate-500">
                                Žádné beta requests
                            </div>
                        )}
                    </div>
                ) : (
                    /* FEATURE REQUESTS TABLE */
                    <div className="space-y-4">
                        {featureRequests.map((feature) => (
                            <div
                                key={feature.id}
                                className="bg-white rounded-lg shadow-sm border border-slate-200 p-6"
                            >
                                {editingFeature === feature.id ? (
                                    /* EDIT MODE */
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-lg"
                                            placeholder="Název funkce"
                                        />
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            placeholder="Popis"
                                        />
                                        <textarea
                                            value={editForm.admin_notes}
                                            onChange={(e) => setEditForm({ ...editForm, admin_notes: e.target.value })}
                                            rows={2}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-yellow-50"
                                            placeholder="Admin poznámky (interní)"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => saveFeature(feature.id)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                            >
                                                <Check className="w-4 h-4" />
                                                Uložit
                                            </button>
                                            <button
                                                onClick={() => setEditingFeature(null)}
                                                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
                                            >
                                                Zrušit
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* VIEW MODE */
                                    <div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-bold text-slate-900">{feature.title}</h3>
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-bold">
                                                        <ThumbsUp className="w-3 h-3" />
                                                        {feature.votes}
                                                    </div>
                                                </div>
                                                <p className="text-slate-600 mb-2">{feature.description}</p>
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <span>📧 {feature.submitted_by_email}</span>
                                                    <span>👤 {feature.submitted_by_name || 'Anonymní'}</span>
                                                    <span>📅 {new Date(feature.created_at).toLocaleDateString('cs')}</span>
                                                </div>
                                                {feature.admin_notes && (
                                                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                        <div className="flex items-center gap-2 text-xs font-semibold text-yellow-800 mb-1">
                                                            <MessageSquare className="w-3 h-3" />
                                                            Admin poznámka:
                                                        </div>
                                                        <p className="text-sm text-yellow-900">{feature.admin_notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-2 ml-4">
                                                <button
                                                    onClick={() => toggleApproved(feature.id, feature.approved, feature.status)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold ${feature.approved
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    title={feature.approved ? 'Skrýt z veřejnosti' : 'Schválit a zobrazit veřejně'}
                                                >
                                                    {feature.approved ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                                    {feature.approved ? 'Veřejné' : 'Skryté'}
                                                </button>
                                                <select
                                                    value={feature.status}
                                                    onChange={(e) => updateFeatureStatus(feature.id, e.target.value)}
                                                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${feature.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                                        feature.status === 'implemented' ? 'bg-purple-100 text-purple-800' :
                                                            feature.status === 'spam' ? 'bg-red-100 text-red-800' :
                                                                feature.status === 'rejected' ? 'bg-orange-100 text-orange-800' :
                                                                    'bg-slate-100 text-slate-700'
                                                        }`}
                                                >
                                                    <option value="pending">⏳ Pending</option>
                                                    <option value="approved">✅ Approved</option>
                                                    <option value="implemented">🚀 Implemented</option>
                                                    <option value="rejected">❌ Rejected</option>
                                                    <option value="spam">🚫 Spam</option>
                                                </select>
                                                <button
                                                    onClick={() => {
                                                        setEditingFeature(feature.id)
                                                        setEditForm({
                                                            title: feature.title,
                                                            description: feature.description,
                                                            admin_notes: feature.admin_notes || ''
                                                        })
                                                    }}
                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteFeature(feature.id)}
                                                    className="flex items-center justify-center gap-2 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {featureRequests.length === 0 && !loading && (
                            <div className="text-center py-12 text-slate-500">
                                Žádné návrhy funkcí
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
