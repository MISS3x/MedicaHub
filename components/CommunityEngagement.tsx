'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, Send, Sparkles, CheckCircle2,
    AlertCircle, Loader2, ThumbsUp, ChevronDown,
    Users, Lightbulb
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface FeatureRequest {
    id: string;
    title: string;
    description: string;
    votes: number;
    submitted_by_name: string;
    created_at: string;
    user_has_voted?: boolean;
}

export const CommunityEngagement = () => {
    const [activeTab, setActiveTab] = useState<'beta' | 'request'>('beta');
    const [showVoting, setShowVoting] = useState(false);

    // Beta form state
    const [betaForm, setBetaForm] = useState({ email: '', fullName: '', practiceType: '', notes: '' });
    const [betaSubmitting, setBetaSubmitting] = useState(false);
    const [betaSuccess, setBetaSuccess] = useState(false);

    // Feature request form state
    const [requestForm, setRequestForm] = useState({ title: '', description: '', email: '', name: '' });
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    // Voting state
    const [features, setFeatures] = useState<FeatureRequest[]>([]);
    const [loadingFeatures, setLoadingFeatures] = useState(true); // Load by default
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [votingId, setVotingId] = useState<string | null>(null);
    const [userIp, setUserIp] = useState<string>(''); // For IP based voting
    const [showAllVoting, setShowAllVoting] = useState(false); // Toggle for "Show More"

    const supabase = createClient();

    // 1. Get IP on mount
    useEffect(() => {
        fetch('https://api.ipify.org?format=json')
            .then(res => res.json())
            .then(data => setUserIp(data.ip))
            .catch(err => {
                console.warn('Failed to get IP', err);
                // Fallback ID if IP fetch fails
                const localId = localStorage.getItem('voter_id') || `anon-${Math.random()}`;
                localStorage.setItem('voter_id', localId);
                setUserIp(localId);
            });
    }, []);

    // 2. Load Features (Always, or when IP changes)
    useEffect(() => {
        const loadAndSetFeatures = async () => {
            // Need IP to check votes
            if (!userIp) return;

            setLoadingFeatures(true);
            try {
                const { data, error } = await supabase
                    .from('feature_requests')
                    .select('*')
                    .eq('approved', true)
                    .order('votes', { ascending: false });

                if (error) throw error;

                // Check votes using IP-based email
                const voterIdentity = `${userIp}@ip.vote`;
                const { data: votes } = await supabase
                    .from('feature_votes')
                    .select('request_id')
                    .eq('voter_email', voterIdentity);

                const votedIds = new Set(votes?.map((v: any) => v.request_id) || []);

                setFeatures(data.map((f: any) => ({
                    ...f,
                    user_has_voted: votedIds.has(f.id)
                })));
            } catch (error) {
                console.error('Error loading features:', error);
            } finally {
                setLoadingFeatures(false);
            }
        };

        loadAndSetFeatures();
    }, [userIp, supabase]);

    // Submit beta request
    const handleBetaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setBetaSubmitting(true);

        try {
            const { error } = await supabase
                .from('beta_requests')
                .insert([{
                    email: betaForm.email,
                    full_name: betaForm.fullName,
                    practice_type: betaForm.practiceType,
                    notes: betaForm.notes
                }]);

            if (error) throw error;

            setBetaSuccess(true);
            setBetaForm({ email: '', fullName: '', practiceType: '', notes: '' });
            setTimeout(() => setBetaSuccess(false), 5000);
        } catch (error) {
            console.error('Error submitting beta request:', error);
            alert('Chyba při odesílání. Zkuste to prosím znovu.');
        } finally {
            setBetaSubmitting(false);
        }
    };

    // Submit feature request
    const handleRequestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setRequestSubmitting(true);

        try {
            const { error } = await supabase
                .from('feature_requests')
                .insert([{
                    title: requestForm.title,
                    description: requestForm.description,
                    submitted_by_email: requestForm.email,
                    submitted_by_name: requestForm.name
                }]);

            if (error) throw error;

            setRequestSuccess(true);
            setRequestForm({ title: '', description: '', email: '', name: '' });
            setTimeout(() => setRequestSuccess(false), 5000);
        } catch (error) {
            console.error('Error submitting request:', error);
            alert('Chyba při odesílání. Zkuste to prosím znovu.');
        } finally {
            setRequestSubmitting(false);
        }
    };

    // Toggle vote (IP based)
    const handleVote = async (requestId: string) => {
        if (!userIp) {
            alert('Načítám vaši identifikaci, zkuste to prosím za chvilku...');
            return;
        }

        const voterIdentity = `${userIp}@ip.vote`;

        setVotingId(requestId);
        const feature = features.find(f => f.id === requestId);

        try {
            if (feature?.user_has_voted) {
                // Remove vote
                const { error } = await supabase
                    .from('feature_votes')
                    .delete()
                    .eq('request_id', requestId)
                    .eq('voter_email', voterIdentity);

                if (error) throw error;
            } else {
                // Add vote
                const { error } = await supabase
                    .from('feature_votes')
                    .insert([{ request_id: requestId, voter_email: voterIdentity }]);

                if (error) throw error;
            }

            // Manually update local state to reflect change instantly (optimistic-like update)
            // But better to re-fetch to get accurate count if concurrency matters.
            // For simplicity and speed, let's re-fetch.
            const { data: refreshedData } = await supabase
                .from('feature_requests')
                .select('*')
                .eq('approved', true)
                .order('votes', { ascending: false });

            if (refreshedData) {
                const { data: votes } = await supabase
                    .from('feature_votes')
                    .select('request_id')
                    .eq('voter_email', voterIdentity);

                const votedIds = new Set(votes?.map((v: any) => v.request_id) || []);

                setFeatures(refreshedData.map((f: any) => ({
                    ...f,
                    user_has_voted: votedIds.has(f.id)
                })));
            }
        } catch (error) {
            console.error('Error voting:', error);
            alert('Chyba při hlasování. Možná jste již hlasovali z jiné IP?');
        } finally {
            setVotingId(null);
        }
    };

    // Logic for displaying features
    // Show Top 3 always. Show rest if showAllVoting is true.
    const displayedFeatures = showAllVoting ? features : features.slice(0, 3);
    const hasMore = features.length > 3;

    return (
        <section className="py-20 bg-gradient-to-br from-purple-50 via-white to-blue-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-20" />

            <div className="max-w-6xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full mb-4">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-bold text-purple-900 uppercase tracking-wider">Zapoj se hned!</span>
                    </div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">
                        Tvořme budoucnost společně
                    </h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Staň se beta testerem, navrhni novou funkci nebo hlasuj pro aplikace, které chceš vidět jako první.
                    </p>
                </motion.div>

                {/* Main Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">

                    {/* BETA TESTING CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-purple-100 rounded-2xl">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Beta Testing</h3>
                                <p className="text-sm text-slate-500">Buď mezi prvními</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {betaSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center py-8"
                                >
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-slate-900 mb-2">Děkujeme!</p>
                                    <p className="text-sm text-slate-600">Brzy se vám ozveme s přístupem do beta verze.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleBetaSubmit} className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Váš email *"
                                        required
                                        value={betaForm.email}
                                        onChange={(e) => {
                                            setBetaForm({ ...betaForm, email: e.target.value });
                                            // setUserEmail(e.target.value); // No longer needed for voting
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Jméno a příjmení"
                                        value={betaForm.fullName}
                                        onChange={(e) => setBetaForm({ ...betaForm, fullName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                    />
                                    <select
                                        value={betaForm.practiceType}
                                        onChange={(e) => setBetaForm({ ...betaForm, practiceType: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                                    >
                                        <option value="">Typ ordinace</option>
                                        <option value="private">Soukromá ordinace</option>
                                        <option value="hospital">Nemocnice</option>
                                        <option value="clinic">Klinika</option>
                                        <option value="other">Jiné</option>
                                    </select>
                                    <textarea
                                        placeholder="Poznámky (volitelné)"
                                        rows={3}
                                        value={betaForm.notes}
                                        onChange={(e) => setBetaForm({ ...betaForm, notes: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all resize-none"
                                    />
                                    <button
                                        type="submit"
                                        disabled={betaSubmitting}
                                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {betaSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Odesílám...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Chci testovat
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </AnimatePresence>
                    </motion.div>

                    {/* FEATURE REQUEST CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-blue-100 rounded-2xl">
                                <Lightbulb className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Navrhni funkci</h3>
                                <p className="text-sm text-slate-500">Vaše nápady nás zajímají</p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {requestSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="text-center py-8"
                                >
                                    <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                    <p className="text-lg font-semibold text-slate-900 mb-2">Návrh odeslán!</p>
                                    <p className="text-sm text-slate-600">Po schválení se objeví v hlasování níže.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleRequestSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Název aplikace/funkce *"
                                        required
                                        value={requestForm.title}
                                        onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                    <textarea
                                        placeholder="Popis - k čemu by vám to pomohlo? *"
                                        rows={4}
                                        required
                                        value={requestForm.description}
                                        onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none"
                                    />
                                    <input
                                        type="email"
                                        placeholder="Váš email *"
                                        required
                                        value={requestForm.email}
                                        onChange={(e) => {
                                            setRequestForm({ ...requestForm, email: e.target.value });
                                            // setUserEmail(e.target.value); // No longer needed
                                        }}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Jméno (volitelné)"
                                        value={requestForm.name}
                                        onChange={(e) => setRequestForm({ ...requestForm, name: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={requestSubmitting}
                                        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {requestSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Odesílám...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Odeslat návrh
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* VOTING SECTION - ALWAYS VISIBLE (Top 3) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl">
                            <Heart className="w-6 h-6 text-pink-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Hlasování komunity</h3>
                            <p className="text-sm text-slate-500">
                                {loadingFeatures ? 'Načítám...' : `Celkem ${features.length} návrhů (${userIp ? 'votační právo aktivní' : 'ověřování...'})`}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {loadingFeatures ? (
                            <div className="text-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">Načítám návrhy...</p>
                            </div>
                        ) : features.length === 0 ? (
                            <div className="text-center py-12">
                                <Lightbulb className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">Zatím žádné schválené návrhy.</p>
                                <p className="text-sm text-slate-400">Buďte první, kdo navrhne novou funkci!</p>
                            </div>
                        ) : (
                            <>
                                {/* Render Top 3 Features (Full Detail) */}
                                {features.slice(0, 3).map((feature) => (
                                    <motion.div
                                        key={feature.id}
                                        layout
                                        className="border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-300 transition-colors bg-white shadow-sm"
                                    >
                                        <div className="flex items-center gap-4 p-4">
                                            {/* Vote button */}
                                            <button
                                                onClick={() => handleVote(feature.id)}
                                                disabled={votingId === feature.id}
                                                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${feature.user_has_voted
                                                    ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                                                    } disabled:opacity-50 min-w-[60px]`}
                                            >
                                                {votingId === feature.id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Heart className={`w-5 h-5 ${feature.user_has_voted ? 'fill-current' : ''}`} />
                                                )}
                                                <span className="text-xs font-bold">{feature.votes}</span>
                                            </button>

                                            {/* Title and expand */}
                                            <button
                                                onClick={() => setExpandedId(expandedId === feature.id ? null : feature.id)}
                                                className="flex-1 text-left"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-yellow-100 text-yellow-700 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                                                        TOP {features.indexOf(feature) + 1}
                                                    </span>
                                                    <h4 className="font-bold text-slate-900 hover:text-purple-600 transition-colors text-lg">
                                                        {feature.title}
                                                    </h4>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {feature.submitted_by_name || 'Anonymní'} • {new Date(feature.created_at).toLocaleDateString('cs')}
                                                </p>
                                            </button>

                                            <ChevronDown
                                                className={`w-5 h-5 text-slate-400 transition-transform ${expandedId === feature.id ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </div>

                                        {/* Expanded description */}
                                        <AnimatePresence>
                                            {expandedId === feature.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="px-4 pb-4 pt-2 border-t border-slate-100"
                                                >
                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                        {feature.description || 'Bez popisu.'}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}

                                {/* Render Next 10 Features (Grid Mode 5x2) - Only if not showing all */}
                                {!showAllVoting && features.length > 3 && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                                        {features.slice(3, 13).map((feature, idx) => (
                                            <motion.div
                                                key={feature.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => handleVote(feature.id)}
                                                className={`cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center h-full min-h-[100px] ${feature.user_has_voted
                                                        ? 'bg-purple-50 border-purple-200 shadow-inner'
                                                        : 'bg-slate-50 border-slate-100 hover:bg-white hover:shadow-md hover:border-purple-200'
                                                    }`}
                                            >
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold mb-2 ${feature.user_has_voted
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-slate-200 text-slate-600'
                                                    }`}>
                                                    <Heart className={`w-3 h-3 ${feature.user_has_voted ? 'fill-current' : ''}`} />
                                                    {feature.votes}
                                                </div>
                                                <h4 className="text-xs font-semibold text-slate-700 line-clamp-2 leading-tight w-full break-words" title={feature.title}>
                                                    {feature.title}
                                                </h4>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}

                                {/* Render Rest of Features (Full List) - Only if showAllVoting is true */}
                                {showAllVoting && features.slice(3).map((feature) => (
                                    <motion.div
                                        key={feature.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="border border-slate-200 rounded-xl overflow-hidden hover:border-purple-300 transition-colors bg-white"
                                    >
                                        <div className="flex items-center gap-4 p-3">
                                            <button
                                                onClick={() => handleVote(feature.id)}
                                                disabled={votingId === feature.id}
                                                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all ${feature.user_has_voted
                                                    ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-md'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                                                    } disabled:opacity-50 min-w-[50px]`}
                                            >
                                                <Heart className={`w-4 h-4 ${feature.user_has_voted ? 'fill-current' : ''}`} />
                                                <span className="text-xs font-bold">{feature.votes}</span>
                                            </button>

                                            <button
                                                onClick={() => setExpandedId(expandedId === feature.id ? null : feature.id)}
                                                className="flex-1 text-left"
                                            >
                                                <h4 className="font-bold text-slate-800 hover:text-purple-600 transition-colors text-base">
                                                    {feature.title}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {feature.submitted_by_name || 'Anonymní'} • {new Date(feature.created_at).toLocaleDateString('cs')}
                                                </p>
                                            </button>

                                            <ChevronDown
                                                className={`w-4 h-4 text-slate-400 transition-transform ${expandedId === feature.id ? 'rotate-180' : ''
                                                    }`}
                                            />
                                        </div>

                                        <AnimatePresence>
                                            {expandedId === feature.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="px-3 pb-3 pt-1 border-t border-slate-100"
                                                >
                                                    <p className="text-sm text-slate-600 leading-relaxed">
                                                        {feature.description || 'Bez popisu.'}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}

                                {/* Show More / Show Less Button */}
                                {features.length > 3 && (
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowAllVoting(!showAllVoting)}
                                        className={`w-full py-4 mt-6 text-base font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 ${showAllVoting
                                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                            : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-purple-500/30'
                                            }`}
                                    >
                                        {showAllVoting ? (
                                            <>
                                                <ChevronDown className="w-5 h-5 rotate-180" />
                                                Zobrazit méně (Top 3)
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-5 h-5" />
                                                Ukaž všechny návrhy ({features.length})
                                            </>
                                        )}
                                    </motion.button>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
