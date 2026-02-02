'use client';

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TemperatureEntry } from './types';

interface TemperatureChartProps {
    data: TemperatureEntry[];
}

const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
    // Filtrace: Data pouze od roku 2025
    const chartData = data
        .filter(entry => entry.value !== null && new Date(entry.date).getFullYear() >= 2025)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(entry => ({
            date: new Date(entry.date).toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' }),
            temp: entry.value,
            fullDate: entry.date
        }));

    if (chartData.length === 0) {
        return <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">Žádná data k zobrazení</div>;
    }

    // Výpočet min/max pro dynamickou osu Y
    const temps = chartData.map(d => d.temp as number); // Type assertion, qualified by filter above
    const minTemp = Math.floor(Math.min(...temps) - 1);
    const maxTemp = Math.ceil(Math.max(...temps) + 1);

    return (
        <div className="h-[300px] w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={30}
                    />
                    <YAxis
                        domain={[minTemp, maxTemp]}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        axisLine={false}
                        tickLine={false}
                        width={40}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}
                        itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        formatter={(value: number) => [`${value.toFixed(1)} °C`, 'Teplota']}
                    />
                    <Area
                        type="monotone"
                        dataKey="temp"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorTemp)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TemperatureChart;
