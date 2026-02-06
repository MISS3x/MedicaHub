
"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState, useRef } from 'react';
import _annyang from 'annyang';
const annyang = _annyang as any;

// Define Command Types
export type VoiceCommandAction = (payload?: string) => void;

export interface VoiceControllerProps {
    onCommandRecognized: (command: string, payload?: string) => void;
    onStatusChange: (status: 'listening' | 'processing' | 'idle' | 'off') => void;
    isActive: boolean; // Managed by parent (e.g., toggled by Brain button)
    onTranscript?: (text: string) => void; // Optional callback for transcript
}

export const useVoiceController = ({ onCommandRecognized, onStatusChange, isActive, onTranscript }: VoiceControllerProps) => {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && annyang) {
            setIsSupported(true);
        }
    }, []);
    // State for dynamic mappings
    const [appMappings, setAppMappings] = useState<any[]>([]);

    const supabase = createClient();

    // TTS Helper with Voice Selection
    const [voicesLoaded, setVoicesLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const loadVoices = () => {
                const v = window.speechSynthesis.getVoices();
                if (v.length > 0) setVoicesLoaded(true);
            };
            window.speechSynthesis.onvoiceschanged = loadVoices;
            loadVoices();
        }
    }, []);

    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'cs-CZ';

            // ATTEMPT TO FIND FEMALE VOICE
            const voices = window.speechSynthesis.getVoices();
            const czechVoices = voices.filter(v => v.lang === 'cs-CZ' || v.lang === 'cs_CZ');

            // Expanded Female Priority List
            let selectedVoice = czechVoices.find(v => v.name.includes('Zuzana')) ||
                czechVoices.find(v => v.name.includes('Vlasta')) ||
                czechVoices.find(v => v.name.includes('Iveta')) ||
                czechVoices.find(v => v.name.includes('Google Čeština')) ||
                czechVoices.find(v => v.name.toLowerCase().includes('female')) ||
                czechVoices[0]; // Fallback

            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }

            window.speechSynthesis.speak(utterance);
        }
    };

    // TIPS GENERATOR
    const getRandomTip = () => {
        const tips = [
            "Můžeš říct: Otevři červenou aplikaci",
            "Zkus říct: Nový záznam",
            "Řekni třeba: Otevři MedLog",
            "Můžeš zkusit: Zelená aplikace",
            "Poslouchám. Zkus říct: Otevři TermoLog",
            "Zkus: Otevři VoiceLog",
            "Jsem jedno ucho. Řekni: Nový lék"
        ];
        // Add dynamic tips potentially from appMappings if populated, for now static mixed is safer/faster
        return tips[Math.floor(Math.random() * tips.length)];
    };


    // 1. Fetch Mappings from DB on Mount
    useEffect(() => {
        const fetchMappings = async () => {
            const { data, error } = await supabase
                .from('defined_apps')
                .select('code, label, synonyms, actions');

            if (data) {
                setAppMappings(data);
            }
        };

        fetchMappings();
    }, []);

    // Effect to toggle Annyang based on isActive
    useEffect(() => {
        if (!isSupported || !annyang) return;

        if (isActive) {
            console.log("🎤 MEDICA: ACTIVATED (Standard Mode)");
            annyang.setLanguage('cs-CZ');

            // --- GREETING WITH RANDOM APP TIP ---
            if (appMappings && appMappings.length > 0) {
                // 1. Pick Random App
                const randomApp = appMappings[Math.floor(Math.random() * appMappings.length)];
                const appLabel = randomApp.label || randomApp.code;

                // 2. Gather Triggers (Label + Synonyms)
                const rawTriggers = [appLabel, ...(randomApp.synonyms || [])].filter(Boolean);

                // 3. Unique & Shuffle
                const uniqueTriggers = Array.from(new Set(rawTriggers.map((s: string) => s.trim())));
                const shuffled = uniqueTriggers.sort(() => 0.5 - Math.random());

                // 4. Select up to 3
                const selected = shuffled.slice(0, 3);

                // 5. Format message
                if (selected.length > 0) {
                    let examples = "";
                    if (selected.length === 1) {
                        examples = `'${selected[0]}'`;
                    } else {
                        const last = selected.pop();
                        examples = selected.map(s => `'${s}'`).join(", ") + ` nebo '${last}'`;
                    }

                    const greeting = `Pro spuštění aplikace ${appLabel} stačí říct: ${examples}.`;
                    speak(greeting);
                } else {
                    speak(`Jsem připravena. Pro spuštění aplikace ${appLabel} stačí říct její název.`);
                }
            } else {
                speak("Jsem připravena. Otevři aplikaci, nebo diktuj.");
            }


            // --- DYNAMIC COMMAND GENERATION --- //
            let commands = {};

            // --- HELPERS (Closed over state) ---
            const resolveAppId = (raw: string) => {
                const normalized = raw.toLowerCase().trim();
                for (const app of appMappings) {
                    if (app.code === normalized || app.label?.toLowerCase() === normalized) return app.code;
                    if (app.synonyms?.includes(normalized)) return app.code;
                }
                return null;
            };

            const handleAppCommand = (appId: string, actionKey: string = 'NAVIGATE') => {
                onCommandRecognized(actionKey, appId);
                sendToBackend('EXECUTE_ACTION', { appId, action: actionKey });
            };

            const handleGenericPhrase = (phrase: string) => {
                console.log("Handling Generic Phrase:", phrase);

                // 1. Normalize & Clean (Remove wake words)
                let normalized = phrase.toLowerCase().trim();
                normalized = normalized.replace(/^voicemedica\s+/, '').replace(/^medica\s+/, '');
                normalized = normalized.replace(/^prosím\s+/, ''); // Politeness check

                console.log("Normalized Voice Command:", normalized);

                // 2. Identify App (Best Match)
                let targetAppId: string | null = null;
                let targetAppMatchLength = 0;

                for (const app of appMappings) {
                    // Check Code
                    if (normalized.includes(app.code) && app.code.length > targetAppMatchLength) {
                        targetAppId = app.code;
                        targetAppMatchLength = app.code.length;
                    }
                    // Check Label
                    if (app.label && normalized.includes(app.label.toLowerCase()) && app.label.length > targetAppMatchLength) {
                        targetAppId = app.code;
                        targetAppMatchLength = app.label.length;
                    }
                    // Check Synonyms
                    if (app.synonyms) {
                        for (const syn of app.synonyms) {
                            if (normalized.includes(syn.toLowerCase()) && syn.length > targetAppMatchLength) {
                                targetAppId = app.code;
                                targetAppMatchLength = syn.length;
                            }
                        }
                    }
                }

                // 3. Determine Action
                if (targetAppId) {
                    const app = appMappings.find(a => a.code === targetAppId);

                    // A. Check for specific actions in the phrase
                    if (app && app.actions) {
                        for (const [key, synonyms] of Object.entries(app.actions)) {
                            // "NAVIGATE" is default, check others first or check all
                            if (Array.isArray(synonyms) && synonyms.some((s: any) => normalized.includes(s.toLowerCase()))) {
                                console.log(`Matched Action: ${key} for App: ${targetAppId}`);
                                handleAppCommand(targetAppId, key);
                                return;
                            }
                        }
                    }

                    // B. Default to NAVIGATE if just App Name occurred or "Otevři [App]" (where Otevři might be generic or missing)
                    console.log(`Matched App only (defaulting to NAVIGATE): ${targetAppId}`);
                    handleAppCommand(targetAppId, 'NAVIGATE');
                    return;
                }

                // 4. Fallback: Check Global Actions (if no app detected)
                console.warn("Unrecognized phrase:", phrase);
                speak(`Nerozumím příkazu ${phrase}.`);
            };


            // --- COMMAND DEFINITIONS (STANDARD ONLY) --- //
            commands = {
                // Standard App Navigation
                'otevři *app': (app: string) => handleAppCommand(app), // Will likely fail strict match if *app catches too much, but Annyang handles generic ' *phrase' lower priority usually

                // Specific Actions
                // Annyang priority: Specific strings > Named wildcards > Splats
                // We rely on a catch-all for complex mappings
                '*phrase': (phrase: string) => handleGenericPhrase(phrase),

                // System
                'zruš': () => onCommandRecognized('CLOSE'),
                'stop': () => { annyang.abort(); onStatusChange('off'); }
            };


            // Register
            annyang.removeCommands();
            annyang.addCommands(commands);

            // Callbacks
            annyang.addCallback('soundstart', () => onStatusChange('listening'));
            annyang.addCallback('result', (phrases: string[]) => {
                if (phrases && phrases.length > 0) {
                    const text = phrases[0];
                    console.log("🎤 Recognised:", text);
                    if (onTranscript) onTranscript(text);
                }
            });

            // Start
            annyang.start({ autoRestart: true, continuous: true });
            onStatusChange('idle');

        } else {
            // Deactivate
            console.log("🔇 VoiceMedica: DEACTIVATED");
            if ('speechSynthesis' in window) window.speechSynthesis.cancel(); // Stop talking immediately
            annyang.abort();
            annyang.removeCommands();
            onStatusChange('off');
        }

        return () => {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel(); // Stop talking on unmount
            if (annyang) {
                annyang.abort();
                annyang.removeCommands();
            }
        };
    }, [isActive, isSupported, appMappings]); // Removed learningState dependency


    // Send to Backend Node
    const sendToBackend = async (action: string, payload: any) => {
        try {
            await fetch('/api/voicemedica/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action,
                    payload,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (e) {
            console.error("Failed to send command to VoiceMedica Node:", e);
        }
    };

    return { isSupported };
};
