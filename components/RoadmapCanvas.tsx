"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Cpu, Globe, Brain, Monitor, Activity,
    CheckCircle2, Clock, X
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

// Small milestone markers between main nodes
interface Milestone {
    id: string;
    label: string;
    x: number;
    status: RoadmapStatus;
}

// Today's date marker
const TODAY_DATE = new Date('2026-02-04');
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
    { id: 'b1', label: 'Vize & Koncept', description: 'Definice vize pro modulární zdravotnický systém, který se přizpůsobí každé ordinaci.', x: 180, y: 180, status: 'done', connectedNodes: ['start'] },
    { id: 'b2', label: 'Tech Stack', description: 'Výběr moderních technologií: Next.js pro rychlost, Supabase pro data a AI modely pro inteligenci.', x: 240, y: 420, status: 'done', connectedNodes: ['start', 'core'] },
    { id: 'b3', label: 'Design System', description: 'Vytvoření unifikovaného vizuálního jazyka "Clean Medical" pro konzistentní zážitek.', x: 160, y: 400, status: 'done', connectedNodes: ['start'] },

    // Core phase bubbles
    { id: 'b4', label: 'Refactoring', description: 'Optimalizace kódu pro vyšší výkon a lepší škálovatelnost systému.', x: 550, y: 160, status: 'done', connectedNodes: ['core'] },
    { id: 'b5', label: 'VoiceLog MVP', description: 'První verze hlasového zadávání pro rychlé a přesné lékařské záznamy.', x: 620, y: 440, status: 'done', connectedNodes: ['core', 'business'] },
    { id: 'b6', label: 'Auth & DB', description: 'Implementace bezpečného přihlašování a robustní databázové struktury dle standardů.', x: 480, y: 380, status: 'done', connectedNodes: ['start', 'core'] },

    // Business phase bubbles
    { id: 'b7', label: 'Stripe Integrace', description: 'Bezpečná platební brána pro předplatné a jednorázové nákupy doplňků.', x: 980, y: 190, status: 'in-progress', connectedNodes: ['business'] },
    { id: 'b8', label: 'Admin Panel', description: 'Rozhraní pro správu uživatelů, licencí a globálního nastavení systému.', x: 1020, y: 410, status: 'in-progress', connectedNodes: ['business', 'ai'] },
    { id: 'b9', label: 'Kreditní systém', description: 'Flexibilní systém kreditů pro využívání pokročilých AI funkcí.', x: 900, y: 200, status: 'in-progress', connectedNodes: ['core', 'business'] },

    // AI phase bubbles
    { id: 'b10', label: 'Context Search', description: 'Inteligentní vyhledá vání v historii pacienta s pochopením lékařského kontextu.', x: 1350, y: 150, status: 'planned', connectedNodes: ['ai'] },
    { id: 'b11', label: 'Voice Control', description: 'Plné hlasové ovládání aplikace pro ruce volné během zákroků.', x: 1440, y: 430, status: 'planned', connectedNodes: ['ai', 'hw'] },
    { id: 'b12', label: 'RAG Model', description: 'Pokročilá AI s přístupem k vaší vlastní znalostní bázi a dokumentaci.', x: 1300, y: 420, status: 'planned', connectedNodes: ['business', 'ai'] },

    // Hardware phase bubbles
    { id: 'b13', label: 'Touch Kiosk', description: 'Samoobslužný terminál do čekárny pro odbavení pacientů.', x: 1750, y: 170, status: 'planned', connectedNodes: ['hw'] },
    { id: 'b14', label: 'Tablet PWA', description: 'Optimalizované rozhraní pro tablety umožňující práci v terénu.', x: 1840, y: 440, status: 'planned', connectedNodes: ['hw', 'eco'] },
    { id: 'b15', label: 'IoT Senzory', description: 'Integrace chytrých teploměrů a senzorů pro automatický sběr dat.', x: 1720, y: 390, status: 'planned', connectedNodes: ['ai', 'hw'] },

    // Ekosystém phase bubbles
    { id: 'b16', label: 'Nemocniční integrace', description: 'Napojení na nemocniční informační systémy (NIS) přes zabezpečené API.', x: 2150, y: 180, status: 'planned', connectedNodes: ['eco'] },
    { id: 'b17', label: 'Public Launch', description: 'Oficiální spuštění platformy pro širokou veřejnost a marketingová kampaň.', x: 2240, y: 420, status: 'planned', connectedNodes: ['eco'] },
    { id: 'b18', label: 'Marketplace', description: 'Obchod s aplikacemi třetích stran, které rozšiřují funkčnost Hubu.', x: 2180, y: 400, status: 'planned', connectedNodes: ['hw', 'eco'] },
];

// Milestones - Smaller dots between main nodes
const MILESTONES: Milestone[] = [
    // Between Start and Core (Leden - Únor)
    { id: 'm1', label: 'Výzkum potřeb doktorů', x: 280, status: 'done' },
    { id: 'm2', label: 'Prototyp UI', x: 360, status: 'done' },
    { id: 'm3', label: 'První testy', x: 440, status: 'done' },
    { id: 'm4', label: 'Database migrace', x: 520, status: 'done' },

    // Between Core and Business (Únor - Březen)
    { id: 'm5', label: 'Interní beta testing', x: 680, status: 'done' },
    { id: 'm6', label: 'První testovací klienti', x: 760, status: 'in-progress' },
    { id: 'm7', label: 'Zpětná vazba od lékařů', x: 840, status: 'in-progress' },
    { id: 'm8', label: 'Onboarding flow', x: 920, status: 'planned' },

    // Between Business and AI (Březen - Q2)
    { id: 'm9', label: 'Compliance GDPR', x: 1080, status: 'planned' },
    { id: 'm10', label: 'Multi-tenant setup', x: 1160, status: 'planned' },
    { id: 'm11', label: 'Pilotní ordinace', x: 1240, status: 'planned' },
    { id: 'm12', label: 'Marketing strategie', x: 1320, status: 'planned' },

    // Between AI and Hardware (Q2 - Q3)
    { id: 'm13', label: 'AI trénink modelu', x: 1480, status: 'planned' },
    { id: 'm14', label: 'Voice UX testing', x: 1560, status: 'planned' },
    { id: 'm15', label: 'Partnerství s nemocnicemi', x: 1640, status: 'planned' },
    { id: 'm16', label: 'HW prototyp', x: 1720, status: 'planned' },

    // Between Hardware and Ekosystém (Q3 - Q4)
    { id: 'm17', label: 'Field testing HW', x: 1880, status: 'planned' },
    { id: 'm18', label: 'API dokumentace', x: 1960, status: 'planned' },
    { id: 'm19', label: 'Developer SDK', x: 2040, status: 'planned' },
    { id: 'm20', label: 'Beta partneri', x: 2120, status: 'planned' },
];

export const RoadmapCanvas = ({ className = "" }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [activeSubNode, setActiveSubNode] = useState<{ id: string, label: string, description: string, x: number, y: number } | null>(null);

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

    return (
        <div className={`relative w-full h-full overflow-hidden ${className}`}>
            <motion.div
                ref={containerRef}
                className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none"
                drag
                dragConstraints={{ left: -2000, right: 200, top: -400, bottom: 400 }}
                dragElastic={0.1}
                dragMomentum={false}
                onClick={() => {
                    setActiveNodeId(null);
                    setActiveSubNode(null);
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
                            className="absolute z-5 group"
                            style={{ left: milestone.x, top: 300 }}
                        >
                            {/* Small dot */}
                            <div
                                className={`w-2.5 h-2.5 rounded-full ${dotColor} -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-150`}
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
                    {/* Vertical line */}
                    <div className="w-0.5 h-40 bg-gradient-to-b from-red-500 to-transparent -translate-x-1/2" />
                    {/* Label */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2">
                        <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse">
                            📍 DNES (4. 2. 2026)
                        </div>
                    </div>
                </div>

                {/* Floating Bubbles with connections */}
                {FLOATING_BUBBLES.map((bubble) => {
                    const isBubbleActive = activeSubNode?.id === bubble.id;

                    // Determine bubble styling based on status
                    let bubbleColor = 'bg-slate-50 text-slate-500 border-slate-200';
                    if (bubble.status === 'done') bubbleColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    if (bubble.status === 'in-progress') bubbleColor = 'bg-orange-50 text-orange-700 border-orange-200';

                    return (
                        <React.Fragment key={bubble.id}>
                            {/* Draw connection lines to all connected nodes */}
                            {bubble.connectedNodes.map(nodeId => {
                                const connectedNode = ROADMAP_DATA.find(n => n.id === nodeId);
                                if (!connectedNode) return null;

                                const currentPos = bubblePositions[bubble.id];

                                return (
                                    <svg
                                        key={`${bubble.id}-${nodeId}`}
                                        className="absolute top-0 left-0 pointer-events-none z-5"
                                        style={{ width: '100%', height: '100%' }}
                                    >
                                        <line
                                            x1={currentPos.x}
                                            y1={currentPos.y}
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
                                className="absolute z-15 group"
                                drag
                                dragMomentum={false}
                                dragElastic={0}
                                initial={{ x: bubble.x, y: bubble.y }}
                                whileDrag={{ cursor: 'grabbing' }}
                                onDragStart={() => {
                                    // Mark that we're dragging this bubble
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
                                    // Small delay to prevent click firing after drag
                                    setTimeout(() => {
                                        (window as any)[`dragging_${bubble.id}`] = false;
                                    }, 50);
                                }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Only open popup if we weren't dragging
                                        if (!(window as any)[`dragging_${bubble.id}`]) {
                                            setActiveNodeId(null);
                                            setActiveSubNode({
                                                id: bubble.id,
                                                label: bubble.label,
                                                description: bubble.description,
                                                x: bubble.x,
                                                y: bubble.y
                                            });
                                        }
                                    }}
                                    className={`
                                        px-4 py-2 rounded-full border-2 shadow-sm backdrop-blur-sm transition-all -translate-x-1/2 -translate-y-1/2
                                        hover:scale-110 hover:shadow-lg cursor-grab whitespace-nowrap
                                        ${bubbleColor}
                                        ${isBubbleActive ? 'scale-110 shadow-xl ring-2 ring-blue-400' : ''}
                                    `}
                                >
                                    <span className="text-xs font-semibold">{bubble.label}</span>
                                </button>
                            </motion.div>
                        </React.Fragment>
                    );
                })}

                {/* Main Nodes */}
                {ROADMAP_DATA.map((node) => {
                    const isActive = activeNodeId === node.id;
                    const Icon = node.icon;

                    // Styles
                    let colorClass = "bg-white text-slate-400 border-slate-200";
                    let ringClass = isActive ? "ring-4 ring-blue-50 border-blue-500" : "hover:border-blue-300";

                    if (node.status === 'done') {
                        colorClass = "bg-white text-blue-600 border-blue-200 shadow-lg";
                    } else if (node.status === 'in-progress') {
                        colorClass = "bg-white text-orange-500 border-orange-200 shadow-lg";
                    }

                    return (
                        <div key={node.id} className="absolute z-10" style={{ left: node.x, top: node.y }}>

                            {/* Main Node Orb */}
                            <motion.div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNodeId(isActive ? null : node.id);
                                    setActiveSubNode(null);
                                }}
                                className={`
                                    relative -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 
                                    flex items-center justify-center cursor-pointer transition-all duration-300 z-20
                                    ${colorClass} ${ringClass}
                                `}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Icon className="w-8 h-8" />

                                {/* Status Indicator */}
                                <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center
                                    ${node.status === 'done' ? 'bg-blue-500' : node.status === 'in-progress' ? 'bg-orange-500' : 'bg-slate-300'}
                                `}>
                                    {node.status === 'done' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    {node.status === 'in-progress' && <Activity className="w-3 h-3 text-white animate-spin-slow" />}
                                    {node.status === 'planned' && <Clock className="w-3 h-3 text-white" />}
                                </div>
                            </motion.div>

                            {/* Label */}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 text-center w-48">
                                <h3 className="font-bold text-lg text-slate-700">{node.title}</h3>
                                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold bg-white/80 inline-block px-2 rounded-full mt-1">
                                    {node.date}
                                </div>
                            </div>

                        </div>
                    );
                })}

                {/* Bubble Detail Popup - Positioned globally */}
                <AnimatePresence>
                    {activeSubNode && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute z-50 w-80 bg-slate-900/95 backdrop-blur-md text-white p-6 rounded-2xl shadow-2xl border border-slate-700"
                            style={{
                                left: activeSubNode.x + 80,
                                top: activeSubNode.y - 60
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={() => setActiveSubNode(null)}
                                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                            >
                                <X size={16} />
                            </button>
                            <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {activeSubNode.label}
                            </h4>
                            <p className="text-sm text-slate-300 leading-relaxed">
                                {activeSubNode.description}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

            </motion.div>

            {/* Hint Overlay */}
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                <span className="bg-white/80 backdrop-blur text-slate-400 text-xs px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    🖱️ Drag to explore
                </span>
            </div>
        </div>
    );
}
