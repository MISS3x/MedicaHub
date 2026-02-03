'use client';

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TemperatureEntry } from '../types';
import { CalendarRange, Filter } from 'lucide-react';

interface TemperatureChartProps {
    data: TemperatureEntry[];
}

type DateRange = 'this_month' | 'last_month' | 'this_year' | 'last_year' | 'custom';

const TemperatureChart: React.FC<TemperatureChartProps> = ({ data }) => {
    const [range, setRange] = useState<DateRange>('this_month');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');

    // Filter Logic
    const filteredData = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-11

        let filtered = data.filter(entry => entry.value !== null);

        if (range === 'this_month') {
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === year && d.getMonth() === month;
            });
        } else if (range === 'last_month') {
            const lastMonthDate = new Date(year, month - 1, 1);
            const lmYear = lastMonthDate.getFullYear();
            const lmMonth = lastMonthDate.getMonth();
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === lmYear && d.getMonth() === lmMonth;
            });
        } else if (range === 'this_year') {
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === year;
            });
        } else if (range === 'last_year') {
            filtered = filtered.filter(e => {
                const d = new Date(e.date);
                return d.getFullYear() === year - 1;
            });
        } else if (range === 'custom' && customStart && customEnd) {
            const start = new Date(customStart).getTime();
            const end = new Date(customEnd).getTime() + 86400000; // Include end day
            filtered = filtered.filter(e => {
                const t = new Date(e.date).getTime();
                return t >= start && t < end;
            });
        }

        // Sort ascending
        return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data, range, customStart, customEnd]);

    // Format for Chart
    const chartData = useMemo(() => {
        return filteredData.map(entry => ({
            date: new Date(entry.date).toLocaleDateString('cs-CZ', {
                day: 'numeric',
                month: range.includes('year') ? 'numeric' : undefined
            }),
            temp: entry.value,
            fullDate: entry.date,
            fullDateStr: new Date(entry.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        }));
    }, [filteredData, range]);


    // Min/Max calculation for Y Axis
    const temps = chartData.map(d => d.temp as number);
    const minTemp = temps.length ? Math.floor(Math.min(...temps) - 1) : 0;
    const maxTemp = temps.length ? Math.ceil(Math.max(...temps) + 1) : 30;

    const RangeButton = ({ id, label }: { id: DateRange, label: string }) => (
        <button
            onClick={() => setRange(id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                ${range === id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
        >
            {label}
        </button>
    );

    return (
        <div className="w-full bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
            {/* Header / Filter Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-wrap gap-2 bg-slate-50 p-1 rounded-xl">
                    <RangeButton id="this_month" label="Tento měsíc" />
                    <RangeButton id="last_month" label="Minulý měsíc" />
                    <RangeButton id="this_year" label="Tento rok" />
                    <RangeButton id="last_year" label="Minulý rok" />
                    <RangeButton id="custom" label="Vlastní" />
                </div>
            </div>

            {/* Custom Range Inputs */}
            {range === 'custom' && (
                <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-fit animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Od:</span>
                        <input
                            type="date"
                            value={customStart}
                            onChange={e => setCustomStart(e.target.value)}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-500">Do:</span>
                        <input
                            type="date"
                            value={customEnd}
                            onChange={e => setCustomEnd(e.target.value)}
                            className="text-sm bg-white border border-slate-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>
            )}

            {chartData.length === 0 ? (
                <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <Filter className="w-8 h-8 mb-2 opacity-50" />
                    <p>Pro vybrané období nejsou data</p>
                </div>
            ) : (
                <div className="h-[300px] w-full">
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
                                formatter={(value: number | undefined) => [`${value?.toFixed(1) ?? '0.0'} °C`, 'Teplota']}
                                labelFormatter={(label, payload) => payload[0]?.payload.fullDateStr || label}
                            />
                            <Area
                                type="monotone"
                                dataKey="temp"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTemp)"
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
};

export default TemperatureChart;
