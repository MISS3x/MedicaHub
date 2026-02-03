"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { motion, useMotionValue, MotionValue, animate, useTransform } from "framer-motion";
import { Mic, Calendar, Users, Thermometer, Pill, Sparkles, Activity, UserCog, BarChart3, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { VoiceMedicaOrb } from "./components/VoiceMedicaOrb";
import { AppOrb } from "./components/AppOrb";
import { TaskWidget } from "./components/TaskWidget";
import { ConnectionLayer } from "./components/ConnectionLayer";
import { SubNode } from "./components/SubNode";
import { LayoutMap } from "./components/types";

// 1. MASTER CONFIG
const APP_DEFINITIONS = [
    { id: 'settings', label: 'Účet', icon: UserCog, href: '/settings', color: 'text-slate-600', alwaysActive: true },
    { id: 'eventlog', label: 'EventLog', icon: Calendar, href: '/eventlog', color: 'text-orange-500', alwaysActive: true },
    { id: 'medlog', label: 'MedLog', icon: Pill, href: '/medlog', color: 'text-emerald-500', alwaysActive: true },
    { id: 'termolog', label: 'TermoLog', icon: Thermometer, href: '/termolog', color: 'text-blue-500', alwaysActive: true },
    { id: 'sterilog', label: 'SteriLog', icon: Sparkles, href: '/sterilog', color: 'text-purple-500', alwaysActive: true },
    // Planned / Future
    { id: 'voicelog', label: 'VoiceLog', icon: Mic, href: '#', color: 'text-rose-500', isComingSoon: true },
    { id: 'patients', label: 'Pacienti', icon: Users, href: '#', color: 'text-sky-500', isComingSoon: true },
    { id: 'reporty', label: 'Reporty', icon: BarChart3, href: '#', color: 'text-indigo-500', isComingSoon: true },
] as const;

interface DashboardClientProps {
    initialLayout: LayoutMap | null;
    userId?: string;
    activeAppCodes?: string[];
    isPro?: boolean;
    credits?: number;
    brainEnabled?: boolean;
    tasks?: { id: string, title: string, due_date: string, status: string }[];
    recentTemps?: { value: number, recorded_at: string }[];
    recentMeds?: { medication_name: string, administered_at: string }[];
}

export const DashboardClient = ({
    initialLayout,
    userId,
    activeAppCodes = [],
    isPro = false,
    credits = 0,
    brainEnabled = false,
    tasks = [],
    recentTemps = [],
    recentMeds = []
}: DashboardClientProps) => {
    const supabase = createClient();
    const containerRef = useRef<HTMLDivElement>(null);
    const [isBrainActive, setIsBrainActive] = useState(false);
    const [mounted, setMounted] = useState(false);

    // PAN MODE (CAD-like canvas panning)
    const [isPanMode, setIsPanMode] = useState(false);
    const viewportOffsetX = useMotionValue(0);
    const viewportOffsetY = useMotionValue(0);

    // 2. DYNAMIC ORB GENERATION
    const orbs = useMemo(() => {
        // Generate random floating params once per orb (stable across renders)
        const brain = {
            id: 'brain',
            type: 'brain',
            label: 'VoiceMedica',
            isLocked: false,
            icon: Activity,
            href: '#',
            color: '',
            floating: {
                duration: 6 + Math.random() * 3,
                delay: Math.random() * 2
            }
        };

        const appOrbs = APP_DEFINITIONS.map(app => {
            // Unfinished apps are always locked
            if ((app as any).isComingSoon) {
                return {
                    ...app,
                    type: 'app',
                    isLocked: true,
                    floating: {
                        duration: 6 + Math.random() * 3,
                        delay: Math.random() * 2
                    }
                };
            }

            const isActive = (app as any).alwaysActive || isPro || activeAppCodes.includes(app.id) || (app.id === 'eventlog' && activeAppCodes.includes('servislog'));

            return {
                ...app,
                type: 'app',
                isLocked: !isActive,
                floating: {
                    duration: 6 + Math.random() * 3,
                    delay: Math.random() * 2
                }
            };
        });

        const taskOrbs = tasks.map((t, i) => ({
            id: `task-${t.id}`,
            // @ts-ignore
            originalId: t.id,
            type: 'task',
            title: t.title,
            date: t.due_date,
            status: t.status,
            label: 'Task',
            isLocked: false,
            // Visual config
            // We can assign a pseudo-slot or let it float
            slot: 'eventlog',
            floating: {
                duration: 6 + Math.random() * 3,
                delay: Math.random() * 2
            }
        }));



        // SUB-NODES (only for ACTIVE apps) - DYNAMIC FROM DATABASE
        const allSubNodes: any[] = [];

        // 1. EventLog subnodes (from operational_tasks)
        const eventlogApp = appOrbs.find(a => a.id === 'eventlog');
        if (eventlogApp && !eventlogApp.isLocked && tasks.length > 0) {
            tasks.forEach((task, i) => {
                allSubNodes.push({
                    id: `event-task-${task.id}`,
                    label: task.title,
                    parentId: 'eventlog',
                    offset: { x: -100 + (i * 120), y: -90 },
                    type: 'subnode',
                    color: 'orange',
                    isLocked: false,
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 2. TermoLog subnodes (recent temperatures)
        const termologApp = appOrbs.find(a => a.id === 'termolog');
        if (termologApp && !termologApp.isLocked && recentTemps.length > 0) {
            recentTemps.forEach((temp, i) => {
                allSubNodes.push({
                    id: `termo-${i}`,
                    label: `${temp.value}°C`,
                    value: temp.value,
                    parentId: 'termolog',
                    offset: { x: -70 + (i * 100), y: -90 },
                    type: 'subnode',
                    color: 'blue',
                    isLocked: false,
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 3. MedLog subnodes (recent medications)
        const medlogApp = appOrbs.find(a => a.id === 'medlog');
        if (medlogApp && !medlogApp.isLocked && recentMeds.length > 0) {
            recentMeds.forEach((med, i) => {
                allSubNodes.push({
                    id: `med-${i}`,
                    label: med.medication_name,
                    parentId: 'medlog',
                    offset: { x: -80 + (i * 120), y: -90 },
                    type: 'subnode',
                    color: 'green',
                    isLocked: false,
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 4. SteriLog subnodes (placeholder - coming soon)
        const sterilogApp = appOrbs.find(a => a.id === 'sterilog');
        if (sterilogApp && !sterilogApp.isLocked) {
            allSubNodes.push({
                id: 'steri-placeholder',
                label: 'Připravujeme',
                parentId: 'sterilog',
                offset: { x: 0, y: -90 },
                type: 'subnode',
                color: 'purple',
                isLocked: false,
                floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
            });
        }

        // 5. VoiceLog subnodes (placeholder - coming soon)
        const voicelogApp = appOrbs.find(a => a.id === 'voicelog');
        if (voicelogApp && !voicelogApp.isLocked) {
            allSubNodes.push({
                id: 'voice-placeholder',
                label: 'Brzy',
                parentId: 'voicelog',
                offset: { x: 0, y: -90 },
                type: 'subnode',
                color: 'pink',
                isLocked: false,
                floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
            });
        }

        // 6. Reporty subnodes (placeholder - coming soon)
        const reportyApp = appOrbs.find(a => a.id === 'reporty');
        if (reportyApp && !reportyApp.isLocked) {
            allSubNodes.push({
                id: 'reporty-placeholder',
                label: 'V přípravě',
                parentId: 'reporty',
                offset: { x: 0, y: -90 },
                type: 'subnode',
                color: 'teal',
                isLocked: false,
                floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
            });
        }

        return [brain, ...appOrbs, ...taskOrbs, ...allSubNodes];
    }, [activeAppCodes, isPro, tasks, recentTemps, recentMeds]);

    // 3. MOTION VALUES
    const orbPositions = orbs.map((orb, index) => {
        let defaultX = 600;
        let defaultY = 400;

        const storedPos = initialLayout?.[orb.id];

        // eslint-disable-next-line react-hooks/rules-of-hooks
        const x = useMotionValue(storedPos?.x ?? defaultX);
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const y = useMotionValue(storedPos?.y ?? defaultY);

        return { id: orb.id, x, y };
    });

    const positionsMap = useMemo(() => {
        return orbPositions.reduce((acc, curr) => {
            acc[curr.id] = { x: curr.x, y: curr.y };
            return acc;
        }, {} as Record<string, { x: MotionValue<number>, y: MotionValue<number> }>);
    }, [orbPositions]);

    // 4. MOUNT EFFECT & RESPONSIVE RE-CENTERING & ENTRY ANIMATION
    useEffect(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        // Visual slots configuration
        const slotConfig: Record<string, { angle: number, distScale: number }> = {
            'reporty': { angle: -90, distScale: 1.0 },
            'medlog': { angle: -45, distScale: 1.1 },
            'patients': { angle: 0, distScale: 1.2 },
            'eventlog': { angle: 45, distScale: 1.1 },
            'termolog': { angle: 90, distScale: 1.0 },
            'settings': { angle: 135, distScale: 1.1 },
            'sterilog': { angle: 180, distScale: 1.2 },
            'voicelog': { angle: 225, distScale: 1.1 },
        };

        orbPositions.forEach((pos) => {
            const orb = orbs.find(o => o.id === pos.id)!;

            // 1. Determine Target Position
            let targetX = cx;
            let targetY = cy;

            if (orb.type === 'brain') {
                targetX = cx;
                targetY = cy;
            } else {
                // Check if user has a saved position
                const saved = initialLayout?.[orb.id];
                if (saved) {
                    targetX = saved.x;
                    targetY = saved.y;
                } else {
                    // Use default slot config
                    const config = slotConfig[orb.id];
                    if (config) {
                        const radiusBase = Math.min(window.innerWidth, window.innerHeight) * 0.35;
                        const radians = config.angle * (Math.PI / 180);
                        const r = radiusBase * config.distScale;
                        targetX = cx + Math.cos(radians) * r;
                        targetY = cy + Math.sin(radians) * r;
                    } else {
                        // Fallback random
                        targetX = cx + (Math.random() - 0.5) * 200;
                        targetY = cy + (Math.random() - 0.5) * 200;

                        // Task Positioning override
                        if (orb.type === 'task') {
                            const eventLogConfig = slotConfig['eventlog'];
                            const angle = eventLogConfig.angle + (Math.random() * 20 - 10); // Slight spread
                            const distScale = eventLogConfig.distScale + 0.3 + (Math.random() * 0.2); // Further out

                            const radiusBase = Math.min(window.innerWidth, window.innerHeight) * 0.35;
                            const radians = angle * (Math.PI / 180);
                            const r = radiusBase * distScale;

                            targetX = cx + Math.cos(radians) * r;
                            targetY = cy + Math.sin(radians) * r;
                        }
                    }
                }

                // SUBNODE positioning: Follow parent with offset
                if (orb.type === 'subnode' && (orb as any).parentId) {
                    const parentPos = orbPositions.find(p => p.id === (orb as any).parentId);
                    if (parentPos) {
                        const offset = (orb as any).offset || { x: 0, y: 0 };
                        // Subscribe to parent position changes
                        const unsubX = parentPos.x.on('change', (newX) => {
                            pos.x.set(newX + offset.x);
                        });
                        const unsubY = parentPos.y.on('change', (newY) => {
                            pos.y.set(newY + offset.y);
                        });

                        // Initial position
                        targetX = parentPos.x.get() + offset.x;
                        targetY = parentPos.y.get() + offset.y;

                        // Store cleanup
                        return () => {
                            unsubX();
                            unsubY();
                        };
                    }
                }
            }

            // 2. Set Start Position (All at Center)
            // We set them to center immediately so when component mounts/reveals, they are there.
            pos.x.set(cx);
            pos.y.set(cy);

            // 3. Animate to Target ("Big Bang")
            // Randomize transition slightly for organic feel
            const delay = Math.random() * 0.3;
            const duration = 1.2 + Math.random() * 0.5;

            animate(pos.x, targetX, { duration, delay, type: "spring", bounce: 0.4 });
            animate(pos.y, targetY, { duration, delay, type: "spring", bounce: 0.4 });
        });

        // Reveal the UI
        setMounted(true);

    }, [initialLayout, orbs]); // eslint-disable-line react-hooks/exhaustive-deps


    const handleSaveLayout = async () => {
        if (!userId) return;
        const layoutToSave: LayoutMap = {};
        orbPositions.forEach(p => {
            layoutToSave[p.id] = { x: p.x.get(), y: p.y.get() };
        });
        await supabase.from('profiles').update({ dashboard_layout: layoutToSave }).eq('id', userId);
    };

    // 5. DRAG DETECTION
    const isDraggingRef = useRef(false);

    const handleDragStart = () => {
        isDraggingRef.current = true;
    };

    const handleDragEnd = () => {
        handleSaveLayout();
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 50);
    };

    const checkIsDragging = () => isDraggingRef.current;

    const handleBrainClick = () => {
        if (!isDraggingRef.current) {
            setIsBrainActive(true); // Always activate, let effect handle deactivation
        }
    };

    // Auto-off for Brain (VoiceMedica "Coming Soon" behavior)
    useEffect(() => {
        if (isBrainActive) {
            const timer = setTimeout(() => {
                setIsBrainActive(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isBrainActive]);

    // Pan Mode Toggle (Spacebar)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                setIsPanMode(true);
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsPanMode(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    if (!mounted) {
        return (
            <div className="w-full h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-4 h-4 bg-pink-500 rounded-full animate-ping" />
            </div>
        );
    }

    // Centered rings for landing page effect
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    return (
        <div
            ref={containerRef}
            className={`w-full h-screen relative overflow-hidden bg-white isolate touch-none ${isPanMode ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >

            {/* Background Layers from Landing Page */}
            <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-blue-50 to-purple-50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

            {/* Viewport Container (Pannable) */}
            <motion.div
                className="absolute inset-0"
                style={{
                    x: viewportOffsetX,
                    y: viewportOffsetY,
                }}
                drag={isPanMode}
                dragElastic={0}
                dragMomentum={false}
                onDrag={(e, info) => {
                    if (isPanMode) {
                        viewportOffsetX.set(viewportOffsetX.get() + info.delta.x);
                        viewportOffsetY.set(viewportOffsetY.get() + info.delta.y);
                    }
                }}
            >

                {/* Rotating Rings */}
                {orbs.map(orb => {
                    if (orb.type !== 'brain') return null;
                    const brainPos = positionsMap[orb.id];
                    return (
                        <motion.div
                            key="rings"
                            style={{ x: brainPos.x, y: brainPos.y, translateX: "-50%", translateY: "-50%" }}
                            className="absolute z-0 pointer-events-none"
                        >
                            <div className="w-[800px] h-[800px] border border-slate-200/50 rounded-full opacity-50" />
                            <div className="absolute inset-0 m-auto w-[600px] h-[600px] border border-dashed border-slate-200/50 rounded-full animate-[spin_60s_linear_infinite]" />
                            <div className="absolute inset-0 m-auto w-[400px] h-[400px] border border-slate-100 rounded-full" />
                        </motion.div>
                    )
                })}

                {/* Connection Layer */}
                <ConnectionLayer orbs={orbs} positions={positionsMap} isBrainActive={isBrainActive} containerRef={containerRef} />

                {/* Orbs */}
                {orbs.map((orb) => {
                    const isBrain = orb.type === 'brain';
                    let pos = positionsMap[orb.id];

                    // For subnodes, compute position based on parent
                    if (orb.type === 'subnode' && (orb as any).parentId) {
                        const parentPos = positionsMap[(orb as any).parentId];
                        if (parentPos) {
                            const offset = (orb as any).offset || { x: 0, y: 0 };
                            // Create computed motion values
                            const computedX = useTransform(parentPos.x, (px) => px + offset.x);
                            const computedY = useTransform(parentPos.y, (py) => py + offset.y);
                            pos = { x: computedX, y: computedY };
                        }
                    }

                    return (
                        <motion.div
                            key={orb.id}
                            className="absolute flex items-center justify-center cursor-grab active:cursor-grabbing hover:z-50"
                            style={{
                                x: pos.x,
                                y: pos.y,
                                translateX: "-50%",
                                translateY: "-50%",
                                zIndex: isBrain ? 50 : 20
                            }}
                            drag
                            dragMomentum={false}
                            dragElastic={0.05}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            {/* Floating Animation Wrapper */}
                            <motion.div
                                animate={isBrain ? {} : {
                                    y: [0, -15, 0],
                                    x: [0, 8, -8, 0],
                                }}
                                transition={isBrain ? {} : {
                                    duration: (orb as any).floating?.duration || 6,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: (orb as any).floating?.delay || 0
                                }}
                            >
                                {isBrain ? (
                                    <VoiceMedicaOrb
                                        isOn={isBrainActive}
                                        onClick={handleBrainClick}
                                    />
                                ) : orb.type === 'task' ? (
                                    // @ts-ignore
                                    <TaskWidget
                                        title={(orb as any).title}
                                        date={(orb as any).date}
                                        checkIsDragging={checkIsDragging}
                                    />
                                ) : orb.type === 'subnode' ? (
                                    <SubNode
                                        icon={
                                            orb.color === 'blue' ? Thermometer :
                                                orb.color === 'green' ? Pill :
                                                    orb.color === 'purple' ? Sparkles :
                                                        orb.color === 'pink' ? Mic :
                                                            orb.color === 'teal' ? BarChart3 :
                                                                Calendar
                                        }
                                        color={orb.color || 'orange'}
                                        value={(orb as any).value}
                                        label={orb.label}
                                        variant="compact"
                                    />
                                ) : (
                                    // @ts-ignore
                                    <AppOrb
                                        label={orb.label}
                                        icon={(orb as any).icon}
                                        href={(orb as any).href}
                                        color={(orb as any).color}
                                        isLocked={orb.isLocked}
                                        checkIsDragging={checkIsDragging}
                                    />
                                )}
                            </motion.div>
                        </motion.div>
                    )
                })}

                {/* Branding - Clickable Link to Root */}
                <div className="absolute top-8 left-8 z-20 select-none cursor-pointer">
                    <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity">
                        {/* Logo Image */}
                        <div className="relative w-8 h-8">
                            <Image src="/logo.svg" alt="MedicaHub" fill className="object-contain" />
                        </div>

                        {/* Text Logo + Badges */}
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medica<span className="text-blue-600">Hub</span></h1>
                            {isPro && (
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm translate-y-[1px]">
                                    PRO
                                </span>
                            )}

                            {/* Credits - Inline */}
                            {(credits !== undefined) && (
                                <div className="flex items-center gap-1.5 ml-3 border-l border-slate-200 pl-3">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                    <span className="text-lg font-bold text-slate-700 leading-none">{credits}</span>
                                </div>
                            )}
                        </div>
                    </Link>
                </div>
            </motion.div>
        </div>
    )
}
