"use client";

import { useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { Download, Users, Mail, PieChart as PieIcon, Trash2, MessageSquare, Quote } from 'lucide-react';
import { motion } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

interface SurveyResult {
    id: number;
    question_text: string;
    selected_option: string;
    created_at: string;
    session_id: string;
}

interface InterestLead {
    id: string;
    email: string;
    created_at: string;
    notes: string | null;
}

interface DashboardProps {
    results: SurveyResult[];
    leads: InterestLead[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const SurveyDashboardClient = ({ results, leads }: DashboardProps) => {
    const supabase = createClient();
    const router = useRouter();

    // --- Statistics Processing ---

    // 1. Group answers by Question (Exclude Feedback)
    const statsByQuestion = useMemo(() => {
        const grouped: Record<string, Record<string, number>> = {};

        results.forEach(r => {
            // Skip feedback entries in charts
            if (r.question_text === "User Feedback / Vzkaz") return;

            if (!grouped[r.question_text]) {
                grouped[r.question_text] = {};
            }
            grouped[r.question_text][r.selected_option] = (grouped[r.question_text][r.selected_option] || 0) + 1;
        });

        // Convert to array format for Recharts
        return Object.entries(grouped).map(([question, counts]) => {
            const data = Object.entries(counts).map(([option, count]) => ({
                name: option,
                count: count
            }));
            return {
                question,
                data
            };
        });
    }, [results]);

    // 2. Feedbacks List
    const feedbacks = useMemo(() => {
        return results
            .filter(r => r.question_text === "User Feedback / Vzkaz")
            .map(r => {
                // Try to find matching lead/email by session_id
                // Note: The lead's notes contain "Survey Session: <UUID>"
                const lead = leads.find(l => l.notes?.includes(r.session_id));
                return {
                    ...r,
                    author_email: lead?.email || null
                };
            });
    }, [results, leads]);

    // 3. Lead Conversion Stats
    const totalSessionsBase = new Set(results.map(r => r.session_id)).size;
    const totalLeads = leads.length;
    const conversionRate = totalSessionsBase > 0 ? ((totalLeads / totalSessionsBase) * 100).toFixed(1) : "0";

    // --- Actions ---

    // Delete Feedback (from survey_results)
    const handleDeleteFeedback = async (id: number) => {
        if (!confirm("Opravdu smazat tento vzkaz?")) return;
        const { error } = await supabase.from('survey_results').delete().eq('id', id);
        if (error) alert(error.message);
        else router.refresh();
    };

    // Delete Lead (from beta_requests)
    const handleDeleteLead = async (id: string) => {
        if (!confirm("Opravdu smazat tohoto zájemce?")) return;
        const { error } = await supabase.from('beta_requests').delete().eq('id', id);
        if (error) alert(error.message);
        else router.refresh();
    };

    // Export CSV
    const downloadLeads = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "ID,Email,Created At,Poznamka\n"
            + leads.map(l => `${l.id},${l.email},${l.created_at},"${l.notes || ''}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "medica_leads.csv");
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-12">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Statistiky Průzkumu</h1>
                    <p className="text-slate-500">AI Sestra Survey Insights</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Users size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Hlasujících</div>
                            <div className="text-xl font-bold text-slate-900">{totalSessionsBase}</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                            <Mail size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Leadů (Emaily)</div>
                            <div className="text-xl font-bold text-slate-900">{totalLeads}</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <PieIcon size={20} />
                        </div>
                        <div>
                            <div className="text-xs text-slate-500 font-bold uppercase">Konverze</div>
                            <div className="text-xl font-bold text-slate-900">{conversionRate}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {statsByQuestion.map((q, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200"
                    >
                        <h3 className="text-lg font-bold text-slate-800 mb-6 min-h-[3rem]">{q.question}</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={q.data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={150}
                                        tick={{ fontSize: 11, fill: '#64748b' }}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f1f5f9' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {q.data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Feedback Feed */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="text-blue-500" />
                    Zpětná vazba (Vzkazy)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {feedbacks.map((item) => (
                        <div key={item.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative group">
                            <Quote className="absolute top-4 right-4 text-slate-100 -scale-x-100" size={40} />

                            <p className="text-slate-700 italic mb-4 relative z-10">"{item.selected_option}"</p>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-3 relative z-10">
                                <div className="text-xs text-slate-500">
                                    {new Date(item.created_at).toLocaleDateString('cs-CZ')}
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.author_email ? (
                                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full" title={item.author_email}>
                                            {item.author_email}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-slate-400 font-mono">Anonym</span>
                                    )}
                                    <button
                                        onClick={() => handleDeleteFeedback(item.id)}
                                        className="text-slate-300 hover:text-red-500 transition-colors"
                                        title="Smazat vzkaz"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {feedbacks.length === 0 && (
                        <div className="col-span-full text-center py-10 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                            Zatím žádné vzkazy.
                        </div>
                    )}
                </div>
            </div>

            {/* Leads Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-12">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800">Seznam zájemců (Early Adopters)</h3>
                    <button
                        onClick={downloadLeads}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Datum registrace</th>
                                <th className="px-6 py-4 w-1/3">Poznámka</th>
                                <th className="px-6 py-4 text-right">Akce</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leads.map((lead) => (
                                <tr key={lead.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {lead.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        {new Date(lead.created_at).toLocaleString('cs-CZ')}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                        {lead.notes || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDeleteLead(lead.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Smazat záznam"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {leads.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400 italic">
                                        Zatím žádné záznamy.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
