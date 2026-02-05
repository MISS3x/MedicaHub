'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mic, Square, Play, Pause, Copy, Edit2, Trash2, FileAudio, Check, Loader2 } from 'lucide-react';

// Types
interface VoiceLog {
    id: string;
    title: string;
    created_at: string;
    audio_path: string;
    transcript: string | null;
    status: 'pending' | 'processed' | 'error';
    duration_seconds: number;
}

export default function VoiceLogPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [logs, setLogs] = useState<VoiceLog[]>([]);
    const [activeLog, setActiveLog] = useState<VoiceLog | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const supabase = createClient();

    // Fetch logs on mount
    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('voicelogs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLogs(data || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Formatting time for display
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format Date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Start Recording
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // Prefer opus for max compression
            const options = { mimeType: 'audio/webm;codecs=opus' };
            // Fallback if browser doesn't support specific codecs
            const mimeType = MediaRecorder.isTypeSupported(options.mimeType)
                ? options.mimeType
                : 'audio/webm'; // standard fallback

            const mediaRecorder = new MediaRecorder(stream, { mimeType });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = handleStopRecording;

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Nelze přistoupit k mikrofonu.');
        }
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
            setIsRecording(false);

            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    };

    // Handle recorded data
    const handleStopRecording = async () => {
        try {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const timestamp = new Date();
            // Auto name logic
            const defaultTitle = `Záznam ${timestamp.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
            const fileName = `${timestamp.toISOString()}.webm`;
            const filePath = `${user.id}/${fileName}`;

            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('voicelogs')
                .upload(filePath, audioBlob);

            if (uploadError) throw uploadError;

            // 2. Save metadata to DB
            const { data: newLog, error: dbError } = await supabase
                .from('voicelogs')
                .insert({
                    user_id: user.id,
                    title: defaultTitle,
                    audio_path: filePath,
                    duration_seconds: recordingTime,
                    status: 'pending',
                    transcript: '' // Empty for now, waiting for AI
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Update UI
            setLogs([newLog, ...logs]);
            setActiveLog(newLog);

        } catch (error) {
            console.error('Error saving recording:', error);
            alert('Chyba při ukládání záznamu.');
        }
    };

    // Play Audio Logic
    const AudioPlayer = ({ path }: { path: string }) => {
        const [url, setUrl] = useState<string | null>(null);

        useEffect(() => {
            const { data } = supabase.storage.from('voicelogs').getPublicUrl(path);
            // Wait, is the bucket public? The SQL said public=false.
            // If not public, we need signed URL.
            // Let's check SQL: values ('voicelogs', 'voicelogs', false) -> Private.
            // So we need createSignedUrl

            const fetchUrl = async () => {
                const { data, error } = await supabase.storage
                    .from('voicelogs')
                    .createSignedUrl(path, 3600); // 1 hour validity
                if (data) setUrl(data.signedUrl);
            };

            fetchUrl();
        }, [path]);

        if (!url) return <div className="text-xs text-slate-400">Načítání audia...</div>;

        return (
            <audio controls className="w-full mt-2 h-10">
                <source src={url} type="audio/webm" />
                Váš prohlížeč nepodporuje audio element.
            </audio>
        );
    };

    // Updating Title
    const updateTitle = async (id: string, newTitle: string) => {
        const { error } = await supabase
            .from('voicelogs')
            .update({ title: newTitle })
            .eq('id', id);

        if (!error) {
            setLogs(logs.map(log => log.id === id ? { ...log, title: newTitle } : log));
            if (activeLog?.id === id) setActiveLog({ ...activeLog, title: newTitle });
        }
    };

    // Copy Transcript
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast notification here
        alert('Zkopírováno do schránky');
    };

    // Delete Log
    const deleteLog = async (log: VoiceLog) => {
        if (!confirm('Opravdu smazat tento záznam?')) return;

        // 1. Delete from storage
        await supabase.storage.from('voicelogs').remove([log.audio_path]);

        // 2. Delete from DB
        await supabase.from('voicelogs').delete().eq('id', log.id);

        setLogs(logs.filter(l => l.id !== log.id));
        if (activeLog?.id === log.id) setActiveLog(null);
    };


    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Header & Recorder */}
                <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-slate-900">VoiceLog</h1>
                        <p className="text-slate-500 mt-2">Inteligentní hlasové poznámky</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        {/* Simple stats or user info could go here */}
                    </div>
                </div>

                {/* MAIN RECORDER AREA */}
                <div className="lg:col-span-12 bg-white rounded-3xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className={`transition-all duration-500 ${isRecording ? 'scale-110' : 'scale-100'}`}>
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`
                        w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                        ${isRecording
                                    ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-200 animate-pulse'
                                    : 'bg-indigo-600 hover:bg-indigo-700 ring-4 ring-indigo-50'
                                }
                    `}
                        >
                            {isRecording ? (
                                <Square className="w-12 h-12 text-white fill-current" />
                            ) : (
                                <Mic className="w-12 h-12 text-white" />
                            )}
                        </button>
                    </div>

                    <div className="mt-8 text-center">
                        {isRecording ? (
                            <div className="flex flex-col items-center">
                                <span className="text-rose-500 font-semibold mb-1 animate-pulse">Nahrávání...</span>
                                <span className="text-5xl font-mono font-medium text-slate-800">{formatTime(recordingTime)}</span>
                            </div>
                        ) : (
                            <div className="text-slate-400">Klikněte pro spuštění nahrávání</div>
                        )}
                    </div>
                </div>

                {/* LIST OF RECORDINGS */}
                <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <FileAudio className="w-5 h-5 text-indigo-500" />
                            Moje záznamy
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>
                        ) : logs.length === 0 ? (
                            <div className="text-center text-slate-400 p-8">Žádné záznamy</div>
                        ) : (
                            logs.map(log => (
                                <div
                                    key={log.id}
                                    onClick={() => setActiveLog(log)}
                                    className={`
                                p-4 rounded-2xl cursor-pointer border transition-all duration-200 hover:shadow-md
                                ${activeLog?.id === log.id
                                            ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200'
                                            : 'bg-white border-slate-100 hover:border-indigo-100'
                                        }
                            `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`font-medium ${activeLog?.id === log.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                                                {log.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">{formatDate(log.created_at)}</p>
                                        </div>
                                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                            {formatTime(log.duration_seconds || 0)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* DETAIL VIEW */}
                <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 h-[600px] flex flex-col p-8">
                    {activeLog ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 mr-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 block">Název záznamu</label>
                                    <input
                                        type="text"
                                        className="text-2xl font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none w-full pb-1"
                                        defaultValue={activeLog.title}
                                        onBlur={(e) => updateTitle(activeLog.id, e.target.value)}
                                    />
                                </div>
                                <button onClick={() => deleteLog(activeLog)} className="text-slate-300 hover:text-red-500 transition-colors p-2">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                                <AudioPlayer path={activeLog.audio_path} />
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-slate-700">Přepis (Transcript)</h3>
                                    <button
                                        onClick={() => copyToClipboard(activeLog.transcript || '')}
                                        className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
                                        disabled={!activeLog.transcript}
                                    >
                                        <Copy className="w-3 h-3" />
                                        Kopírovat text
                                    </button>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex-1 overflow-y-auto text-slate-600 leading-relaxed">
                                    {activeLog.transcript ? (
                                        activeLog.transcript
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                                            </div>
                                            <p>Čekám na zpracování AI...</p>
                                            <p className="text-xs text-slate-300 text-center max-w-xs">
                                                Automatický přepis se spustí, jakmile bude backend připojen.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <FileAudio className="w-16 h-16 text-slate-200 mb-4" />
                            <p>Vyberte záznam pro zobrazení detailů</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
