'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Mic, Square, Play, Pause, Copy, Edit2, Trash2, FileAudio, Check, Loader2, Sparkles, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

// Types
interface VoiceLog {
    id: string;
    title: string;
    created_at: string;
    audio_path: string;
    transcript: string | null;
    status: 'pending' | 'processed' | 'error';
    duration_seconds: number;
    cost_credits?: number;
    tokens_input?: number;
    tokens_output?: number;
    expires_at?: string;
}

export default function VoiceLogPage() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [logs, setLogs] = useState<VoiceLog[]>([]);
    const [activeLog, setActiveLog] = useState<VoiceLog | null>(null);
    const [retentionHours, setRetentionHours] = useState(24);

    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const startTimeRef = useRef<number | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null); // Renamed from timerRef
    const processingDeletionIds = useRef<Set<string>>(new Set());

    // Audio Context for Visualizer
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const [audioData, setAudioData] = useState<Uint8Array>(new Uint8Array(0));
    const supabase = createClient();

    // Fetch logs on mount
    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch Profile Settings
            const { data: profile } = await supabase
                .from('profiles')
                .select('voicelog_retention_hours')
                .eq('id', user.id)
                .single();

            if (profile) {
                setRetentionHours(profile.voicelog_retention_hours ?? 24);
            }

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

    // Realtime Updates
    useEffect(() => {
        const channel = supabase
            .channel('voicelogs_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'voicelogs',
                },
                (payload) => {
                    const updatedLog = payload.new as VoiceLog;

                    setLogs((prevLogs) => {
                        const existing = prevLogs.find(p => p.id === updatedLog.id);

                        // Check specifically for status transition to processed
                        if (existing && existing.status === 'pending' && updatedLog.status === 'processed') {
                            setNotification('Úspěšně jsem přepsal Váš záznam do textu.');
                            setTimeout(() => setNotification(null), 5000);
                        }

                        return prevLogs.map((log) => log.id === updatedLog.id ? updatedLog : log);
                    });

                    // Force update active log if it matches
                    setActiveLog((currentActive) =>
                        currentActive && currentActive.id === updatedLog.id ? updatedLog : currentActive
                    );
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase]);

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

            // Setup Visualizer
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256; // Higher resolution for better visual
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            audioContextRef.current = audioCtx;
            analyserRef.current = analyser;
            sourceRef.current = source;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const animate = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                // Take broader range for bigger visualizer
                setAudioData(new Uint8Array(dataArray.slice(0, 40)));
                animationFrameRef.current = requestAnimationFrame(animate);
            };
            animate();

            // Setup Recorder with Smart MIME Detection
            const mimeTypes = [
                'audio/mp4', // Safari / iOS
                'audio/webm;codecs=opus', // Chrome / Firefox
                'audio/webm', // Fallback
                'audio/ogg' // Old
            ];

            let selectedMimeType = '';
            for (const type of mimeTypes) {
                if (MediaRecorder.isTypeSupported(type)) {
                    selectedMimeType = type;
                    break;
                }
            }

            if (!selectedMimeType) {
                alert('Váš prohlížeč nepodporuje nahrávání zvuku.');
                return;
            }

            console.log('Using MIME Type:', selectedMimeType);

            const mediaRecorder = new MediaRecorder(stream, { mimeType: selectedMimeType });

            mediaRecorderRef.current = mediaRecorder;
            // Store the mime type for saving later - adding a custom property or ref would be better but for now let's rely on checking again or just using the one we found.
            // Actually, let's store it in a ref. We need a new ref for this.
            // Since we can't add a new Hook in this replace block easily without re-rendering whole file, 
            // I'll attach it to the mediaRecorder instance itself as a safe hack or use a module var? No, module var is unsafe.
            // Let's use `mediaRecorder.mimeType` which SHOULD be populated by the browser.

            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => handleStopRecording(selectedMimeType); // Pass it here

            mediaRecorder.start();
            setIsRecording(true);

            // Duration Timer
            startTimeRef.current = Date.now();
            setRecordingDuration(0);
            timerIntervalRef.current = setInterval(() => {
                const now = Date.now();
                if (startTimeRef.current) {
                    setRecordingDuration(Math.floor((now - startTimeRef.current) / 1000));
                }
            }, 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Nelze přistoupit k mikrofonu. Povolte prosím přístup v nastavení prohlížeče.');
        }
    };

    // Stop Recording
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setIsRecording(false);

            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            // Cleanup Visualizer
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (analyserRef.current) analyserRef.current.disconnect();
            if (audioContextRef.current) audioContextRef.current.close();

            setAudioData(new Uint8Array(0));
        }
    };

    // Handle recorded data
    const handleStopRecording = async (mimeType: string = 'audio/webm') => {
        try {
            const finalDuration = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;
            const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
            console.log('Recording stopped. Blob size:', audioBlob.size, 'Type:', mimeType);

            if (audioBlob.size === 0) {
                console.warn('Audio blob is empty. Aborting save.');
                alert('Chyba nahrávání: Nebyl zaznamenán žádný zvuk. Zkuste to prosím znovu.');
                setIsRecording(false);
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Determine extension
            let extension = 'webm';
            if (mimeType.includes('mp4')) extension = 'mp4';
            else if (mimeType.includes('ogg')) extension = 'ogg';
            else if (mimeType.includes('wav')) extension = 'wav';

            const timestamp = new Date();
            const defaultTitle = `Záznam ${timestamp.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })}`;
            // Use timestamp without colons for filename to be safe
            const fileName = `${Date.now()}.${extension}`;
            const filePath = `${user.id}/${fileName}`;

            // Optimistic update for UI
            const tempId = Math.random().toString();
            const pendingLog: VoiceLog = {
                id: tempId,
                title: defaultTitle,
                created_at: timestamp.toISOString(),
                audio_path: filePath, // temporary
                transcript: null,
                status: 'pending',
                duration_seconds: finalDuration,
                // @ts-ignore
                isOptimistic: true
            };
            setLogs(prev => [pendingLog, ...prev]);


            // 1. Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from('voicelogs')
                .upload(filePath, audioBlob, {
                    contentType: mimeType, // Important for browser to treat it right on download
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // 2. Save metadata to DB
            const expirationDate = retentionHours > 0
                ? new Date(Date.now() + retentionHours * 60 * 60 * 1000).toISOString()
                : null;

            const { data: newLog, error: dbError } = await supabase
                .from('voicelogs')
                .insert({
                    user_id: user.id,
                    title: defaultTitle,
                    audio_path: filePath,
                    duration_seconds: finalDuration,
                    file_size_bytes: audioBlob.size,
                    status: 'pending',
                    transcript: '',
                    expires_at: expirationDate
                })
                .select()
                .single();

            if (dbError) throw dbError;

            // Replace optimistic log with real one
            setLogs(prev => prev.map(l => l.id === tempId ? newLog : l));
            setActiveLog(newLog);

            // 3. Trigger AI Processing (Async)
            // We don't await this to keep UI responsive, but we could update state when done
            fetch('/api/process-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordId: newLog.id }),
            }).then(async (res) => {
                if (res.ok) {
                    const json = await res.json();

                    // Update local state with transcript
                    setLogs(prev => prev.map(l =>
                        l.id === newLog.id
                            ? { ...l, transcript: json.transcript, status: 'processed', cost_credits: json.usage?.cost }
                            : l
                    ));

                    if (activeLog?.id === newLog.id) {
                        setActiveLog(prev => prev ? { ...prev, transcript: json.transcript, status: 'processed' } : null);
                    }
                } else {
                    let errorMessage = res.statusText;
                    try {
                        const errorJson = await res.json();
                        errorMessage = errorJson.error || JSON.stringify(errorJson);
                    } catch (e) {
                        // ignore JSON parse error
                    }
                    console.error("AI Processing Trigger Failed:", res.status, errorMessage);
                    alert(`Automatický přepis selhal: ${errorMessage}`);
                }
            });

        } catch (error) {
            console.error('Error saving recording:', error);
            alert('Chyba při ukládání záznamu.');
            // Remove optimistic log on error
            setLogs(prev => prev.filter(l => !(l as any).isOptimistic));
        }
    };

    // Play Audio Logic
    const AudioPlayer = ({ path }: { path: string }) => {
        const [url, setUrl] = useState<string | null>(null);
        const [isPlaying, setIsPlaying] = useState(false);
        const audioRef = useRef<HTMLAudioElement | null>(null);

        useEffect(() => {
            const fetchUrl = async () => {
                const { data, error } = await supabase.storage
                    .from('voicelogs')
                    .createSignedUrl(path, 3600); // 1 hour validity
                if (data) setUrl(data.signedUrl);
            };

            fetchUrl();
        }, [path]);

        const togglePlay = () => {
            if (!audioRef.current) return;
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        };

        if (!url) return <div className="text-xs text-slate-900">Načítání audia...</div>;

        return (
            <div className="w-full mt-4 flex flex-col items-center">
                <audio
                    ref={audioRef}
                    src={url}
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    className="hidden"
                />

                <button
                    onClick={togglePlay}
                    className={`
                        w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300
                        ${isPlaying
                            ? 'bg-amber-100 text-amber-600 ring-4 ring-amber-50 scale-95'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 ring-4 ring-indigo-50 hover:scale-105'
                        }
                    `}
                >
                    {isPlaying ? (
                        <Pause className="w-10 h-10 fill-current" />
                    ) : (
                        <Play className="w-10 h-10 fill-current ml-1" />
                    )}
                </button>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    {/* Simple progress bar could go here if needed, but for now just the button as requested */}
                </div>
            </div>
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
    const deleteLog = async (log: VoiceLog, force: boolean = false) => {
        if (!force && !confirm('Opravdu smazat tento záznam?')) return;

        // 1. Delete from storage
        await supabase.storage.from('voicelogs').remove([log.audio_path]);

        // 2. Delete from DB
        await supabase.from('voicelogs').delete().eq('id', log.id);

        setLogs(prev => prev.filter(l => l.id !== log.id));
        if (activeLog?.id === log.id) setActiveLog(null);
    };

    // Check Expirations - Auto Delete & Reload
    useEffect(() => {
        const checkExpirations = () => {
            const now = Date.now();
            logs.forEach(async (log) => {
                if (log.expires_at && !processingDeletionIds.current.has(log.id)) {
                    const expiryTime = new Date(log.expires_at).getTime();
                    // Check if expired
                    if (expiryTime <= now) {
                        console.log(`Log ${log.id} expired. Force deleting.`);
                        processingDeletionIds.current.add(log.id);

                        await deleteLog(log, true);

                        // Reload window 3 seconds after expiration handling
                        setTimeout(() => {
                            window.location.reload();
                        }, 3000);
                    }
                }
            });
        };

        const interval = setInterval(checkExpirations, 1000); // Check every 1s for testing
        return () => clearInterval(interval);
    }, [logs]);

    // Update Expiry
    const updateExpiry = async (id: string, hours: number) => {
        let newExpiresAt: string | null = null;

        // If hours > 0, calculate new date from NOW
        if (hours > 0) {
            newExpiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
        }
        // If hours === 0, it means "Never", so expire_at remains/becomes NULL

        const { error } = await supabase
            .from('voicelogs')
            .update({ expires_at: newExpiresAt })
            .eq('id', id);

        if (!error) {
            // Update local state
            setLogs(prev => prev.map(log => log.id === id ? { ...log, expires_at: newExpiresAt as any } : log));
            if (activeLog?.id === id) {
                setActiveLog(prev => prev ? { ...prev, expires_at: newExpiresAt as any } : null);
            }
            setNotification(hours === 0 ? 'Záznam nastaven jako trvalý.' : 'Expirace záznamu byla aktualizována.');
            setTimeout(() => setNotification(null), 3000);
        } else {
            console.error('Error updating expiry:', error);
            alert('Chyba při aktualizaci expirace.');
        }
    };

    // Manual AI Processing Trigger
    const processAudio = async (log: VoiceLog) => {
        setIsLoading(true); // Re-use loading state or add local one? Let's keep it simple.
        try {
            const res = await fetch('/api/process-audio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordId: log.id }),
            });

            if (!res.ok) {
                const errData = await res.json();
                const error = new Error(errData.error || 'Processing failed');
                (error as any).details = errData.details; // Attach details to the error object
                throw error;
            }

            const json = await res.json();

            // Update State
            setLogs(prev => prev.map(l =>
                l.id === log.id
                    ? { ...l, transcript: json.transcript, status: 'processed', cost_credits: json.usage?.cost }
                    : l
            ));

            if (activeLog?.id === log.id) {
                setActiveLog(prev => prev ? { ...prev, transcript: json.transcript, status: 'processed', cost_credits: json.usage?.cost } : null);
            }

            setNotification('Úspěšně jsem přepsal Váš záznam do textu.');
            setTimeout(() => setNotification(null), 5000);

        } catch (error: any) {
            console.error('Processing error:', error);
            alert(`Chyba zpracování: ${error.message}${error.details ? `\nDetail: ${error.details}` : ''}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* LEFT COLUMN: Header & Recorder */}
                <div className="lg:col-span-12 flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                    <div className="flex items-center">
                        <Link href="/hub" className="mr-4 p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        {/* Logo Link */}
                        <h1 className="text-xl font-bold text-black tracking-tight"><span className="text-blue-600">VoiceLog</span> <span className="text-black font-normal">| Inteligentní hlasové poznámky</span></h1>
                    </div>
                </div>

                {/* MAIN RECORDER AREA */}
                <div className="lg:col-span-12 bg-white rounded-3xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center relative overflow-hidden min-h-[400px]">

                    {/* Visualizer - Full Background Overlay */}
                    {isRecording && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 z-0 opacity-25 pointer-events-none">
                            {Array.from({ length: 32 }).map((_, i) => {
                                const value = audioData[i] || 0;
                                const height = Math.max(12, (value / 255) * 250);
                                return (
                                    <div
                                        key={i}
                                        className="w-4 bg-rose-500 rounded-full transition-all duration-75 ease-linear"
                                        style={{ height: `${height}px` }}
                                    />
                                );
                            })}
                        </div>
                    )}

                    <div className={`relative z-10 transition-all duration-500 ${isRecording ? 'scale-110' : 'scale-100'}`}>
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            className={`
                                w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
                                ${isRecording
                                    ? 'bg-rose-500 hover:bg-rose-600 ring-8 ring-rose-100 animate-pulse'
                                    : 'bg-indigo-600 hover:bg-indigo-700 ring-8 ring-indigo-50'
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

                    <div className="relative z-10 mt-10 text-center min-h-[80px]">
                        {isRecording ? (
                            <div className="flex flex-col items-center">
                                <span className="text-rose-600 font-bold mb-2 animate-pulse uppercase tracking-wider text-sm">Nahrávání</span>
                                <span className="text-6xl font-mono font-bold text-black tracking-tight">{formatTime(recordingDuration)}</span>
                            </div>
                        ) : (
                            <div className="text-slate-900 font-medium">Klikněte pro spuštění nahrávání</div>
                        )}
                    </div>
                </div>

                {/* LIST OF RECORDINGS */}
                <div className="lg:col-span-5 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-semibold text-lg flex items-center gap-2 text-black">
                            <FileAudio className="w-5 h-5 text-indigo-500" />
                            Moje záznamy
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-4 space-y-3">
                        {isLoading ? (
                            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>
                        ) : logs.length === 0 ? (
                            <div className="text-center text-black p-8">Žádné záznamy</div>
                        ) : (
                            logs.map(log => {
                                // Calculate time remaining
                                const getRemainingTime = () => {
                                    if (!log.expires_at) return null;
                                    const now = new Date();
                                    const expiry = new Date(log.expires_at);
                                    const diff = expiry.getTime() - now.getTime();

                                    if (diff <= 0) return "Expirovalo";

                                    const hours = Math.floor(diff / (1000 * 60 * 60));
                                    const days = Math.floor(hours / 24);

                                    if (days > 0) return `${days} dní`;
                                    if (hours > 0) return `${hours} hod`;
                                    const minutes = Math.floor(diff / (1000 * 60));
                                    return `${minutes} min`;
                                };

                                const remaining = getRemainingTime();

                                return (
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
                                                <h3 className={`font-bold text-black ${activeLog?.id === log.id ? 'text-indigo-900' : ''}`}>
                                                    {log.title}
                                                </h3>
                                                <p className="text-xs text-black font-medium mt-1">{formatDate(log.created_at)}</p>

                                                {remaining && (
                                                    <p className="text-xs text-red-600 font-bold mt-1 flex items-center">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        Smaže se za: {remaining}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs font-bold font-mono text-black bg-slate-100 px-2 py-1 rounded-full">
                                                    {formatTime(log.duration_seconds || 0)}
                                                </span>
                                                {log.status === 'pending' && (
                                                    <span className="w-2 h-2 rounded-full bg-amber-400" title="Zpracovává se" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* DETAIL VIEW */}
                <div className="lg:col-span-7 bg-white rounded-3xl shadow-sm border border-slate-100 h-[600px] flex flex-col p-8">
                    {activeLog ? (
                        <>
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex-1 mr-4">
                                    <label className="text-xs font-semibold uppercase tracking-wider text-black mb-1 block">Název záznamu</label>
                                    <input
                                        type="text"
                                        className="text-2xl font-bold text-black bg-transparent border-b border-dashed border-slate-300 focus:border-indigo-500 focus:outline-none w-full pb-1"
                                        defaultValue={activeLog.title}
                                        onBlur={(e) => updateTitle(activeLog.id, e.target.value)}
                                    />
                                </div>
                                <button onClick={() => deleteLog(activeLog)} className="text-slate-400 hover:text-red-500 transition-colors p-2">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Expiry Control */}
                            <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span className="text-sm font-medium text-slate-700">Smazat za:</span>

                                <select
                                    className="bg-white border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none"
                                    onChange={(e) => updateExpiry(activeLog.id, Number(e.target.value))}
                                    // We don't have the exact "hours remaining" stored as a perfect match for options,
                                    // so we might default to a placeholder or try to approximate if needed.
                                    // For now, let's just show a "Change..." action or blank default if we don't want to calculate reverse.
                                    // Better: UI shows current status text, dropdown sets NEW status.
                                    defaultValue=""
                                >
                                    <option value="" disabled>Změnit expiraci...</option>
                                    <option value="0.004167">15 sekund (Test)</option>
                                    <option value="0.008333">30 sekund (Test)</option>
                                    <option value="0.016667">1 minuta (Test)</option>
                                    <option value="0.083333">5 minut (Test)</option>
                                    <option value="0.166667">10 minut</option>
                                    <option value="0.5">30 minut</option>
                                    <option value="1">1 hodina</option>
                                    <option value="6">6 hodin</option>
                                    <option value="24">24 hodin</option>
                                    <option value="168">1 týden</option>
                                    <option value="0">Nikdy (Trvalé)</option>
                                </select>

                                {activeLog.expires_at ? (
                                    <span className="text-xs text-red-500 font-bold ml-auto">
                                        Expiruje: {new Date(activeLog.expires_at).toLocaleString('cs-CZ')}
                                    </span>
                                ) : (
                                    <span className="text-xs text-green-600 font-bold ml-auto">
                                        Trvalý záznam
                                    </span>
                                )}
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                                <AudioPlayer path={activeLog.audio_path} />

                                {/* Usage Stats Badge */}
                                {(activeLog.cost_credits !== undefined || activeLog.status === 'processed') && (
                                    <div className="flex items-center gap-4 mt-4 text-xs text-black border-t border-slate-200 pt-3">
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-black">Cena:</span>
                                            <span className="text-amber-600 font-bold">{activeLog.cost_credits ?? 0} kreditů</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-black">AI Input:</span>
                                            <span>{activeLog.tokens_input || 0} tok.</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="font-semibold text-black">AI Output:</span>
                                            <span>{activeLog.tokens_output || 0} tok.</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-semibold text-black">Přepis (Transcript)</h3>
                                    <div className="flex gap-2">
                                        {activeLog.status === 'pending' && (
                                            <button
                                                onClick={() => processAudio(activeLog)}
                                                className="flex items-center gap-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full transition-colors shadow-sm"
                                            >
                                                <Sparkles className="w-3 h-3" />
                                                Přepsat pomocí AI
                                            </button>
                                        )}
                                        <button
                                            onClick={() => copyToClipboard(activeLog.transcript || '')}
                                            className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
                                            disabled={!activeLog.transcript}
                                        >
                                            <Copy className="w-3 h-3" />
                                            Kopírovat text
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex-1 overflow-y-auto text-black leading-relaxed font-medium">
                                    {activeLog.transcript ? (
                                        activeLog.transcript
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-900 gap-3">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                                                <Loader2 className={`w-6 h-6 text-slate-900 ${activeLog.status === 'pending' ? 'animate-spin' : ''}`} />
                                            </div>
                                            {activeLog.status === 'pending' ? (
                                                <p className="font-bold">Čeká na zpracování...</p>
                                            ) : (
                                                <p>Přepis není k dispozici.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-black">
                            <FileAudio className="w-16 h-16 text-slate-200 mb-4" />
                            <p>Vyberte záznam pro zobrazení detailů</p>
                        </div>
                    )}
                </div>

            </div>

            {/* Notification Toast */}
            {notification && (
                <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce-in z-50">
                    <Check className="w-5 h-5 text-green-400" />
                    <p className="font-medium">{notification}</p>
                </div>
            )}
        </div>
    );
}
