"use client";

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, Cpu, Globe, Brain, Monitor, Activity,
    CheckCircle2, Clock, Info, X
} from 'lucide-react';

// --- TYPES ---
type RoadmapStatus = 'done' | 'in-progress' | 'planned';

interface SubNode {
    id: string;
    label: string;
    description: string;
}

interface RoadmapNode {
    id: string;
    title: string;
    date: string;
    icon: any;
    status: RoadmapStatus;
    subNodes: SubNode[];
    x: number;
    y: number;
}

// --- DATA ---
const ROADMAP_DATA: RoadmapNode[] = [
    {
        id: 'start',
        title: 'Start',
        date: 'Leden 2026',
        icon: Rocket,
        status: 'done',
        subNodes: [
            { id: 'start-1', label: 'Vize & Koncept', description: 'Definice vize pro modulární zdravotnický systém, který se přizpůsobí každé ordinaci.' },
            { id: 'start-2', label: 'Tech Stack', description: 'Výběr moderních technologií: Next.js pro rychlost, Supabase pro data a AI modely pro inteligenci.' },
            { id: 'start-3', label: 'Design System', description: 'Vytvoření unifikovaného vizuálního jazyka "Clean Medical" pro konzistentní uživatelský zážitek.' }
        ],
        x: 200,
        y: 300
    },
    {
        id: 'core',
        title: 'Core',
        date: 'Únor 2026',
        icon: Cpu,
        status: 'done',
        subNodes: [
            { id: 'core-1', label: 'Refactoring', description: 'Optimalizace kódu pro vyšší výkon a lepší škálovatelnost systému.' },
            { id: 'core-2', label: 'VoiceLog MVP', description: 'První verze hlasového zadávání pro rychlé a přesné lékařské záznamy.' },
            { id: 'core-3', label: 'Auth & DB', description: 'Implementace bezpečného přihlašování a robustní databázové struktury dle standardů.' }
        ],
        x: 600, // Even spacing
        y: 300
    },
    {
        id: 'business',
        title: 'Business',
        date: 'Březen 2026',
        icon: Activity,
        status: 'in-progress',
        subNodes: [
            { id: 'biz-1', label: 'Stripe Integrace', description: 'Bezpečná platební brána pro předplatné a jednorázové nákupy doplňků.' },
            { id: 'biz-2', label: 'Admin Panel', description: 'Rozhraní pro správu uživatelů, licencí a globálního nastavení systému.' },
            { id: 'biz-3', label: 'Kreditní systém', description: 'Flexibilní systém kreditů pro využívání pokročilých AI funkcí.' }
        ],
        x: 1000,
        y: 300
    },
    {
        id: 'ai',
        title: 'AI Brain',
        date: 'Q2 2026',
        icon: Brain,
        status: 'planned',
        subNodes: [
            { id: 'ai-1', label: 'Context Search', description: 'Inteligentní vyhledávání v historii pacienta s pochopením lékařského kontextu.' },
            { id: 'ai-2', label: 'Voice Control', description: 'Plné hlasové ovládání aplikace pro ruce volné během zákroků.' },
            { id: 'ai-3', label: 'RAG Model', description: 'Pokročilá AI s přístupem k vaší vlastní znalostní bázi a dokumentaci.' }
        ],
        x: 1400,
        y: 300
    },
    {
        id: 'hw',
        title: 'Hardware',
        date: 'Q3 2026',
        icon: Monitor,
        status: 'planned',
        subNodes: [
            { id: 'hw-1', label: 'Touch Kiosk', description: 'Samoobslužný terminál do čekárny pro odbavení pacientů.' },
            { id: 'hw-2', label: 'Tablet PWA', description: 'Optimalizované rozhraní pro tablety umožňující práci v terénu.' },
            { id: 'hw-3', label: 'IoT Senzory', description: 'Integrace chytrých teploměrů a senzorů pro automatický sběr dat.' }
        ],
        x: 1800,
        y: 300
    },
    {
        id: 'eco',
        title: 'Ekosystém',
        date: 'Q4 2026',
        icon: Globe,
        status: 'planned',
        subNodes: [
            { id: 'eco-1', label: 'Nemocniční integrace', description: 'Napojení na nemocniční informační systémy (NIS) přes zabezpečené API.' },
            { id: 'eco-2', label: 'Public Launch', description: 'Oficiální spuštění platformy pro širokou veřejnost a marketingová kampaň.' },
            { id: 'eco-3', label: 'Marketplace', description: 'Obchod s aplikacemi třetích stran, které rozšiřují funkčnost Hubu.' }
        ],
        x: 2200,
        y: 300
    }
];

export const RoadmapCanvas = ({ className = "" }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [activeSubNode, setActiveSubNode] = useState<{ id: string, label: string, description: string, x: number, y: number } | null>(null);

    // Close popup outside click logic could be complex in drag canvas, handling via close button mostly.

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
                drag="x"
                dragConstraints={{ left: -1600, right: 0 }}
                dragElastic={0.1}
            >
                {renderConnections()}

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

                            {/* Main Node Orb (The Crossroad Center) */}
                            <motion.div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveNodeId(isActive ? null : node.id);
                                    setActiveSubNode(null); // Close sub popup
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
                            <div className={`absolute top-12 left-1/2 -translate-x-1/2 text-center w-48 transition-opacity duration-300 ${isActive ? 'opacity-0' : 'opacity-100'}`}>
                                <h3 className="font-bold text-lg text-slate-700">{node.title}</h3>
                                <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold bg-white/80 inline-block px-2 rounded-full mt-1">
                                    {node.date}
                                </div>
                            </div>

                            {/* Sub Nodes (Satellites) */}
                            <AnimatePresence>
                                {isActive && (
                                    <>
                                        {/* Crossroad Arms (Visual lines connecting to subnodes) */}
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none -z-10"
                                        >
                                            <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
                                                {/* Top, Right, Bottom lines from center */}
                                                <line x1="150" y1="150" x2="150" y2="50" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 2" />
                                                <line x1="150" y1="150" x2="250" y2="150" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 2" />
                                                <line x1="150" y1="150" x2="150" y2="250" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 2" />
                                            </svg>
                                        </motion.div>

                                        {node.subNodes.map((sub, i) => {
                                            // Fixed positions for 3 subnodes: Top, Right, Bottom
                                            let offsetX = 0;
                                            let offsetY = 0;

                                            if (i === 0) { offsetX = 0; offsetY = -100; } // Top
                                            if (i === 1) { offsetX = 100; offsetY = 0; }  // Right
                                            if (i === 2) { offsetX = 0; offsetY = 100; }  // Bottom

                                            const isSelected = activeSubNode?.id === sub.id;

                                            return (
                                                <motion.div
                                                    key={sub.id}
                                                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                                    animate={{ opacity: 1, scale: 1, x: offsetX, y: offsetY }}
                                                    exit={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                                    transition={{ delay: i * 0.1, type: "spring", stiffness: 300, damping: 20 }}
                                                    // This container is centered on the node (0,0 relative), moves to offset
                                                    className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 z-30"
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Center popup on screen if feasible, otherwise near node.
                                                            // Since we are in a drag canvas, absolute positioning relative to node is best.
                                                            setActiveSubNode({
                                                                id: sub.id,
                                                                label: sub.label,
                                                                description: sub.description,
                                                                x: node.x + offsetX, // Absolute canvas coords
                                                                y: node.y // not used directly for render here but good for context
                                                            });
                                                        }}
                                                        className={`
                                                            flex items-center gap-2 px-4 py-2 rounded-full border shadow-md backdrop-blur-sm transition-all
                                                            ${isSelected
                                                                ? 'bg-blue-600 text-white border-blue-600 scale-110 shadow-lg shadow-blue-500/20'
                                                                : 'bg-white/90 text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600'}
                                                        `}
                                                    >
                                                        {isSelected ? <Info size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                                        <span className="text-sm font-semibold whitespace-nowrap">{sub.label}</span>
                                                    </button>
                                                </motion.div>
                                            );
                                        })}
                                    </>
                                )}
                            </AnimatePresence>

                            {/* Popup Overlay relative to the Node Group */}
                            <AnimatePresence>
                                {activeSubNode && activeNodeId === node.id && ( // Only show if this node is active parent
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute z-50 w-72 bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl shadow-xl border border-slate-700"
                                        style={{
                                            // Position logic: always to the right of the node cluster
                                            top: -60,
                                            left: 140
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Prevent click through
                                    >
                                        <button
                                            onClick={() => setActiveSubNode(null)}
                                            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                        <h4 className="font-bold text-base mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                                            {activeSubNode.label}
                                        </h4>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {activeSubNode.description}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                        </div>
                    );
                })}
            </motion.div>

            {/* Hint Overlay */}
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                <span className="bg-white/80 backdrop-blur text-slate-400 text-xs px-3 py-1 rounded-full shadow-sm border border-slate-100">
                    ↔ Drag to explore timeline
                </span>
            </div>
        </div>
    );
}
