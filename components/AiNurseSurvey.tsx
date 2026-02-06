"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { ArrowRight, Check, Globe } from "lucide-react";
import Image from "next/image";

// --- Types ---

interface SurveyAnswer {
    questionId: number;
    questionText: string;
    selectedOption: string;
}

interface Question {
    id: number;
    heading: string;
    description: string;
    illustration?: React.ReactNode;
    options: string[];
}

// --- Data based on User Request ---

const QUESTIONS: Question[] = [
    {
        id: 1,
        heading: "Kam umístíme vaši novou AI asistentku?",
        description: "Hardware vs. Software",
        illustration: (
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                <Image
                    src="/survey_viz_q1.jpg"
                    alt="Hardware vs Software"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
        ),
        options: [
            "Samostatný dotykový terminál na stole (vždy na očích)",
            "Elegantní widget přímo ve vašem stávajícím PC",
            "Mobilní aplikace (asistentka stále v kapse pláště)"
        ]
    },
    {
        id: 2,
        heading: "Interakce: Jak to cítíte?",
        description: "Dotyk vs. Hlas",
        illustration: (
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                <Image
                    src="/survey_viz_q2.png"
                    alt="Touch vs Voice"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
        ),
        options: [
            "Chci na ni mluvit (hlasové povely, diktování)",
            "Raději klepnu prstem (rychlé volby na dotykové obrazovce)",
            "Kombinace obojího (hlas pro text, dotyk pro potvrzení)"
        ]
    },
    {
        id: 3,
        heading: "Killer Feature: Co vám nejvíc chybí?",
        description: "Kde vás nejvíc tlačí bota?",
        illustration: (
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                <Image
                    src="/survey_viz_q3.jpg"
                    alt="Key Feature"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
        ),
        options: [
            "Automatický zápis do karty (přepis rozhovoru s pacientem)",
            "Hlídání termínů a expirací (Sestra 'Nezapomněnka')",
            "Objednávání pacientů a správa kalendáře",
            "Inteligentní rešerše v dokumentaci (najdi, kdy měl naposledy ATB)"
        ]
    },
    {
        id: 4,
        heading: "Důvěra a data",
        description: "Bezpečnost na prvním místě",
        illustration: (
            <div className="relative w-full h-64 rounded-xl overflow-hidden shadow-lg border border-slate-700">
                <Image
                    src="/survey_viz_q4.jpg"
                    alt="Security"
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
            </div>
        ),
        options: [
            "Data musí zůstat lokálně v ordinaci (Offline AI)",
            "Cloud je OK, pokud je to šifrované a GDPR compliant",
            "Nezáleží mi na tom, hlavně ať to funguje perfektně"
        ]
    }
];

// --- Component ---

export const AiNurseSurvey = ({ remainingSlots = 142 }: { remainingSlots?: number }) => {
    const supabase = createClient();

    const [isOpen, setIsOpen] = useState(true); // Can be used to close/minimize
    const [step, setStep] = useState(0); // 0 to QUESTIONS.length (last steps are feedback & email)
    const [answers, setAnswers] = useState<SurveyAnswer[]>([]);
    const [feedback, setFeedback] = useState("");
    const [email, setEmail] = useState("");
    const [sessionId, setSessionId] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);

    // Initialize Session ID on mount
    useEffect(() => {
        setSessionId(crypto.randomUUID());
    }, []);

    const handleAnswer = (option: string) => {
        const currentQ = QUESTIONS[step];
        const newAnswer: SurveyAnswer = {
            questionId: currentQ.id,
            questionText: currentQ.heading,
            selectedOption: option
        };

        setAnswers(prev => [...prev, newAnswer]);

        // Advance
        setTimeout(() => {
            setStep(prev => prev + 1);
        }, 250);
    };

    const handleFeedbackSubmit = () => {
        // Just advance to email step
        setStep(prev => prev + 1);
    };

    const submitAll = async () => {
        if (!email || !email.includes('@')) {
            alert("Prosím zadejte platný e-mail.");
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Convert answers to DB format rows
            const resultsPayload = answers.map(a => ({
                session_id: sessionId,
                question_text: a.questionText,
                selected_option: a.selectedOption
            }));

            // Add Feedback if present
            if (feedback.trim()) {
                resultsPayload.push({
                    session_id: sessionId,
                    question_text: "User Feedback / Vzkaz",
                    selected_option: feedback.trim()
                });
            }

            // 2. Submit Answers
            const { error: answersError } = await supabase
                .from('survey_results')
                .insert(resultsPayload);

            if (answersError) throw answersError;

            // 3. Submit Beta Request
            const { error: leadError } = await supabase
                .from('beta_requests')
                .insert({
                    email: email,
                    notes: `Survey Session: ${sessionId}`,
                    status: 'pending'
                });

            if (leadError) throw leadError;

            setIsCompleted(true);
        } catch (error) {
            console.error("Survey submission error:", error);
            alert("Omlouváme se, došlo k chybě při odesílání. Zkuste to prosím znovu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    // --- Renders ---

    // Completed State
    if (isCompleted) {
        return (
            <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-slate-900 border border-cyan-900/50 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-600"></div>

                <div className="mb-6 flex justify-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-20 h-20 bg-gradient-to-tr from-cyan-900/40 to-blue-900/40 rounded-full flex items-center justify-center border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                    >
                        <Check className="w-10 h-10 text-cyan-400" />
                    </motion.div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">Děkujeme za váš názor</h3>
                <p className="text-slate-400 mb-8 max-w-xs mx-auto">
                    Vaše zpětná vazba nám pomůže vytvořit lepší AI sestru.
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/40 transition-all transform hover:scale-[1.02]"
                    >
                        Vyzkoušet demo
                    </button>

                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-colors border border-slate-700"
                    >
                        Zavřít
                    </button>
                </div>
            </div>
        );
    }

    const isQuestionStep = step < QUESTIONS.length;
    const isFeedbackStep = step === QUESTIONS.length;
    const isEmailStep = step === QUESTIONS.length + 1;

    // Progress calculation (Questions + Feedback + Email = Total Steps)
    const totalSteps = QUESTIONS.length + 2;
    const progress = Math.min(100, ((step + 1) / totalSteps) * 100);

    const currentQuestion = isQuestionStep ? QUESTIONS[step] : null;

    return (
        <div className="w-full max-w-lg mx-auto font-sans">
            {/* Card Container */}
            <div className="relative bg-slate-950/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">

                {/* Progress Bar */}
                <div className="w-full h-1 bg-slate-900">
                    <motion.div
                        className="h-full bg-cyan-500 shadow-[0_0_10px_#06b6d4]"
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>

                <div className="p-6 md:p-8 min-h-[420px] flex flex-col relative">

                    {/* Branding / Header */}
                    <div className="absolute top-6 left-8 flex items-center gap-2 opacity-50">
                        <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold">AI Sestra Výzkum</span>
                    </div>

                    <AnimatePresence mode="wait">
                        {isQuestionStep && currentQuestion ? (
                            <motion.div
                                key={currentQuestion.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 flex flex-col pt-8"
                            >
                                {/* Illustration */}
                                <div className="mb-6 h-16 flex items-center justify-center opacity-80">
                                    {currentQuestion.illustration}
                                </div>

                                {/* Text */}
                                <div className="text-center mb-8">
                                    <h3 className="text-sm font-medium text-cyan-500 uppercase tracking-wider mb-2">{currentQuestion.description}</h3>
                                    <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{currentQuestion.heading}</h2>
                                </div>

                                {/* Options */}
                                <div className="flex flex-col gap-3 mt-auto">
                                    {currentQuestion.options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(option)}
                                            className="group relative p-4 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 hover:bg-slate-800 transition-all duration-200 text-left flex items-center gap-4 shadow-sm"
                                        >
                                            <div className="w-6 h-6 rounded-full border border-slate-500 group-hover:border-cyan-400 flex items-center justify-center shrink-0 transition-colors">
                                                <div className="w-3 h-3 rounded-full bg-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
                                            </div>
                                            <span className="text-cyan-50 group-hover:text-cyan-300 font-medium text-sm md:text-base leading-snug tracking-wide transition-colors">
                                                {option}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : isFeedbackStep ? (
                            /* Feedback Step */
                            <motion.div
                                key="feedback-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex-1 flex flex-col pt-12"
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-sm font-medium text-cyan-500 uppercase tracking-wider mb-2">Zanechte nám vzkaz</h3>
                                    <h2 className="text-2xl font-bold text-white leading-tight">Máte něco na srdci?</h2>
                                    <p className="text-slate-400 text-sm mt-2">Napište nám cokoliv, co vás napadá k AI ve zdravotnictví.</p>
                                </div>

                                <textarea
                                    value={feedback}
                                    onChange={(e) => setFeedback(e.target.value)}
                                    placeholder="Váš vzkaz..."
                                    className="w-full h-32 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all mb-6 resize-none"
                                />

                                <button
                                    onClick={handleFeedbackSubmit}
                                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 transition-all"
                                >
                                    {feedback.trim() ? "Pokračovat" : "Přeskočit"}
                                </button>
                            </motion.div>
                        ) : (
                            /* Email / Final Step */
                            <motion.div
                                key="email-step"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex-1 flex flex-col justify-center items-center pt-8 text-center"
                            >
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-900/40 border border-cyan-500/30 rounded-full mb-6 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_cyan]"></div>
                                    <span className="text-xs font-bold text-cyan-200 uppercase tracking-wider">Zbývá posledních {remainingSlots} z 500 míst</span>
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-3 leading-tight">Získejte přednostní přístup a výhody</h2>

                                <p className="text-cyan-50 mb-8 max-w-xs mx-auto text-sm leading-relaxed opacity-90">
                                    Otevíráme 500 exkluzivních slotů pro testování. Vaše registrace vám zajistí místo a <strong className="text-cyan-300 font-bold border-b border-cyan-500/30 pb-0.5">výhodnější předplatné na první rok</strong> po spuštění.
                                    <br /><br />
                                    <span className="italic opacity-80">Vážíme si vaší pomoci.</span>
                                </p>

                                <div className="w-full max-w-sm">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Váš pracovní e-mail"
                                        className="w-full px-5 py-4 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all mb-4 shadow-inner"
                                    />
                                    <button
                                        onClick={submitAll}
                                        disabled={isSubmitting}
                                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold tracking-wide rounded-xl shadow-[0_4px_20px_rgba(6,182,212,0.4)] hover:shadow-[0_6px_25px_rgba(6,182,212,0.5)] transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                ZAREZERVOVAT MÍSTO <ArrowRight className="w-5 h-5" />
                                            </>
                                        )}
                                    </button>
                                </div>
                                <p className="mt-5 text-[10px] text-slate-500/70 uppercase tracking-widest">
                                    100% Bezpečí dat • Žádný spam
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );

};
