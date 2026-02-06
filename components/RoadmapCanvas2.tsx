"use client";

import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Cpu, Globe, Brain, Monitor, Activity,
    CheckCircle2, Clock, X, Lightbulb, Layers, Palette,
    RefreshCw, Database, CreditCard, LayoutDashboard,
    Coins, Search, Mic2, BrainCircuit, Tablet, Wifi,
    Hospital, ShoppingBag, Mic
} from 'lucide-react';

// --- TYPES ---
type RoadmapStatus = 'done' | 'in-progress' | 'planned';

// Floating bubbles - independent from nodes, can connect to multiple nodes
interface FloatingBubble {
    id: string;
    label: string;
    description: string;
    x: number; // Horizontal position
    y: number; // Vertical position (above or below timeline)
    status: RoadmapStatus;
    connectedNodes: string[]; // IDs of nodes this bubble connects to
    icon?: any;
}

interface RoadmapNode {
    id: string;
    title: string;
    date: string;
    icon: any;
    status: RoadmapStatus;
    x: number;
    y: number;
}

interface Milestone {
    id: string;
    label: string;
    x: number;
    status: RoadmapStatus;
}

// Today's date marker
const TODAY_X = 350; // Position between Start and Core

// --- DATA ---
const ROADMAP_DATA: RoadmapNode[] = [
    {
        id: 'start',
        title: 'Start',
        date: 'Leden 2026',
        icon: Rocket,
        status: 'done',
        x: 200,
        y: 300
    },
    {
        id: 'core',
        title: 'Core',
        date: 'Únor 2026',
        icon: Cpu,
        status: 'done',
        x: 600,
        y: 300
    },
    {
        id: 'business',
        title: 'Business',
        date: 'Březen 2026',
        icon: Activity,
        status: 'in-progress',
        x: 1000,
        y: 300
    },
    {
        id: 'ai',
        title: 'AI Brain',
        date: 'Q2 2026',
        icon: Brain,
        status: 'planned',
        x: 1400,
        y: 300
    },
    {
        id: 'hw',
        title: 'Hardware',
        date: 'Q3 2026',
        icon: Monitor,
        status: 'planned',
        x: 1800,
        y: 300
    },
    {
        id: 'eco',
        title: 'Ekosystém',
        date: 'Q4 2026',
        icon: Globe,
        status: 'planned',
        x: 2200,
        y: 300
    }
];

// Floating Bubbles - ovální bubliny rozmístěné nad a pod timeline
const FLOATING_BUBBLES: FloatingBubble[] = [
    // Start phase bubbles
    { id: 'b1', label: 'Vize & Koncept', description: 'Definice vize pro modulární zdravotnický systém.', x: 180, y: 180, status: 'done', connectedNodes: ['start'], icon: Lightbulb },
    { id: 'b2', label: 'Tech Stack', description: 'Next.js, Supabase, AI modely.', x: 240, y: 420, status: 'done', connectedNodes: ['start', 'core'], icon: Layers },
    { id: 'b3', label: 'Design System', description: 'Unifikovaný vizuální jazyk "Clean Medical".', x: 160, y: 400, status: 'done', connectedNodes: ['start'], icon: Palette },

    // Core phase bubbles
    { id: 'b4', label: 'Refactoring', description: 'Optimalizace kódu pro vyšší výkon.', x: 550, y: 160, status: 'done', connectedNodes: ['core'], icon: RefreshCw },
    { id: 'b5', label: 'VoiceLog MVP', description: 'První verze hlasového zadávání.', x: 620, y: 440, status: 'done', connectedNodes: ['core', 'business'], icon: Mic },
    { id: 'b6', label: 'Auth & DB', description: 'Bezpečné přihlašování a databáze.', x: 480, y: 380, status: 'done', connectedNodes: ['start', 'core'], icon: Database },

    // Business phase bubbles
    { id: 'b7', label: 'Stripe Integrace', description: 'Platební brána pro předplatné.', x: 980, y: 190, status: 'in-progress', connectedNodes: ['business'], icon: CreditCard },
    { id: 'b8', label: 'Admin Panel', description: 'Správa uživatelů a licencí.', x: 1020, y: 410, status: 'in-progress', connectedNodes: ['business', 'ai'], icon: LayoutDashboard },
    { id: 'b9', label: 'Kreditní systém', description: 'Flexibilní systém pro AI funkce.', x: 900, y: 200, status: 'in-progress', connectedNodes: ['core', 'business'], icon: Coins },

    // AI phase bubbles
    { id: 'b10', label: 'Context Search', description: 'Inteligentní vyhledávání v historii.', x: 1350, y: 150, status: 'planned', connectedNodes: ['ai'], icon: Search },
    { id: 'b11', label: 'Voice Control', description: 'Plné hlasové ovládání aplikace.', x: 1440, y: 430, status: 'planned', connectedNodes: ['ai', 'hw'], icon: Mic2 },
    { id: 'b12', label: 'RAG Model', description: 'AI s přístupem ke znalostní bázi.', x: 1300, y: 420, status: 'planned', connectedNodes: ['business', 'ai'], icon: BrainCircuit },

    // Hardware phase bubbles
    { id: 'b13', label: 'Touch Kiosk', description: 'Samoobslužný terminál do čekárny.', x: 1750, y: 170, status: 'planned', connectedNodes: ['hw'], icon: Tablet },
    { id: 'b14', label: 'Tablet PWA', description: 'Optimalizované rozhraní pro tablety.', x: 1840, y: 440, status: 'planned', connectedNodes: ['hw', 'eco'], icon: Tablet },
    { id: 'b15', label: 'IoT Senzory', description: 'Chytré teploměry a senzory.', x: 1720, y: 390, status: 'planned', connectedNodes: ['ai', 'hw'], icon: Wifi },

    // Ekosystém phase bubbles
    { id: 'b16', label: 'Nemocniční integrace', description: 'Napojení na NIS systémy.', x: 2150, y: 180, status: 'planned', connectedNodes: ['eco'], icon: Hospital },
    { id: 'b17', label: 'Public Launch', description: 'Oficiální spuštění platformy.', x: 2240, y: 420, status: 'planned', connectedNodes: ['eco'], icon: Rocket },
    { id: 'b18', label: 'Marketplace', description: 'Obchod s aplikacemi třetích stran.', x: 2180, y: 400, status: 'planned', connectedNodes: ['hw', 'eco'], icon: ShoppingBag },
];

// Milestones - Smaller dots between main nodes
const MILESTONES: Milestone[] = [
    { id: 'm1', label: 'Výzkum potřeb', x: 280, status: 'done' },
    { id: 'm2', label: 'Prototyp UI', x: 360, status: 'done' },
    { id: 'm3', label: 'První testy', x: 440, status: 'done' },
    { id: 'm4', label: 'DB migrace', x: 520, status: 'done' },
    { id: 'm5', label: 'Beta testing', x: 680, status: 'done' },
    { id: 'm6', label: 'První klienti', x: 760, status: 'in-progress' },
    { id: 'm7', label: 'Feedback', x: 840, status: 'in-progress' },
    { id: 'm8', label: 'Onboarding', x: 920, status: 'planned' },
    { id: 'm9', label: 'GDPR', x: 1080, status: 'planned' },
    { id: 'm10', label: 'Multi-tenant', x: 1160, status: 'planned' },
    { id: 'm11', label: 'Pilot', x: 1240, status: 'planned' },
    { id: 'm12', label: 'Marketing', x: 1320, status: 'planned' },
    { id: 'm13', label: 'Trénink AI', x: 1480, status: 'planned' },
    { id: 'm14', label: 'Voice UX', x: 1560, status: 'planned' },
    { id: 'm15', label: 'Partnerství', x: 1640, status: 'planned' },
    { id: 'm16', label: 'HW prototyp', x: 1720, status: 'planned' },
    { id: 'm17', label: 'Field testing', x: 1880, status: 'planned' },
    { id: 'm18', label: 'API docs', x: 1960, status: 'planned' },
    { id: 'm19', label: 'SDK', x: 2040, status: 'planned' },
    { id: 'm20', label: 'Beta partneři', x: 2120, status: 'planned' }
];

export const RoadmapCanvas = ({ className = "" }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [activeBubble, setActiveBubble] = useState<FloatingBubble | null>(null);
    const [bubbleNotes, setBubbleNotes] = useState<Record<string, string>>({});

    // Track bubble positions for dynamic connection updates
    const [bubblePositions, setBubblePositions] = useState<Record<string, { x: number; y: number }>>(
        FLOATING_BUBBLES.reduce((acc, bubble) => {
            acc[bubble.id] = { x: bubble.x, y: bubble.y };
            return acc;
        }, {} as Record<string, { x: number; y: number }>)
    );

    // Draw straight line connections
    const renderConnections = () => {
        return (
            <div className="absolute top-[300px] left-0 h-1 bg-slate-200 w-[2400px] -translate-y-1/2 z-0" />
        );
    };

    const handleSaveNote = (bubbleId: string, note: string) => {
        setBubbleNotes(prev => ({ ...prev, [bubbleId]: note }));
    };

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            <motion.div
                ref={containerRef}
                className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none"
                drag
                dragConstraints={{ left: -3000, right: 1000, top: -1500, bottom: 1500 }}
                dragElastic={0.1}
                dragMomentum={false}
                animate={{ x: [0, -1200, 0] }}
                transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
                onClick={() => {
                    setActiveNodeId(null);
                    // Don't close bubble modal here, strict handling in bubble click
                }}
            >
                {renderConnections()}

                {/* Milestone Dots */}
                {MILESTONES.map((milestone) => {
                    let dotColor = 'bg-slate-200';
                    if (milestone.status === 'done') dotColor = 'bg-blue-400';
                    if (milestone.status === 'in-progress') dotColor = 'bg-orange-400';

                    return (
                        <div
                            key={milestone.id}
                            className="absolute z-5 group pointer-events-none" // pointer-events-none to prevent blocking drag
                            style={{ left: milestone.x, top: 300 }}
                        >
                            {/* Small dot */}
                            <div
                                className={`w-2.5 h-2.5 rounded-full ${dotColor} -translate-x-1/2 -translate-y-1/2 transition-all group-hover:scale-150`}
                            />
                            {/* Hover label */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                <div className="bg-slate-900/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg">
                                    {milestone.label}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Today's Date Marker */}
                <div
                    className="absolute z-20 pointer-events-none"
                    style={{ left: TODAY_X, top: 200 }}
                >
                    <div className="w-0.5 h-40 bg-gradient-to-b from-red-500 to-transparent -translate-x-1/2" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2">
                        <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse">
                            📍 DNES
                        </div>
                    </div>
                </div>

                {/* Floating Bubbles with connections */}
                {FLOATING_BUBBLES.map((bubble) => {
                    const isBubbleActive = activeBubble?.id === bubble.id;
                    const Icon = bubble.icon || Lightbulb;

                    // Determine bubble styling modifiers based on status
                    let statusColor = 'bg-slate-100 text-slate-500';
                    if (bubble.status === 'done') statusColor = 'bg-blue-100 text-blue-600';
                    if (bubble.status === 'in-progress') statusColor = 'bg-orange-100 text-orange-600';

                    const currentPos = bubblePositions[bubble.id];
                    const isBelowLine = currentPos.y > 300;

                    // Connection points
                    const sourceX = currentPos.x + 96; // Center of w-48 (192px / 2)
                    const sourceY = isBelowLine ? currentPos.y : currentPos.y + 80; // Top if below, Bottom if above (approx height 80-90px)

                    return (
                        <React.Fragment key={bubble.id}>
                            {/* Draw connection lines */}
                            {bubble.connectedNodes.map(nodeId => {
                                const connectedNode = ROADMAP_DATA.find(n => n.id === nodeId);
                                if (!connectedNode) return null;

                                return (
                                    <svg
                                        key={`${bubble.id}-${nodeId}`}
                                        className="absolute top-0 left-0 pointer-events-none z-0"
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        <line
                                            x1={sourceX}
                                            y1={sourceY}
                                            x2={connectedNode.x}
                                            y2={connectedNode.y}
                                            stroke={bubble.status === 'done' ? '#93C5FD' : bubble.status === 'in-progress' ? '#FDBA8B' : '#E2E8F0'}
                                            strokeWidth="1.5"
                                            strokeDasharray="4 3"
                                            opacity="0.4"
                                        />
                                    </svg>
                                );
                            })}

                            {/* Bubble itself - Draggable */}
                            <motion.div
                                className="absolute z-30" // Increased Z-index
                                onPointerDown={(e) => e.stopPropagation()} // PREVENT PARENT CANVAS DRAG
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                initial={{ x: bubble.x, y: bubble.y }}
                                whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                                onDragStart={() => {
                                    (window as any)[`dragging_${bubble.id}`] = true;
                                }}
                                onDrag={(event, info) => {
                                    setBubblePositions(prev => ({
                                        ...prev,
                                        [bubble.id]: {
                                            x: bubble.x + info.offset.x,
                                            y: bubble.y + info.offset.y
                                        }
                                    }));
                                }}
                                onDragEnd={() => {
                                    setTimeout(() => {
                                        (window as any)[`dragging_${bubble.id}`] = false;
                                    }, 50);
                                }}
                            >
                                <div
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (!(window as any)[`dragging_${bubble.id}`]) {
                                            setActiveBubble(bubble);
                                        }
                                    }}
                                    className={`
                                        bg-white p-3 rounded-2xl shadow-xl border border-slate-100 
                                        flex items-center gap-3 w-48 transition-all duration-300
                                        hover:scale-105 hover:shadow-2xl hover:border-blue-200 cursor-grab active:cursor-grabbing select-none
                                        ${isBubbleActive ? 'ring-2 ring-blue-500 shadow-2xl scale-105' : ''}
                                    `}
                                >
                                    <div className={`p-2 rounded-xl flex-shrink-0 ${statusColor}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="font-bold text-sm text-slate-800 leading-tight">{bubble.label}</div>
                                        <div className="text-xs text-slate-400 truncate mt-0.5">{bubble.description}</div>
                                    </div>
                                </div>
                            </motion.div>
                        </React.Fragment>
                    );
                })}

                {/* Main Nodes */}
                {ROADMAP_DATA.map((node) => {
                    const isActive = activeNodeId === node.id;
                    const Icon = node.icon;

                    let colorClass = "bg-white text-slate-400 border-slate-200";
                    let ringClass = isActive ? "ring-4 ring-blue-50 border-blue-500" : "hover:border-blue-300";

                    if (node.status === 'done') {
                        colorClass = "bg-white text-blue-600 border-blue-200 shadow-lg";
                    } else if (node.status === 'in-progress') {
                        colorClass = "bg-white text-orange-500 border-orange-200 shadow-lg";
                    }

                    return (
                        <div key={node.id} className="absolute z-10" style={{ left: node.x, top: node.y }}>
                            <motion.div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNodeId(isActive ? null : node.id);
                                }}
                                className={`
                                    relative -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 
                                    flex items-center justify-center cursor-pointer transition-all duration-300 z-20
                                    ${colorClass} ${ringClass}
                                `}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Icon className="w-8 h-8" />
                                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center
                                    ${node.status === 'done' ? 'bg-blue-500' : node.status === 'in-progress' ? 'bg-orange-500' : 'bg-slate-300'}
                                `}>
                                    {node.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    {node.status === 'in-progress' && <Activity className="w-3 h-3 text-white animate-spin-slow" />}
                                    {node.status === 'planned' && <Clock className="w-3 h-3 text-white" />}
                                </div>
                            </motion.div>

                            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center w-48 pointer-events-none">
                                <h3 className="font-bold text-lg text-slate-700">{node.title}</h3>
                                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold bg-white/80 inline-block px-2 rounded-full mt-1">
                                    {node.date}
                                </div>
                            </div>
                        </div>
                    );
                })}

            </motion.div>

            {/* Bubble Detail Modal - Centered Overlay with Note Editing */}
            <AnimatePresence>
                {activeBubble && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setActiveBubble(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden z-10"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-2xl ${activeBubble.status === 'done' ? 'bg-blue-100 text-blue-600' : activeBubble.status === 'in-progress' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {activeBubble.icon ? <activeBubble.icon size={28} /> : <Lightbulb size={28} />}
                                    </div>
                                    <div>
                                        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                            {activeBubble.status === 'done' ? 'Hotovo' : activeBubble.status === 'in-progress' ? 'Ve vývoji' : 'Plánováno'}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">{activeBubble.label}</h3>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setActiveBubble(null)}
                                    className="p-2 -mr-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-6">
                                <p className="text-slate-600 mb-6 leading-relaxed">
                                    {activeBubble.description}
                                </p>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                                    <div className="flex items-center gap-2 mb-2 text-blue-600 font-semibold text-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                        Moje poznámka
                                    </div>
                                    <textarea
                                        className="w-full bg-transparent border-none p-0 text-slate-700 placeholder:text-slate-400 focus:ring-0 text-sm leading-relaxed resize-none min-h-[100px]"
                                        placeholder="Zde si můžete napsat vlastní poznámky k tomuto bodu..."
                                        value={bubbleNotes[activeBubble.id] || ''}
                                        onChange={(e) => handleSaveNote(activeBubble.id, e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setActiveBubble(null)}
                                    className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all text-sm"
                                >
                                    Zavřít
                                </button>
                                <button
                                    onClick={() => setActiveBubble(null)}
                                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-blue-600 transition-all shadow-lg hover:shadow-blue-500/20 text-sm"
                                >
                                    Uložit poznámky
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Hint Overlay */}
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                <span className="bg-white/80 backdrop-blur text-slate-400 text-xs px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    🖱️ Drag to explore
                </span>
            </div>
        </div>
    );
}
