
"use client";

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

    // Effect to toggle Annyang based on isActive
    useEffect(() => {
        if (!isSupported || !annyang) return;

        if (isActive) {
            console.log("🎤 VoiceMedica: ACTIVATED");

            // Set Language
            annyang.setLanguage('cs-CZ');

            // Define Commands
            const commands = {
                // APP NAVIGATION (Synonyms)
                'otevři *app': (app: string) => handleAppCommand(app),
                'spusť *app': (app: string) => handleAppCommand(app),
                'zobraz *app': (app: string) => handleAppCommand(app),
                'jdi na *app': (app: string) => handleAppCommand(app),

                // SPECIFIC FEATURES
                'najdi pacienta *name': (name: string) => {
                    console.log("🔍 Hledám pacienta:", name);
                    onCommandRecognized('SEARCH_PATIENT', name);
                },
                'ukaž dnešní plán': () => {
                    onCommandRecognized('SHOW_PLAN');
                },
                'nový záznam': () => {
                    onCommandRecognized('NEW_RECORD');
                },

                // SYSTEM
                'zavři': () => onCommandRecognized('CLOSE'),
                'zruš': () => onCommandRecognized('CLOSE'),
                'stop': () => {
                    annyang.abort();
                    onStatusChange('off');
                }
            };

            // Helper to normalize app names
            const handleAppCommand = (rawApp: string) => {
                console.log("🗣️ Voice Command:", rawApp);
                const normalized = rawApp.toLowerCase().trim();

                // Map Czech synonyms to App IDs
                let appId = null;
                if (normalized.includes('kartoték') || normalized.includes('pacient')) appId = 'patients';
                else if (normalized.includes('kalendář') || normalized.includes('plán')) appId = 'eventlog';
                else if (normalized.includes('léky') || normalized.includes('medikac') || normalized.includes('medlog')) appId = 'medlog';
                else if (normalized.includes('teplot') || normalized.includes('senzor') || normalized.includes('termolog')) appId = 'termolog';
                else if (normalized.includes('hlas') || normalized.includes('záznam') || normalized.includes('voicelog')) appId = 'voicelog';
                else if (normalized.includes('nastavení') || normalized.includes('účet')) appId = 'settings';
                else if (normalized.includes('report') || normalized.includes('statistik')) appId = 'reporty';
                else if (normalized.includes('sterilizac') || normalized.includes('sterilog')) appId = 'sterilog';

                if (appId) {
                    onCommandRecognized('NAVIGATE', appId);
                    sendToBackend('LAUNCH_APP', appId);
                } else {
                    console.warn(`❓ App "${rawApp}" not recognized.`);
                }
            };

            // Register
            annyang.addCommands(commands);

            // Callbacks
            annyang.addCallback('soundstart', () => {
                onStatusChange('listening');
            });

            annyang.addCallback('result', (phrases: any) => {
                console.log("👂 Raw phrases:", phrases);
                onStatusChange('idle'); // Back to idle after result
            });

            annyang.addCallback('end', () => {
                // If it was manually stopped, we stay off. 
                // If it stopped due to silence but isActive is true, Annyang usually handles auto-restart if continuous is on.
                // But we want to be explicit.
                if (isActive) {
                    onStatusChange('idle');
                } else {
                    onStatusChange('off');
                }
            });

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
    }, [isActive, isSupported]); // Re-run if active state changes


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
