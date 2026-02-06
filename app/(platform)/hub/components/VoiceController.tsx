
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
}

export const useVoiceController = ({ onCommandRecognized, onStatusChange, isActive }: VoiceControllerProps) => {
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && annyang) {
            setIsSupported(true);
        }
    }, []);
    // State for dynamic mappings
    const [appMappings, setAppMappings] = useState<any[]>([]);

    // Learning State Machine
    type LearningStep = 'IDLE' | 'WAITING_FOR_CATEGORY' | 'WAITING_FOR_APP_SELECTION' | 'WAITING_FOR_ACTION_SELECTION' | 'WAITING_FOR_SYNONYM' | 'CONFIRMATION';
    const [learningState, setLearningState] = useState<{
        step: LearningStep;
        targetApp?: string;
        targetAction?: string; // 'NAVIGATE' or specific key like 'NEW_RECORD'
        tempSynonym?: string;
    }>({ step: 'IDLE' });

    const supabase = createClient();

    // TTS Helper
    const speak = (text: string) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'cs-CZ';
            window.speechSynthesis.speak(utterance);
        }
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
            console.log("🎤 MEDICA: ACTIVATED (State:", learningState.step, ")");
            annyang.setLanguage('cs-CZ');

            // --- DYNAMIC COMMAND GENERATION BASED ON STATE --- //
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

            const resolveActionKey = (appId: string, phrase: string) => {
                const app = appMappings.find(a => a.code === appId);
                if (!app || !app.actions) return null;
                const normalized = phrase.toLowerCase().trim();

                // Search keys and values
                for (const [key, synonyms] of Object.entries(app.actions)) {
                    if (key === normalized) return key; // direct key match
                    if (Array.isArray(synonyms) && synonyms.some((s: any) => s.toLowerCase().includes(normalized))) {
                        return key;
                    }
                }
                return null;
            };

            const handleAppCommand = (appId: string, actionKey: string = 'NAVIGATE') => {
                onCommandRecognized(actionKey, appId);
                sendToBackend('EXECUTE_ACTION', { appId, action: actionKey });
            };

            const handleGenericPhrase = (phrase: string) => {
                // Try to find ANY match across all apps/actions
                console.log("Handling Generic Phrase:", phrase);
                const normalized = phrase.toLowerCase().trim();

                // 1. Check App Navigation Synonyms
                let appId = resolveAppId(normalized);
                if (appId) {
                    handleAppCommand(appId, 'NAVIGATE');
                    return;
                }

                // 2. Check Action Synonyms
                for (const app of appMappings) {
                    if (app.actions) {
                        for (const [key, synonyms] of Object.entries(app.actions)) {
                            if (Array.isArray(synonyms) && synonyms.some((s: any) => normalized.includes(s.toLowerCase()))) {
                                console.log(`Matched Action: ${key} on App: ${app.code}`);
                                handleAppCommand(app.code, key);
                                return;
                            }
                        }
                    }
                }

                console.warn("Unrecognized phrase:", phrase);
            };

            const finalizeLearning = async () => {
                const { targetApp, targetAction, tempSynonym } = learningState;
                if (!targetApp || !targetAction || !tempSynonym) return;

                speak(`Dobře, ukládám ${tempSynonym} pro ${targetApp}.`);

                try {
                    // Update DB via RPC "learn_app_action"
                    const { error } = await supabase.rpc('learn_app_action', {
                        p_app_code: targetApp,
                        p_action_key: targetAction,
                        p_synonym: tempSynonym
                    });

                    if (error) {
                        console.error(error);
                        speak("Chyba při ukládání.");
                    } else {
                        // Refresh Mappings
                        const { data } = await supabase.from('defined_apps').select('code, label, synonyms, actions');
                        if (data) setAppMappings(data);
                        speak("Uloženo. Můžeš to vyzkoušet.");
                    }
                } catch (e) { console.error(e); }

                setLearningState({ step: 'IDLE' });
            };


            // --- COMMAND DEFINITIONS --- //

            if (learningState.step === 'IDLE') {
                // STANDARD MODE
                commands = {
                    // Trigger Learning
                    'medica naučím tě': () => {
                        speak("Co? Otevřít aplikaci, nebo novou akci?");
                        setLearningState({ step: 'WAITING_FOR_CATEGORY' });
                    },
                    'naučím tě': () => {
                        speak("Co? Otevřít aplikaci, nebo novou akci?");
                        setLearningState({ step: 'WAITING_FOR_CATEGORY' });
                    },

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
            }
            else if (learningState.step === 'WAITING_FOR_CATEGORY') {
                commands = {
                    'otevřít aplikaci': () => {
                        speak("Kterou aplikaci?");
                        setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_APP_SELECTION', targetAction: 'NAVIGATE' }));
                    },
                    'novou akci': () => {
                        speak("Pro jakou aplikaci?");
                        setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_APP_SELECTION' }));
                    },
                    'akci': () => {
                        speak("Pro jakou aplikaci?");
                        setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_APP_SELECTION' }));
                    },
                    'zruš': () => { speak("Ruším učení."); setLearningState({ step: 'IDLE' }); },
                    '*phrase': () => speak("Řekni 'otevřít aplikaci' nebo 'novou akci'.")
                };
            }
            else if (learningState.step === 'WAITING_FOR_APP_SELECTION') {
                commands = {
                    '*app': (app: string) => {
                        // Check if user said "zruš"
                        if (app.toLowerCase().includes('zruš')) { speak("Ruším."); setLearningState({ step: 'IDLE' }); return; }

                        const appId = resolveAppId(app);
                        if (appId) {
                            if (learningState.targetAction === 'NAVIGATE') {
                                speak(`Dobře, ${appId}. Jak tomu chceš říkat?`);
                                setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_SYNONYM', targetApp: appId }));
                            } else {
                                speak(`Dobře, ${appId}. Jakou akci? Například nový záznam?`);
                                setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_ACTION_SELECTION', targetApp: appId }));
                            }
                        } else {
                            speak(`Aplikaci ${app} neznám. Zkus to znovu.`);
                        }
                    }
                };
            }
            else if (learningState.step === 'WAITING_FOR_ACTION_SELECTION') {
                commands = {
                    '*action': (actionPhrase: string) => {
                        if (actionPhrase.toLowerCase().includes('zruš')) { speak("Ruším."); setLearningState({ step: 'IDLE' }); return; }

                        const actionKey = resolveActionKey(learningState.targetApp!, actionPhrase);

                        if (actionKey) {
                            speak(`Jasně, ${actionPhrase}. Jak tomu chceš říkat nově?`);
                            setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_SYNONYM', targetAction: actionKey }));
                        } else {
                            speak("Tuto akci zatím neumím definovat. Zkus vybrat existující, třeba nový záznam.");
                        }
                    }
                };
            }
            else if (learningState.step === 'WAITING_FOR_SYNONYM') {
                commands = {
                    '*synonym': (synonym: string) => {
                        if (synonym.toLowerCase().includes('zruš')) { speak("Ruším."); setLearningState({ step: 'IDLE' }); return; }

                        speak(`Mám uložit ${synonym}? Řekni hotovo.`);
                        setLearningState(prev => ({ ...prev, step: 'CONFIRMATION', tempSynonym: synonym }));
                    }
                };
            }
            else if (learningState.step === 'CONFIRMATION') {
                commands = {
                    'hotovo': () => finalizeLearning(),
                    'ano': () => finalizeLearning(),
                    'ne': () => {
                        speak("Tak znova. Jak tomu chceš říkat?");
                        setLearningState(prev => ({ ...prev, step: 'WAITING_FOR_SYNONYM' }));
                    },
                    'zruš': () => { speak("Ruším."); setLearningState({ step: 'IDLE' }); }
                };
            }

            // Register
            annyang.removeCommands();
            annyang.addCommands(commands);

            // Callbacks
            annyang.addCallback('soundstart', () => onStatusChange('listening'));
            annyang.addCallback('result', () => { /* idle handled by end usually, but good to reset if stuck */ });

            // Start
            annyang.start({ autoRestart: true, continuous: true });
            onStatusChange('idle');

        } else {
            // Deactivate
            console.log("🔇 VoiceMedica: DEACTIVATED");
            annyang.abort();
            annyang.removeCommands();
            onStatusChange('off');
        }

        return () => {
            if (annyang) {
                annyang.abort();
                annyang.removeCommands();
            }
        };
    }, [isActive, isSupported, appMappings, learningState]); // Re-run if active state changes or learning state advances


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
