"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, MotionValue, animate, useTransform, motionValue } from "framer-motion";
import { Mic, Calendar, Users, Thermometer, Pill, Sparkles, Activity, UserCog, BarChart3, Star, Phone, ClipboardCheck, Signal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { VoiceMedicaOrb } from "./components/VoiceMedicaOrb";
import { AppOrb } from "./components/AppOrb";
import { TaskWidget } from "./components/TaskWidget";
import { ConnectionLayer } from "./components/ConnectionLayer";
import { SubNode } from "./components/SubNode";
import { LayoutMap } from "./components/types";
import { DashboardTiles } from "./components/DashboardTiles";
import { LayoutGrid, Network } from "lucide-react";
import { useVoiceController } from "./components/VoiceController";

// 1. MASTER CONFIG
// 1. MASTER CONFIG
interface AppDef {
    id: string;
    label: string;
    icon: any;
    href: string;
    color: string;
    alwaysActive?: boolean;
    isComingSoon?: boolean;
}

const APP_DEFINITIONS: AppDef[] = [
    { id: 'settings', label: 'Účet', icon: UserCog, href: '/settings', color: 'text-slate-600', alwaysActive: true },
    { id: 'eventlog', label: 'EventLog', icon: Calendar, href: '/eventlog', color: 'text-orange-500' },
    { id: 'medlog', label: 'MedLog', icon: Pill, href: '/medlog', color: 'text-emerald-500' },
    { id: 'termolog', label: 'TermoLog', icon: Thermometer, href: '/termolog', color: 'text-blue-500' },
    { id: 'sterilog', label: 'SteriLog', icon: Sparkles, href: '/sterilog', color: 'text-purple-500' },
    { id: 'voicelog', label: 'VoiceLog', icon: Mic, href: '/voicelog', color: 'text-rose-500' },
    // Planned / Future
    { id: 'patients', label: 'Pacienti', icon: Users, href: '#', color: 'text-sky-500', isComingSoon: true },
    { id: 'reporty', label: 'Reporty', icon: BarChart3, href: '#', color: 'text-indigo-500', isComingSoon: true },
];

// Visual slots configuration (Global for access in useMemo)
const SLOT_CONFIG: Record<string, { angle: number, distScale: number }> = {
    'reporty': { angle: -90, distScale: 1.0 },
    'medlog': { angle: -45, distScale: 1.1 },
    'patients': { angle: 0, distScale: 1.2 },
    'eventlog': { angle: 45, distScale: 1.1 },
    'termolog': { angle: 90, distScale: 1.0 },
    'settings': { angle: 135, distScale: 1.1 },
    'sterilog': { angle: 180, distScale: 1.2 },
    'voicelog': { angle: 225, distScale: 1.1 },
};

// Helper: Calculate offset for subnodes relative to parent
// Distributes nodes in an arc around the parent, facing OUTWARDS from the center (0,0)
// Helper: Get layout params for subnodes
// We now just return the metadata, and calculate the actual position in useEffect
const getSubNodeLayoutParams = (appId: string, index: number, total: number) => {
    return { appId, index, total };
}

// (Rest of imports ok)

// ...

interface DashboardClientProps {
    initialLayout: LayoutMap | null;
    initialViewModeMobile?: 'nodes' | 'tiles';
    initialViewModeDesktop?: 'nodes' | 'tiles';
    userId?: string;
    activeAppCodes?: string[];
    isPro?: boolean;
    credits?: number;
    brainEnabled?: boolean;
    tasks?: { id: string, title: string, due_date: string, status: string }[];
    recentTemps?: { value: number, recorded_at: string }[];
    recentMeds?: { medication_name: string, administered_at: string }[];
    recentVoice?: { duration_seconds: number, created_at: string, title: string } | null;
}

export const DashboardClient = ({
    initialLayout,
    initialViewModeMobile = 'nodes',
    initialViewModeDesktop = 'nodes',
    userId,
    activeAppCodes = [],
    isPro = false,
    credits = 0,
    brainEnabled = false,
    tasks = [],
    recentTemps = [],
    recentMeds = [],
    recentVoice = null
}: DashboardClientProps) => {
    const supabase = createClient();
    const router = useRouter(); // For navigation
    const containerRef = useRef<HTMLDivElement>(null);

    // Voice & Brain State
    const [isBrainActive, setIsBrainActive] = useState(false);
    const [voiceStatus, setVoiceStatus] = useState<'listening' | 'processing' | 'idle' | 'off'>('off');

    // Voice Controller Integration
    useVoiceController({
        isActive: isBrainActive,
        onStatusChange: (status) => {
            setVoiceStatus(status);
            // Optional: If 'listening', we might want to pulse specifically, but 'isBrainActive' is already driving the main pulse.
            // We can add extra visual cues later.
        },
        onCommandRecognized: (command, payload) => {
            console.log("🚀 Executing Voice Command:", command, payload);

            // Visual Feedback: Flash processing state
            setVoiceStatus('processing');
            setTimeout(() => setVoiceStatus('idle'), 1000);

            if (command === 'NAVIGATE' && payload) {
                // Find App URL
                const app = APP_DEFINITIONS.find(a => a.id === payload);
                if (app && !app.isComingSoon) {
                    router.push(app.href);
                } else if (app?.isComingSoon) {
                    alert(`Aplikace ${app.label} je zatím ve vývoji.`);
                }
            }
            if (command === 'CLOSE') {
                setIsBrainActive(false);
            }
        }
    });

    const [mounted, setMounted] = useState(false);
    // ...

    // Initialize state with a temporary default, then update on mount when we know screen size
    const [viewMode, setViewModeState] = useState<'nodes' | 'tiles'>('nodes');

    // Effect to set initial view mode based on screen size
    useEffect(() => {
        const isMobile = window.innerWidth < 768;
        setViewModeState(isMobile ? initialViewModeMobile : initialViewModeDesktop);
    }, [initialViewModeMobile, initialViewModeDesktop]);

    // Wrapper to update state + DB
    const setViewMode = async (mode: 'nodes' | 'tiles') => {
        setViewModeState(mode);
        // Persist to DB (fire & forget for UI speed)
        if (userId) {
            // Determine if mobile or desktop based on window width
            const isMobile = window.innerWidth < 768;
            const column = isMobile ? 'dashboard_view_mode_mobile' : 'dashboard_view_mode_desktop';

            await supabase.from('profiles').update({ [column]: mode }).eq('id', userId);
        }
    };

    // DEBUG: Verify fix deployment
    console.log("DashboardClient: Component Rendered (Hook Fix Applied)");

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

            // ACTIVE STATE: controlled STRICTLY by database active_apps (or alwaysActive flag)
            // We removed 'isPro' auto-unlock so Admin panel selection is respected.
            const isActive = (app as any).alwaysActive || activeAppCodes.includes(app.id) || (app.id === 'eventlog' && activeAppCodes.includes('servislog'));

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

        // Remove separate taskOrbs array, we will process them as subnodes below

        // SUB-NODES (only for ACTIVE apps) - DYNAMIC FROM DATABASE
        const allSubNodes: any[] = [];

        // 1. EventLog subnodes (TASKS)
        // Convert Tasks to Uniform Subnodes
        const eventLogApp = appOrbs.find(a => a.id === 'eventlog');
        if (eventLogApp && !eventLogApp.isLocked && tasks.length > 0) {
            // Max 8 tasks to keep layout clean
            const visibleTasks = tasks.slice(0, 8);
            visibleTasks.forEach((t, i) => {
                // Determine icon based on content
                let TaskIcon = ClipboardCheck;
                const lowerTitle = t.title.toLowerCase();
                if (lowerTitle.includes('volat') || lowerTitle.includes('zavolat') || lowerTitle.includes('telefon')) {
                    TaskIcon = Phone;
                }

                allSubNodes.push({
                    id: `task-${t.id}`,
                    // @ts-ignore
                    originalId: t.id,
                    parentId: 'eventlog',
                    type: 'subnode', // Unified type!
                    label: t.title,
                    subLabel: new Date(t.due_date).toLocaleDateString('cs-CZ'),
                    value: t.status === 'pending' ? '!' : 'OK',
                    color: 'orange', // Matches EventLog
                    isLocked: false,
                    icon: TaskIcon, // <--- ADDED ICON
                    layoutParams: getSubNodeLayoutParams('eventlog', i, visibleTasks.length),
                    floating: { duration: 6 + Math.random() * 3, delay: Math.random() * 1 }
                });
            });
        }


        // 2. TermoLog subnodes
        const termologApp = appOrbs.find(a => a.id === 'termolog');
        if (termologApp && !termologApp.isLocked) {
            const hasTemps = recentTemps.length > 0;
            const items = [];

            // Add temps
            if (hasTemps) {
                recentTemps.forEach((temp, i) => {
                    items.push({
                        id: `termo-${i}`,
                        label: `${temp.value}°C`,
                        subLabel: new Date(temp.recorded_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
                        value: temp.value,
                        type: 'subnode',
                        color: 'blue',
                        icon: Thermometer // <--- ADDED ICON
                    });
                });
            }

            // Add Status Bubbles
            items.push({
                id: `termo-status-1`,
                label: 'Senzory',
                subLabel: 'V pořádku',
                value: 'Aktivní',
                type: 'subnode',
                color: 'blue',
                icon: Activity // <--- ADDED ICON
            });
            items.push({
                id: `termo-status-2`,
                label: 'Signál',
                subLabel: 'Vynikající',
                value: '100%',
                type: 'subnode',
                color: 'blue',
                icon: Signal // <--- ADDED ICON
            });

            // Limit to 8
            const visibleItems = items.slice(0, 8);

            visibleItems.forEach((item, i) => {
                allSubNodes.push({
                    ...item,
                    parentId: 'termolog',
                    isLocked: false,
                    layoutParams: getSubNodeLayoutParams('termolog', i, visibleItems.length),
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 3. MedLog subnodes
        const medlogApp = appOrbs.find(a => a.id === 'medlog');
        if (medlogApp && !medlogApp.isLocked && recentMeds.length > 0) {
            const visibleMeds = recentMeds.slice(0, 8);
            visibleMeds.forEach((med, i) => {
                allSubNodes.push({
                    id: `med-${i}`,
                    label: med.medication_name, // Show Name
                    subLabel: new Date(med.administered_at).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
                    value: med.medication_name,
                    parentId: 'medlog',
                    type: 'subnode',
                    color: 'green',
                    icon: Pill,
                    isLocked: false,
                    layoutParams: getSubNodeLayoutParams('medlog', i, visibleMeds.length + 1), // +1 for the static button
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });

            // Add Static "Add" Button
            allSubNodes.push({
                id: 'med-add',
                label: 'Zadat',
                subLabel: 'Nový záznam',
                type: 'subnode',
                color: 'green',
                icon: Pill,
                isAction: true,
                parentId: 'medlog',
                isLocked: false,
                layoutParams: getSubNodeLayoutParams('medlog', visibleMeds.length, visibleMeds.length + 1),
                floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
            });

        } else if (medlogApp && !medlogApp.isLocked) {
            // Even if no recent meds, show the "Add" button
            allSubNodes.push({
                id: 'med-add',
                label: 'Zadat',
                subLabel: 'Nový záznam',
                type: 'subnode',
                color: 'green',
                icon: Pill,
                isAction: true,
                parentId: 'medlog',
                isLocked: false,
                layoutParams: getSubNodeLayoutParams('medlog', 0, 1),
                floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
            });
        }

        // 4. SteriLog subnodes
        const sterilogApp = appOrbs.find(a => a.id === 'sterilog');
        if (sterilogApp && !sterilogApp.isLocked) {
            const items = [{
                id: 'steri-placeholder',
                label: 'Připravujeme',
                subLabel: 'Coming Soon',
                type: 'subnode',
                color: 'purple'
            }];

            items.forEach((item, i) => {
                allSubNodes.push({
                    ...item,
                    parentId: 'sterilog',
                    isLocked: false,
                    layoutParams: getSubNodeLayoutParams('sterilog', i, items.length),
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 5. VoiceLog subnodes
        const voicelogApp = appOrbs.find(a => a.id === 'voicelog');
        if (voicelogApp && !voicelogApp.isLocked) {
            const items = [];

            // Add Start/Record Button (Always there as a shortcut)
            items.push({
                id: 'voice-shortcut',
                label: 'Nahrát',
                subLabel: 'Nový záznam',
                type: 'subnode',
                color: 'pink',
                isAction: true,
                icon: Mic
            });

            // Add Recent Log Duration if available
            if (recentVoice) {
                const mins = Math.floor(recentVoice.duration_seconds / 60);
                const secs = recentVoice.duration_seconds % 60;
                const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

                // User wants "names of records, its length"
                // Label = Title (or fallback), SubLabel = Length
                const displayTitle = recentVoice.title || 'Hlasový záznam';

                items.push({
                    id: 'voice-last',
                    label: displayTitle,
                    subLabel: timeStr,
                    value: timeStr, // Used for short display if needed, but SubNode prefers Icon usually
                    type: 'subnode',
                    color: 'pink',
                    icon: Mic
                });
            }
            items.forEach((item, i) => {
                allSubNodes.push({
                    ...item,
                    parentId: 'voicelog',
                    isLocked: false,
                    layoutParams: getSubNodeLayoutParams('voicelog', i, items.length),
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 6. Reporty subnodes
        const reportyApp = appOrbs.find(a => a.id === 'reporty');
        if (reportyApp && !reportyApp.isLocked) {
            // ... (existing reporty logic, keeping it empty or placeholder if it was there)
            const items = [{
                id: 'reporty-placeholder',
                label: 'V přípravě',
                subLabel: 'Analytics',
                type: 'subnode',
                color: 'teal'
            }];

            items.forEach((item, i) => {
                allSubNodes.push({
                    ...item,
                    parentId: 'reporty',
                    isLocked: false,
                    layoutParams: getSubNodeLayoutParams('reporty', i, items.length),
                    floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
                });
            });
        }

        // 7. Settings subnodes (Credits)
        const settingsApp = appOrbs.find(a => a.id === 'settings');
        if (settingsApp) {
            allSubNodes.push({
                id: 'settings-credits',
                label: 'Kredity',
                subLabel: 'Historie',
                type: 'subnode',
                color: 'purple',
                icon: Star,
                parentId: 'settings',
                isAction: true,
                href: '/settings?tab=credits',
                isLocked: false,
                layoutParams: getSubNodeLayoutParams('settings', 0, 1),
                floating: { duration: 5 + Math.random() * 2, delay: Math.random() * 1 }
            });
        }

        return [brain, ...appOrbs, ...allSubNodes];
    }, [activeAppCodes, isPro, tasks, recentTemps, recentMeds, recentVoice]);

    // 3. MOTION VALUES
    // 3. MOTION VALUES (Refactored to avoid hooks in loops)
    const motionValuesRef = useRef<Record<string, { x: MotionValue<number>, y: MotionValue<number> }>>({});

    const positionsMap = useMemo(() => {
        const mvCache = motionValuesRef.current;
        const newMap: Record<string, { x: MotionValue<number>, y: MotionValue<number> }> = {};

        // 1. Mark all current IDs as present
        const currentIds = new Set(orbs.map(o => o.id));

        // Optional: Cleanup old motion values? 
        // We can keep them in memory for simplicity or cleanup if list shrinks drastically.
        // For now, we update the cache.

        orbs.forEach(orb => {
            if (!mvCache[orb.id]) {
                const storedPos = initialLayout?.[orb.id];
                // Default center
                const defaultX = 600;
                const defaultY = 400;

                let initX = storedPos?.x ?? defaultX;
                let initY = storedPos?.y ?? defaultY;

                // Sanity check for NaN or invalid values
                if (typeof initX !== 'number' || isNaN(initX)) initX = defaultX;
                if (typeof initY !== 'number' || isNaN(initY)) initY = defaultY;

                mvCache[orb.id] = {
                    x: motionValue(initX),
                    y: motionValue(initY)
                };
            }
            newMap[orb.id] = mvCache[orb.id];
        });

        return newMap;
    }, [orbs, initialLayout]);

    // Derived array for animations
    const orbPositions = useMemo(() => {
        return orbs.map(orb => ({
            id: orb.id,
            ...positionsMap[orb.id]
        }));
    }, [orbs, positionsMap]);

    // 4. MOUNT EFFECT & RESPONSIVE RE-CENTERING & ENTRY ANIMATION
    useEffect(() => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;

        // Visual slots configuration (Now using Global SLOT_CONFIG)
        const slotConfig = SLOT_CONFIG;

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
                // Just set initial position relative to parent's start position (center)
                if (orb.type === 'subnode' && (orb as any).parentId) {
                    const params = (orb as any).layoutParams;

                    if (params) {
                        const config = slotConfig[params.appId];
                        if (config) {
                            const radiusBase = Math.min(window.innerWidth, window.innerHeight) * 0.35;
                            const parentR = radiusBase * config.distScale;

                            // Explicitly position OUTSIDE the app ring
                            const DISTANCE_FROM_PARENT = 85;
                            const OUTWARD_RADIUS = parentR + DISTANCE_FROM_PARENT;

                            const SPREAD_ANGLE = 35; // Degrees
                            const { index, total } = params;

                            let angleOffset = 0;
                            if (total > 1) {
                                const startAngle = -(total - 1) * SPREAD_ANGLE / 2;
                                angleOffset = startAngle + (index * SPREAD_ANGLE);
                            }

                            const finalAngleRad = (config.angle + angleOffset) * (Math.PI / 180);

                            targetX = cx + Math.cos(finalAngleRad) * OUTWARD_RADIUS;
                            targetY = cy + Math.sin(finalAngleRad) * OUTWARD_RADIUS;
                        }
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
            // ALWAYS Toggle ON/OFF for Voice Testing
            setIsBrainActive(prev => !prev);
        }
    };

    // Auto-off removed for Voice Control Testing
    /*
    useEffect(() => {
        // If not pro, we auto-turn off after 3s to simulate "scan/deny" or just tease
        if (!isPro && isBrainActive) {
            const timer = setTimeout(() => {
                setIsBrainActive(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isBrainActive, isPro]);
    */

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
            className={`w-full h-screen relative overflow-hidden bg-white isolate touch-none ${isPanMode && viewMode === 'nodes' ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >

            {/* Background Layers from Landing Page */}
            <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-blue-50 to-purple-50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/4 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4 pointer-events-none"></div>

            {/* HEADER / BRANDING - Always Visible & Fixed */}
            <div className="absolute top-8 left-8 z-50 flex items-center gap-6">
                <Link href="/" className="flex items-center gap-3 opacity-90 hover:opacity-100 transition-opacity select-none cursor-pointer">
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
                                <span className="text-lg font-bold text-slate-700 leading-none">
                                    {typeof credits === 'number'
                                        ? credits.toLocaleString('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 4 })
                                        : credits}
                                </span>
                            </div>
                        )}
                    </div>
                </Link>

                {/* VIEW TOGGLE */}
                <div className="flex items-center gap-1 bg-slate-100/80 backdrop-blur-sm p-1 rounded-lg border border-slate-200/50">
                    <button
                        onClick={() => setViewMode('nodes')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'nodes'
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                            }`}
                        title="Zobrazení sítě (Nodes)"
                    >
                        <Network size={18} />
                    </button>
                    <button
                        onClick={() => setViewMode('tiles')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'tiles'
                            ? "bg-white shadow-sm text-blue-600"
                            : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                            }`}
                        title="Zobrazení dlaždic (Tiles)"
                    >
                        <LayoutGrid size={18} />
                    </button>
                </div>

                {/* BETA WARNING - Header Inline */}
                <div className="hidden md:flex items-center px-4 py-1.5 bg-red-50 border border-red-100 rounded-full">
                    <span className="text-[10px] font-medium text-red-600 tracking-tight">
                        BETA VERZE: Data nejsou zálohována
                    </span>
                </div>
            </div>

            {/* CONTENT AREA */}
            {viewMode === 'tiles' ? (
                <DashboardTiles
                    orbs={orbs}
                    isPro={isPro}
                    isBrainActive={isBrainActive}
                    handleBrainClick={handleBrainClick}
                />
            ) : (
                /* Viewport Container (Pannable) - NODES VIEW */
                <motion.div
                    className="absolute inset-0"
                    style={{
                        x: viewportOffsetX,
                        y: viewportOffsetY,
                    }}
                    drag // Always enable drag on the background layer
                    dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }} // Optional constraints
                    dragElastic={0.1}
                    dragMomentum={false} // Match CAD-like feel
                    onDrag={(e, info) => {
                        // Update motion values directly
                        viewportOffsetX.set(viewportOffsetX.get() + info.delta.x);
                        viewportOffsetY.set(viewportOffsetY.get() + info.delta.y);
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
                        const pos = positionsMap[orb.id];
                        const parentId = (orb as any).parentId;
                        const parentPos = parentId ? positionsMap[parentId] : undefined;

                        if (orb.type === 'subnode') {
                            // Subnodes wait for parent
                            if ((orb as any).parentId && !parentPos) return null;

                            return (
                                <SubNodeOrbItem
                                    key={orb.id}
                                    orb={orb}
                                    pos={pos}
                                    parentPos={parentPos!}
                                    handleDragStart={handleDragStart}
                                    handleDragEnd={handleDragEnd}
                                    checkIsDragging={checkIsDragging}
                                />
                            );
                        }

                        // Standard Orbs (Brain, App, Task)
                        return (
                            <StandardOrbItem
                                key={orb.id}
                                orb={orb}
                                pos={pos}
                                parentPos={parentPos}
                                isBrain={isBrain}
                                isBrainActive={isBrainActive}
                                handleBrainClick={handleBrainClick}
                                isPro={isPro}
                                checkIsDragging={checkIsDragging}
                                handleDragStart={handleDragStart}
                                handleDragEnd={handleDragEnd}
                            />
                        );
                    })}
                </motion.div>
            )}
        </div>
    )
}

// ----------------------------------------------------------------------
// HELPER COMPONENTS (Defined outside to avoid re-renders & hook issues)
// ----------------------------------------------------------------------

// Hook to make a node follow its parent's movement (Delta Follower)
const useParentFollower = (
    pos: { x: MotionValue<number>; y: MotionValue<number> },
    parentPos?: { x: MotionValue<number>; y: MotionValue<number> }
) => {
    // Refs to track previous parent position for delta calculation
    const prevParentX = useRef(parentPos ? parentPos.x.get() : 0);
    const prevParentY = useRef(parentPos ? parentPos.y.get() : 0);

    useEffect(() => {
        if (!parentPos) return;

        // Sync refs effectively upon mount/updates to ensure we only track *changes* from now on
        prevParentX.current = parentPos.x.get();
        prevParentY.current = parentPos.y.get();

        const unsubX = parentPos.x.on("change", (latest) => {
            const delta = latest - prevParentX.current;
            prevParentX.current = latest;
            pos.x.set(pos.x.get() + delta);
        });

        const unsubY = parentPos.y.on("change", (latest) => {
            const delta = latest - prevParentY.current;
            prevParentY.current = latest;
            pos.y.set(pos.y.get() + delta);
        });

        return () => {
            unsubX();
            unsubY();
        };
    }, [parentPos, pos]);
};

const SubNodeOrbItem = ({
    orb,
    pos,
    parentPos,
    handleDragStart,
    handleDragEnd,
    checkIsDragging
}: {
    orb: any;
    pos: { x: MotionValue<number>; y: MotionValue<number> };
    parentPos: { x: MotionValue<number>; y: MotionValue<number> };
    handleDragStart: () => void;
    handleDragEnd: () => void;
    checkIsDragging?: () => boolean;
}) => {
    // Enable parent following
    useParentFollower(pos, parentPos);
    const router = useRouter();

    const handleClick = () => {
        if (checkIsDragging && checkIsDragging()) return; // Prevent click if dragging
        if (orb.href) {
            router.push(orb.href);
        }
    };

    const isClickable = !!orb.href;

    return (
        <motion.div
            className={`absolute flex items-center justify-center hover:z-50 ${isClickable ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
            style={{
                x: pos.x,
                y: pos.y,
                translateX: "-50%",
                translateY: "-50%",
                zIndex: 20
            }}
            drag
            dragMomentum={false}
            dragElastic={0.05}
            onDragStart={handleDragStart}
            onDrag={(e, info) => {
                // Update MotionValues directly to sync lines
                pos.x.set(pos.x.get() + info.delta.x);
                pos.y.set(pos.y.get() + info.delta.y);
            }}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
        >
            <motion.div
                animate={{
                    y: [0, -15, 0],
                    x: [0, 8, -8, 0],
                }}
                transition={{
                    duration: orb.floating?.duration || 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: orb.floating?.delay || 0
                }}
            >
                <SubNode
                    icon={
                        orb.icon || (
                            orb.color === 'blue' ? Thermometer :
                                orb.color === 'green' ? Pill :
                                    orb.color === 'purple' ? Sparkles :
                                        orb.color === 'pink' ? Mic :
                                            orb.color === 'teal' ? BarChart3 :
                                                Calendar
                        )
                    }
                    color={orb.color || 'orange'}
                    value={orb.value}
                    label={orb.label}
                    subLabel={orb.subLabel}
                    variant="full"
                />
            </motion.div>
        </motion.div>
    );
};

const StandardOrbItem = ({
    orb,
    pos,
    parentPos,
    isBrain,
    isBrainActive,
    voiceStatus,
    handleBrainClick,
    isPro,
    checkIsDragging,
    handleDragStart,
    handleDragEnd
}: {
    orb: any;
    pos: { x: MotionValue<number>, y: MotionValue<number> };
    parentPos?: { x: MotionValue<number>; y: MotionValue<number> };
    isBrain: boolean;
    isBrainActive: boolean;
    voiceStatus?: 'listening' | 'processing' | 'idle' | 'off';
    handleBrainClick: () => void;
    isPro: boolean;
    checkIsDragging: () => boolean;
    handleDragStart: () => void;
    handleDragEnd: () => void;
}) => {
    // Enable parent following for tasks or other children
    useParentFollower(pos, parentPos);

    return (
        <motion.div
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
            onDrag={(e, info) => {
                // Update MotionValues directly to sync lines
                pos.x.set(pos.x.get() + info.delta.x);
                pos.y.set(pos.y.get() + info.delta.y);
            }}
            onDragEnd={handleDragEnd}
        >
            <motion.div
                animate={isBrain ? {} : {
                    y: [0, -15, 0],
                    x: [0, 8, -8, 0],
                }}
                transition={isBrain ? {} : {
                    duration: orb.floating?.duration || 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: orb.floating?.delay || 0
                }}
            >
                {isBrain ? (
                    <VoiceMedicaOrb
                        isOn={isBrainActive}
                        voiceStatus={voiceStatus}
                        onClick={handleBrainClick}
                        isPro={isPro}
                    />
                ) : orb.type === 'task' ? (
                    <TaskWidget
                        title={orb.title}
                        date={orb.date}
                        checkIsDragging={checkIsDragging}
                    />
                ) : (
                    <AppOrb
                        label={orb.label}
                        icon={orb.icon}
                        href={orb.href}
                        color={orb.color}
                        isLocked={orb.isLocked}
                        checkIsDragging={checkIsDragging}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};
