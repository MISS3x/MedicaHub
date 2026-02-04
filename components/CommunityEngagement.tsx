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
    const [loadingFeatures, setLoadingFeatures] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [votingId, setVotingId] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState('');

    const supabase = createClient();

    // Load approved feature requests
    const loadFeatures = async () => {
        setLoadingFeatures(true);
        try {
            const { data, error } = await supabase
                .from('feature_requests')
                .select('*')
                .eq('approved', true)
                .order('votes', { ascending: false });

            if (error) throw error;

            // Check which ones user has voted for
            if (userEmail) {
                const { data: votes } = await supabase
                    .from('feature_votes')
                    .select('request_id')
                    .eq('voter_email', userEmail);

                const votedIds = new Set(votes?.map(v => v.request_id) || []);

                setFeatures(data.map(f => ({
                    ...f,
                    user_has_voted: votedIds.has(f.id)
                })));
            } else {
                setFeatures(data);
            }
        } catch (error) {
            console.error('Error loading features:', error);
        } finally {
            setLoadingFeatures(false);
        }
    };

    useEffect(() => {
        if (showVoting) {
            loadFeatures();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showVoting, userEmail]);

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

    // Toggle vote
    const handleVote = async (requestId: string) => {
        if (!userEmail) {
            alert('Pro hlasování prosím zadejte email v sekci beta testování nebo návrhů.');
            return;
        }

        setVotingId(requestId);
        const feature = features.find(f => f.id === requestId);

        try {
            if (feature?.user_has_voted) {
                // Remove vote
                const { error } = await supabase
                    .from('feature_votes')
                    .delete()
                    .eq('request_id', requestId)
                    .eq('voter_email', userEmail);

                if (error) throw error;
            } else {
                // Add vote
                const { error } = await supabase
                    .from('feature_votes')
                    .insert([{ request_id: requestId, voter_email: userEmail }]);

                if (error) throw error;
            }

            // Reload features
            await loadFeatures();
        } catch (error) {
            console.error('Error voting:', error);
            alert('Chyba při hlasování. Zkuste to prosím znovu.');
        } finally {
            setVotingId(null);
        }
    };

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
                                            setUserEmail(e.target.value);
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
                                            setUserEmail(e.target.value);
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

                {/* VOTING SECTION */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-3xl p-8 shadow-lg border border-slate-200"
                >
                    <button
                        onClick={() => setShowVoting(!showVoting)}
                        className="w-full flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl group-hover:scale-110 transition-transform">
                                <Heart className="w-6 h-6 text-pink-600" />
                            </div>
                            <div className="text-left">
                                <h3 className="text-xl font-bold text-slate-900">Hlasování komunity</h3>
                                <p className="text-sm text-slate-500">Lajkuj aplikace, které chceš vidět jako první</p>
                            </div>
                        </div>
                        <ChevronDown className={`w-6 h-6 text-slate-400 transition-transform ${showVoting ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {showVoting && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-6 space-y-3"
                            >
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
                                    features.map((feature) => (
                                        <motion.div
                                            key={feature.id}
                                            layout
                                            className="border border-slate-200 rounded-2xl overflow-hidden hover:border-purple-300 transition-colors"
                                        >
                                            <div className="flex items-center gap-4 p-4">
                                                {/* Vote button */}
                                                <button
                                                    onClick={() => handleVote(feature.id)}
                                                    disabled={votingId === feature.id}
                                                    className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${feature.user_has_voted
                                                        ? 'bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg scale-105'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-600'
                                                        } disabled:opacity-50`}
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
                                                    <h4 className="font-bold text-slate-900 hover:text-purple-600 transition-colors">
                                                        {feature.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-400">
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
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
};
