"use client";

import { useEffect, useMemo } from "react";
import { motion, MotionValue, useMotionValue, animate } from "framer-motion";

interface ConnectionLayerProps {
    orbs: any[];
    positions: Record<string, { x: MotionValue<number>; y: MotionValue<number> }>;
    isBrainActive: boolean;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const ConnectionLayer = ({ orbs, positions, isBrainActive }: ConnectionLayerProps) => {
    const connections = useMemo(() => {
        const result: Array<{ from: string, to: string, type: 'brain' | 'parent' | 'random' }> = [];

        // 1. BRAIN → Active Apps
        const brainOrb = orbs.find(o => o.type === 'brain');
        if (brainOrb) {
            orbs.filter(o => o.id !== brainOrb.id && !o.isLocked && o.type === 'app')
                .forEach(app => {
                    result.push({ from: brainOrb.id, to: app.id, type: 'brain' });
                });
        }

        // 2. PARENT → CHILD (EventLog → subnodes, TermoLog → temp values, etc.)
        orbs.filter(o => (o.type === 'subnode' || o.type === 'task') && (o as any).parentId)
            .forEach(subnode => {
                result.push({
                    from: (subnode as any).parentId,
                    to: subnode.id,
                    type: 'parent'
                });
            });

        // 3. RANDOM connections between active apps
        const activeApps = orbs.filter(o => o.type === 'app' && !o.isLocked);
        for (let i = 0; i < activeApps.length; i++) {
            for (let j = i + 1; j < activeApps.length; j++) {
                // Random chance to connect
                if (Math.random() > 0.7) {
                    result.push({
                        from: activeApps[i].id,
                        to: activeApps[j].id,
                        type: 'random'
                    });
                }
            }
        }

        return result;
    }, [orbs]);

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            {connections.map(({ from, to, type }) => (
                <ConnectionLine
                    key={`${from}-${to}`}
                    posA={positions[from]}
                    posB={positions[to]}
                    type={type}
                    isActive={type === 'brain' ? isBrainActive : true}
                />
            ))}
        </svg>
    );
};

const ConnectionLine = ({
    posA,
    posB,
    type,
    isActive
}: {
    posA: { x: MotionValue<number>; y: MotionValue<number> };
    posB: { x: MotionValue<number>; y: MotionValue<number> };
    type: 'brain' | 'parent' | 'random';
    isActive: boolean;
}) => {
    const pulseOpacity = useMotionValue(type === 'brain' ? (isActive ? 0.3 : 0.15) : 0.2);

    useEffect(() => {
        if (type === 'brain' && !isActive) {
            pulseOpacity.set(0.15);
            return;
        }

        const randomDuration = type === 'parent' ? 3 : (2 + Math.random() * 3);
        const randomDelay = Math.random() * 2;

        const controls = animate(pulseOpacity,
            type === 'brain' ? [0.3, 0.8, 0.3] : [0.2, 0.6, 0.2],
            {
                duration: randomDuration,
                times: [0, 0.5, 1],
                delay: randomDelay,
                repeat: Infinity,
                ease: "easeInOut"
            }
        );

        return () => controls.stop();
    }, [isActive, type]);

    const color = type === 'brain'
        ? (isActive ? "#3b82f6" : "#94a3b8")  // Blue when active, gray when not
        : type === 'parent'
            ? "#f97316"  // Orange for parent-child
            : "#94a3b8"; // Gray for random

    return (
        <motion.line
            x1={posA.x}
            y1={posA.y}
            x2={posB.x}
            y2={posB.y}
            stroke={color}
            strokeWidth={type === 'parent' ? 3 : 2}
            strokeOpacity={pulseOpacity}
            strokeLinecap="round"
        />
    );
}
