'use client';

import React, { useTransition, useState, useEffect } from 'react';
import {
    Calendar as CalendarIcon,
    List,
    Plus,
    AlertTriangle,
    CheckCircle,
    Clock,
    Mail,
    Phone,
    Trash2,
    Edit2,
    ArrowLeft,
    X,
    ChevronLeft,
    ChevronRight,
    Bell,
    Map,
    Settings,
    Palette,
    MoreVertical,
    Briefcase
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
    OperationalTask, TaskCategory,
    addTask, deleteTask, updateTask, completeTask,
    saveCategory, deleteCategory
} from './actions';
import { getIcon, ICON_MAP } from './icons';

interface ServisLogClientProps {
    initialTasks: OperationalTask[];
    initialCategories: TaskCategory[];
    organizationId: string;
}

// Helper for dynamic colors
const hexToRgba = (hex: string, alpha: number) => {
    // Basic hex parsing
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const r = parseInt(c.slice(0, 2).join(''), 16);
    const g = parseInt(c.slice(2, 4).join(''), 16);
    const b = parseInt(c.slice(4, 6).join(''), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function EventLogClient({ initialTasks, initialCategories, organizationId }: ServisLogClientProps) {
    const [isPending, startTransition] = useTransition();
    const [view, setView] = useState<'calendar' | 'list'>('list');
    const [showForm, setShowForm] = useState(false);
    const [showCategoryManager, setShowCategoryManager] = useState(false);

    // Optimistic State
    const [categories, setCategories] = useState<TaskCategory[]>(initialCategories);

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<OperationalTask>>({
        reminder_days: 7,
        is_recurring: false,
        // Default to first category if available
        category_id: initialCategories.length > 0 ? initialCategories[0].id : undefined
    });

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    // --- Helpers ---

    const getTaskCategory = (task: OperationalTask) => {
        if (task.category_id) {
            return categories.find(c => c.id === task.category_id);
        }
        // Fallback for legacy data mapping
        const legacyMap: Record<string, string> = {
            'revision': 'Revize',
            'order': 'Objednat',
            'admin': 'Administrativa',
            'other': 'Ostatní'
        };
        const legacyName = legacyMap[task.category || 'other'];
        // Try to find by name, or fallback to first, or generic
        return categories.find(c => c.name === legacyName) || categories[0];
    };

    // --- Handlers ---

    const resetForm = () => {
        setFormData({
            reminder_days: 7,
            is_recurring: false,
            category_id: categories.length > 0 ? categories[0].id : undefined
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleOpenAdd = (dateStr?: string) => {
        setFormData({
            reminder_days: 7,
            is_recurring: false,
            category_id: categories.length > 0 ? categories[0].id : undefined,
            due_date: dateStr || new Date().toISOString().split('T')[0]
        });
        setEditingId(null);
        setShowForm(true);
    };

    const handleOpenEdit = (task: OperationalTask) => {
        // Find correct category ID even if legacy
        let catId = task.category_id;
        if (!catId) {
            const cat = getTaskCategory(task);
            catId = cat?.id;
        }

        setFormData({ ...task, category_id: catId });
        setEditingId(task.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        startTransition(async () => {
            try {
                if (editingId) {
                    await updateTask(editingId, formData);
                } else {
                    await addTask(organizationId, formData);
                }
                resetForm();
            } catch (err) {
                alert('Chyba při ukládání: ' + err);
            }
        });
    };

    const handleDelete = (id: string) => {
        if (!confirm('Opravdu odstranit tento úkol?')) return;
        startTransition(async () => {
            await deleteTask(id);
            if (editingId === id) resetForm(); // Close form if deleting currently edited
        });
    };

    const handleComplete = (id: string) => {
        startTransition(async () => {
            await completeTask(id);
        });
    };

    const openEmailClient = (task: OperationalTask) => {
        if (!task.contact_email) return;
        const subject = `Dotaz k termínu: ${task.title}`;
        const body = `Dobrý den ${task.contact_name || ''},\n\nv naší ordinaci končí platnost ${task.title} dne ${new Date(task.due_date).toLocaleDateString()}. \n\nProsím o návrh termínu.\n\nS pozdravem,\nOrdinace`;
        window.location.href = `mailto:${task.contact_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    // --- Sub-Components ---

    const CategoryManager = () => {
        const [editingCat, setEditingCat] = useState<Partial<TaskCategory> | null>(null);

        const handleSaveCat = async () => {
            if (!editingCat || !editingCat.name || !editingCat.color) return;

            // Optimistic update logic could be complex without proper ID, relying on simple reload logic for now mostly
            // but we can update local state to feel snappy

            const tempId = editingCat.id || 'temp-' + Date.now();
            const newCat = { ...editingCat, id: tempId } as TaskCategory;

            if (editingCat.id) {
                setCategories(prev => prev.map(c => c.id === editingCat.id ? newCat : c));
            } else {
                setCategories(prev => [...prev, newCat]);
            }

            try {
                await saveCategory(editingCat, organizationId);
                setEditingCat(null);
                // In a real app we might want to refresh fully to get the real ID back
            } catch (e) {
                alert('Chyba: ' + e);
            }
        };

        const handleDeleteCat = async (id: string) => {
            if (!confirm('Smazat kategorii? Úkoly s touto kategorií ztratí přiřazení.')) return;
            setCategories(prev => prev.filter(c => c.id !== id));
            await deleteCategory(id);
        };

        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 h-[80vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-900">Správa Kategorií</h2>
                        <button onClick={() => setShowCategoryManager(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {categories.map(cat => (
                            <div key={cat.id} className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50">
                                <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-sm"
                                    style={{ backgroundColor: cat.color }}
                                >
                                    {getIcon(cat.icon, { className: 'w-5 h-5' })}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900">{cat.name}</h4>
                                </div>
                                <button
                                    onClick={() => setEditingCat(cat)}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                {!cat.is_system && (
                                    <button
                                        onClick={() => handleDeleteCat(cat.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <h3 className="text-sm font-bold text-slate-700 mb-3">{editingCat ? 'Upravit / Přidat' : 'Přidat novou kategorii'}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Název"
                                className="px-3 py-2 border rounded-lg text-sm bg-white text-slate-900"
                                value={editingCat?.name || ''}
                                onChange={e => setEditingCat(prev => ({ ...prev, name: e.target.value } as any))}
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    className="w-10 h-9 p-0.5 border rounded-lg cursor-pointer bg-white"
                                    value={editingCat?.color || '#3B82F6'}
                                    onChange={e => setEditingCat(prev => ({ ...prev, color: e.target.value } as any))}
                                />
                                <span className="text-xs text-slate-400 font-mono">{editingCat?.color}</span>
                            </div>
                        </div>

                        <div className="mt-3">
                            <label className="text-xs font-bold text-slate-500 mb-2 block">Ikona</label>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                                {Object.keys(ICON_MAP).map(iconKey => (
                                    <button
                                        key={iconKey}
                                        onClick={() => setEditingCat(prev => ({ ...prev, icon: iconKey } as any))}
                                        className={`p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all ${editingCat?.icon === iconKey ? 'bg-blue-100 ring-2 ring-blue-500' : 'text-slate-400'}`}
                                        title={iconKey}
                                    >
                                        {getIcon(iconKey, { className: 'w-5 h-5' })}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            {editingCat ? (
                                <>
                                    <button onClick={handleSaveCat} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">Uložit</button>
                                    <button onClick={() => setEditingCat(null)} className="px-4 py-2 border text-slate-600 rounded-lg hover:bg-slate-50">Zrušit</button>
                                </>
                            ) : (
                                <button onClick={() => setEditingCat({ color: '#3B82F6', icon: 'star', name: '' })} className="w-full py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-slate-400 hover:text-slate-700 font-medium flex justify-center items-center gap-2">
                                    <Plus className="w-4 h-4" /> Vytvořit novou
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const TimelineRoadmap = () => {
        const daysRange = 40;
        const now = new Date();
        const end = new Date();
        end.setDate(end.getDate() + daysRange);

        const relevantTasks = initialTasks.filter(t => {
            const d = new Date(t.due_date);
            return d >= new Date(now.toDateString()) && d <= end && t.status !== 'done';
        }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        if (relevantTasks.length === 0) return null;

        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8 overflow-visible relative break-inside-avoid">
                <div className="flex items-center gap-2 mb-8">
                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                        <Map className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900">Roadmapa (Následujících 40 dní)</h3>
                </div>

                <div className="relative min-h-[100px] space-y-8">
                    {/* Time labels fix */}
                    <div className="absolute -top-6 inset-x-0 flex justify-between text-xs text-slate-400 pointer-events-none select-none border-b border-slate-100 pb-2">
                        <span>Dnes</span>
                        <span>+10 dní</span>
                        <span>+20 dní</span>
                        <span>+30 dní</span>
                        <span>+40 dní</span>
                    </div>

                    <div className="pt-2 relative space-y-5">
                        {relevantTasks.map((task, i) => {
                            const due = new Date(task.due_date);
                            const maxMs = end.getTime() - now.getTime();
                            const taskMs = due.getTime() - now.getTime();
                            let percent = (taskMs / maxMs) * 100;
                            if (percent < 0) percent = 0;
                            if (percent > 100) percent = 100;

                            const cat = getTaskCategory(task);
                            const color = cat?.color || '#94a3b8';

                            return (
                                <div key={task.id} className="relative h-6 flex items-center group cursor-pointer z-10 hover:z-50" onClick={() => handleOpenEdit(task)}>
                                    {/* The Line */}
                                    <div className="absolute left-0 h-1.5 bg-slate-100 w-full rounded-full overflow-hidden">
                                        <div
                                            className="h-full transition-all duration-1000 opacity-40 group-hover:opacity-100"
                                            style={{ width: `${percent}%`, backgroundColor: color }}
                                        ></div>
                                    </div>

                                    {/* Dashed line extension for recurring */}
                                    {task.is_recurring && (
                                        <div
                                            className="absolute h-0.5 border-t-2 border-dashed border-slate-200 w-full opacity-50"
                                            style={{ left: `${percent}%`, width: `${98 - percent}%` }}
                                        ></div>
                                    )}

                                    {/* The Icon Dot */}
                                    <div
                                        className="absolute w-7 h-7 rounded-full border-2 border-white shadow-md z-20 transition-transform group-hover:scale-110 flex items-center justify-center text-white"
                                        style={{ left: `calc(${percent}% - 14px)`, backgroundColor: color }}
                                    >
                                        {getIcon(cat?.icon || 'circle', { className: 'w-3.5 h-3.5' })}
                                    </div>

                                    {/* Tooltip Label */}
                                    <div
                                        className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-all duration-200 z-30 pointer-events-none transform translate-y-2 group-hover:translate-y-0"
                                        style={{
                                            left: percent > 85 ? `auto` : `calc(${percent}% - 14px)`,
                                            right: percent > 85 ? `calc(${100 - percent}% - 14px)` : `auto`,
                                            display: 'flex',
                                            justifyContent: percent > 85 ? 'flex-end' : 'flex-start'
                                        }}
                                    >
                                        <div className="bg-slate-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-xl shadow-slate-400/20 whitespace-nowrap flex items-center gap-2">
                                            <span className="font-bold">{task.title}</span>
                                            <span className="opacity-75 text-[10px] border-l border-slate-600 pl-2">
                                                {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                                            </span>
                                        </div>
                                        {/* Little triangle arrow */}
                                        <div
                                            className="absolute -bottom-1 w-2 h-2 bg-slate-800 rotate-45"
                                            style={{
                                                left: percent > 85 ? 'auto' : '12px',
                                                right: percent > 85 ? '12px' : 'auto'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const ActionCenter = () => {
        const sortedTasks = [...initialTasks].sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        return (
            <div className="space-y-4">
                {sortedTasks.map(task => {
                    const cat = getTaskCategory(task);
                    const isDueSoon = new Date(task.due_date) < new Date(new Date().setDate(new Date().getDate() + 30)) && task.status !== 'done';

                    const color = cat?.color || '#64748b';
                    // Safe parsing for rgba
                    const safeColor = color.startsWith('#') ? color : '#64748b';
                    const bgStyle = { backgroundColor: hexToRgba(safeColor, 0.1), color: safeColor, borderColor: hexToRgba(safeColor, 0.2) };

                    return (
                        <div key={task.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:shadow-md bg-white ${task.status === 'done' ? 'opacity-60 grayscale' : ''}`}>

                            <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={() => handleOpenEdit(task)}>
                                <div className="p-3 rounded-lg border" style={bgStyle}>
                                    {getIcon(cat?.icon || 'circle', { className: 'w-5 h-5' })}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                        {task.title}
                                        {isDueSoon && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">! Termín</span>}
                                    </h4>
                                    <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                        <CalendarIcon className="w-3 h-3" />
                                        {new Date(task.due_date).toLocaleDateString('cs-CZ')}
                                        <span className="text-slate-300">|</span>
                                        <span className="px-1.5 py-0.5 rounded text-xs font-medium" style={bgStyle}>{cat?.name}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                {task.contact_email && task.status !== 'done' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); openEmailClient(task); }}
                                        className="flex-1 sm:flex-none flex items-center justify-center p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                                        title="Objednat emailem"
                                    >
                                        <Mail className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Objednat</span>
                                    </button>
                                )}

                                {task.status !== 'done' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleComplete(task.id); }}
                                        className="flex-1 sm:flex-none flex items-center justify-center p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-sm font-medium"
                                        title="Označit jako hotové"
                                    >
                                        <CheckCircle className="w-4 h-4 sm:mr-2" />
                                        <span className="hidden sm:inline">Hotovo</span>
                                    </button>
                                )}

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(task); }}
                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Upravit"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>

                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(task.id); }}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const CalendarView = () => {
        const monthsToShow = [0, 1, 2];

        const SingleMonthGrid = ({ offset }: { offset: number }) => {
            const displayDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
            const year = displayDate.getFullYear();
            const month = displayDate.getMonth();

            const firstDay = new Date(year, month, 1);
            const lastDay = new Date(year, month + 1, 0);
            const daysInMonth = lastDay.getDate();
            const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

            const days = [];
            for (let i = 0; i < startingDay; i++) days.push(null);
            for (let i = 1; i <= daysInMonth; i++) days.push(i);

            const monthName = displayDate.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });
            const isCurrentMonth = new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm mb-6 break-inside-avoid">
                    <div className={`flex justify-between items-center p-3 border-b border-slate-200 ${isCurrentMonth ? 'bg-blue-50/50' : 'bg-slate-50/50'}`}>
                        <h3 className={`font-bold text-lg capitalize ${isCurrentMonth ? 'text-blue-900' : 'text-slate-700'}`}>
                            {monthName}
                        </h3>
                    </div>
                    <div className="grid grid-cols-7 text-center bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-400 py-2 border-b border-slate-200">
                        <div>Po</div><div>Út</div><div>St</div><div>Čt</div><div>Pá</div><div>So</div><div>Ne</div>
                    </div>
                    <div className="grid grid-cols-7 auto-rows-fr">
                        {days.map((day, idx) => {
                            if (!day) return <div key={idx} className="bg-slate-50/30 min-h-[80px] border-b border-r border-slate-100 last:border-r-0"></div>;

                            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayTasks = initialTasks.filter(t => t.due_date === dateStr);
                            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleOpenAdd(dateStr)}
                                    className={`min-h-[80px] p-1 sm:p-2 border-b border-r border-slate-100 last:border-r-0 relative hover:bg-blue-50/30 transition-colors cursor-pointer group ${isToday ? 'bg-amber-50/30' : ''}`}
                                >
                                    <span className={`text-xs sm:text-sm font-medium w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-amber-500 text-white' : 'text-slate-700'}`}>{day}</span>
                                    <div className="mt-1 space-y-1">
                                        {dayTasks.map(t => {
                                            const cat = getTaskCategory(t);
                                            const color = cat?.color || '#64748b';
                                            const safeColor = color.startsWith('#') ? color : '#64748b';
                                            const bgStyle = { backgroundColor: hexToRgba(safeColor, 0.1), color: safeColor, borderColor: hexToRgba(safeColor, 0.2) };

                                            return (
                                                <div
                                                    key={t.id}
                                                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(t); }}
                                                    className="text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded border shadow-sm cursor-pointer truncate flex items-center gap-1 group/task hover:max-w-none hover:w-auto hover:absolute hover:z-50 hover:bg-white"
                                                    style={t.status === 'done' ? {} : bgStyle}
                                                    title={t.title}
                                                >
                                                    <div
                                                        className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0"
                                                        style={{ backgroundColor: color }}
                                                    >
                                                        {getIcon(cat?.icon || 'circle', { className: 'w-2.5 h-2.5' })}
                                                    </div>
                                                    <span className={t.status === 'done' ? 'line-through text-slate-400' : ''}>{t.title}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        };

        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors shadow-sm">
                        <ChevronLeft className="w-4 h-4" /> Předchozí
                    </button>
                    <button onClick={() => setCurrentDate(new Date())} className="text-sm font-bold text-blue-600 hover:underline">
                        Dnes
                    </button>
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 font-medium transition-colors shadow-sm">
                        Další <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-6">
                    {monthsToShow.map(offset => (
                        <SingleMonthGrid key={offset} offset={offset} />
                    ))}
                </div>

                <div className="text-center mt-4">
                    <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 3))} className="text-slate-400 hover:text-slate-600 text-sm flex flex-col items-center mx-auto gap-1">
                        <span className="block w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="block w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="block w-1 h-1 bg-slate-300 rounded-full"></span>
                        Načíst další měsíce
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-[100dvh] pb-12 bg-slate-50">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link href="/hub" className="mr-4 p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                                <ArrowLeft className="w-6 h-6" />
                            </Link>
                            <div className="h-8 w-8 relative mr-3 hidden sm:block">
                                <Image src="/logo.svg" alt="Logo" fill className="object-contain" />
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight"><span className="text-blue-600">EventLog</span> <span className="text-slate-400 font-normal">| Provozní Kalendář</span></h1>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setView('list')}
                                    className={`p-2 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <List className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setView('calendar')}
                                    className={`p-2 rounded-md text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <CalendarIcon className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => handleOpenAdd()}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm shadow-blue-200"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden sm:inline">Nový úkol</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="bg-red-100 p-3 rounded-lg text-red-600"><AlertTriangle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-slate-500">Blíží se termín</p>
                            <p className="text-2xl font-bold text-slate-900">{initialTasks.filter(t => t.status !== 'done' && new Date(t.due_date) < new Date(new Date().setDate(new Date().getDate() + 30))).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="bg-blue-100 p-3 rounded-lg text-blue-600"><CheckCircle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-slate-500">Všech aktivních</p>
                            <p className="text-2xl font-bold text-slate-900">{initialTasks.filter(t => t.status !== 'done').length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="bg-green-100 p-3 rounded-lg text-green-600"><CheckCircle className="w-6 h-6" /></div>
                        <div>
                            <p className="text-sm text-slate-500">Hotovo tento rok</p>
                            <p className="text-2xl font-bold text-slate-900">{initialTasks.filter(t => t.status === 'done').length}</p>
                        </div>
                    </div>
                </div>

                <TimelineRoadmap />

                {view === 'list' ? <ActionCenter /> : <CalendarView />}
            </main>

            {/* TASK FORM MODAL */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingId ? 'Upravit Úkol' : 'Nový Provozní Úkol'}
                            </h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600"><X /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Co je potřeba udělat?</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Např. Revize hasicích přístrojů"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-slate-900 bg-white"
                                        value={formData.title || ''}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Termín</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none text-slate-900 bg-white"
                                            value={formData.due_date || ''}
                                            onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="flex justify-between text-sm font-medium text-slate-700 mb-1">
                                            Kategorie
                                            <button
                                                type="button"
                                                onClick={() => setShowCategoryManager(true)}
                                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                            >
                                                <Settings className="w-3 h-3" /> Spravovat
                                            </button>
                                        </label>
                                        <select
                                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none bg-white text-slate-900"
                                            value={formData.category_id || (categories[0]?.id) || ''}
                                            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        >
                                            {categories.map(cat => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2"><Briefcase className="w-4 h-4" /> Kontakt (Automatizace)</h3>

                                    <input
                                        type="text"
                                        placeholder="Jméno firmy / technika"
                                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white"
                                        value={formData.contact_name || ''}
                                        onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="email"
                                            placeholder="Email (pro objednávky)"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white"
                                            value={formData.contact_email || ''}
                                            onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Telefon"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 bg-white"
                                            value={formData.contact_phone || ''}
                                            onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                                            <Bell className="w-4 h-4" /> Připomenout předem
                                        </label>
                                        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{formData.reminder_days} dní</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="60"
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        value={formData.reminder_days}
                                        onChange={e => setFormData({ ...formData, reminder_days: parseInt(e.target.value) })}
                                    />

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 mt-2">
                                        <div className="flex items-center gap-2">
                                            <input
                                                id="todo-recurring"
                                                type="checkbox"
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                checked={formData.is_recurring}
                                                onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                                            />
                                            <label htmlFor="todo-recurring" className="text-sm text-slate-700">Opakovat pravidelně</label>
                                        </div>
                                        {formData.is_recurring && (
                                            <select
                                                className="text-sm border border-slate-300 rounded-lg p-1 bg-white text-slate-900"
                                                value={formData.recurrence_interval || 'yearly'}
                                                onChange={e => setFormData({ ...formData, recurrence_interval: e.target.value as any })}
                                            >
                                                <option value="monthly">Měsíčně</option>
                                                <option value="biannual">Půlročně</option>
                                                <option value="yearly">Ročně</option>
                                            </select>
                                        )}
                                    </div>
                                </div>

                                <div className="opacity-50 pointer-events-none filter grayscale">
                                    <label className="flex items-center gap-2 text-sm text-slate-500">
                                        <input type="checkbox" disabled /> Synchronizovat do Google Kalendáře (Brzy)
                                    </label>
                                </div>

                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium">Zrušit</button>
                                <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all">
                                    {isPending ? 'Ukládám...' : (editingId ? 'Uložit změny' : 'Vytvořit úkol')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCategoryManager && <CategoryManager />}
        </div>
    );
}
