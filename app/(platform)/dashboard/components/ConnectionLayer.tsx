"use client";

import { useEffect } from "react";
import { motion, MotionValue, useTransform, useMotionTemplate, useMotionValue, animate } from "framer-motion";

interface ConnectionLayerProps {
    orbIds: string[];
    positions: Record<string, { x: MotionValue<number>; y: MotionValue<number> }>;
    containerRef: React.RefObject<HTMLDivElement>;
}

export const ConnectionLayer = ({ orbIds, positions }: ConnectionLayerProps) => {
    // We generate a line for every unique pair
    const pairs = [];
    for (let i = 0; i < orbIds.length; i++) {
        for (let j = i + 1; j < orbIds.length; j++) {
            pairs.push([orbIds[i], orbIds[j]]);
        }
    }

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible -z-10">
            {pairs.map(([idA, idB]) => (
                <ConnectionLine
                    key={`${idA}-${idB}`}
                    posA={positions[idA]}
                    posB={positions[idB]}
                />
            ))}
        </svg>
    );
};

const ConnectionLine = ({
    posA,
    posB
}: {
    posA: { x: MotionValue<number>; y: MotionValue<number> };
    posB: { x: MotionValue<number>; y: MotionValue<number> };
}) => {
    // Distance calculation
    const dist = useTransform([posA.x, posA.y, posB.x, posB.y], ([x1, y1, x2, y2]) => {
        // @ts-ignore
        const d = Math.sqrt(Math.pow((x2 as number) - (x1 as number), 2) + Math.pow((y2 as number) - (y1 as number), 2));
        return d;
    });

    // 1. Distance-based opacity (Range increased to 450px for more reach)
    const distOpacity = useTransform(dist, [0, 200, 450], [1, 0.5, 0]);
    const width = useTransform(dist, [0, 450], [3, 1]);

    // 2. Random Pulse logic ("reconnecting with others")
    const pulseOpacity = useMotionValue(0);

    useEffect(() => {
        const randomDuration = 2 + Math.random() * 4; // 2-6s cycle
        const randomDelay = Math.random() * 5;

        // Randomly decide if this connection is "active" for this cycle
        // We pulse from 0 to 1 and back.
        const controls = animate(pulseOpacity, [0, 1, 1, 0], {
            duration: randomDuration,
            times: [0, 0.1, 0.6, 1], // fast in, stay, slow out
            delay: randomDelay,
            repeat: Infinity,
            repeatDelay: Math.random() * 2
        });

        return () => controls.stop();
    }, []);

    // 3. Combine Opacities
    const finalOpacity = useTransform([distOpacity, pulseOpacity], ([d, p]) => (d as number) * (p as number));

    return (
        <motion.line
            x1={posA.x}
            y1={posA.y}
            x2={posB.x}
            y2={posB.y}
            stroke="#94a3b8" // Slate-400 - Visible but subtle
            strokeWidth={width}
            strokeOpacity={finalOpacity}
            strokeLinecap="round"
        />
    );
}
