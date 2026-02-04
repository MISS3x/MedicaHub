'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { User, Shield, CreditCard, Star, ArrowLeft, Loader2, Save, Check, LogOut, Monitor, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { updateProfile, updateSubscription, updateBilling, signOut, deleteAccount, updateAppSettings } from './actions';

interface SettingsClientProps {
    user: any;
    profile: any;
    organization: any;
    billing: any;
}

export default function SettingsClient({ user, profile, organization, billing }: SettingsClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing' | 'subscription' | 'app'>('profile');
    const [isPending, startTransition] = useTransition();
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (searchParams.get('success')) {
            setMessage({ type: 'success', text: 'Platba proběhla úspěšně.' });
            // Remove the param from URL without refresh to avoid showing it again? 
            // Optional but good UX. For now just show message.
        } else if (searchParams.get('canceled')) {
            setMessage({ type: 'error', text: 'Platba byla zrušena.' });
        }
    }, [searchParams]);

    // Profile State
    const [fullName, setFullName] = useState(profile?.full_name || '');

    // Billing State
    const [billingData, setBillingData] = useState({
        company_name: billing?.company_name || '',
        ico: billing?.ico || '',
        dic: billing?.dic || '',
        address: billing?.address || '',
        email_invoice: billing?.email_invoice || ''
    });

    // App Settings State
    const [theme, setTheme] = useState(profile?.theme || 'system');
    const [timeoutSeconds, setTimeoutSeconds] = useState(profile?.inactivity_timeout_seconds ?? 30);
    const [neverTimeout, setNeverTimeout] = useState((profile?.inactivity_timeout_seconds ?? 30) === 0);

    // Timeout slider values mapping
    const TIMEOUT_VALUES = [30, 60, 120, 180, 300, 600, 900, 1800]; // 30s, 1m, 2m, 3m, 5m, 10m, 15m, 30m
    const getSliderIndex = (seconds: number) => {
        const idx = TIMEOUT_VALUES.indexOf(seconds);
        return idx === -1 ? 0 : idx; // Default to first if not found
    };
    const [sliderValue, setSliderValue] = useState(getSliderIndex(profile?.inactivity_timeout_seconds ?? 30));

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const idx = parseInt(e.target.value);
        setSliderValue(idx);
        setTimeoutSeconds(TIMEOUT_VALUES[idx]);
        setNeverTimeout(false);
    };

    const handleNeverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setNeverTimeout(isChecked);
        if (isChecked) {
            setTimeoutSeconds(0);
        } else {
            // Restore from slider
            setTimeoutSeconds(TIMEOUT_VALUES[sliderValue]);
        }
    };

    const handleSaveAppSettings = () => {
        startTransition(async () => {
            const finalTimeout = neverTimeout ? 0 : timeoutSeconds;
            const res = await updateAppSettings({
                inactivity_timeout_seconds: finalTimeout,
                theme: theme
            });

            if (res.error) {
                showMessage('error', res.error);
            } else {
                showMessage('success', 'Nastavení aplikace uloženo');
                router.refresh(); // Apply theme or settings immediately if handled by layout/context
            }
        });
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleUpdateProfile = () => {
        startTransition(async () => {
            try {
                const result = await updateProfile(fullName);
                if (result.error) {
                    showMessage('error', result.error);
                } else {
                    showMessage('success', 'Profil aktualizován');
                    router.refresh();
                }
            } catch (e: any) {
                console.error('Update profile error:', e);
                showMessage('error', e.message || 'Chyba při aktualizaci profilu');
            }
        });
    };

    const handleUpdateBilling = () => {
        startTransition(async () => {
            try {
                await updateBilling(billingData);
                showMessage('success', 'Fakturační údaje uloženy');
            } catch (e) {
                showMessage('error', 'Chyba při ukládání');
            }
        });
    };


    const handleStripeCheckout = async (priceId: string) => {
        console.log('handleStripeCheckout called with:', priceId);
        try {
            // Show loading state differently since we removed startTransition? 
            // Or just fire and forget until redirect.

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ priceId }),
            });

            console.log('Stripe response status:', response.status);

            if (!response.ok) {
                const text = await response.text();
                alert('CHYBA PLATBY: ' + text);
                throw new Error('Checkout failed: ' + text);
            }

            const { url } = await response.json();
            console.log('Redirecting to:', url);

            if (url) {
                window.location.assign(url);
            } else {
                alert('CHYBA: Server nevrátil URL.');
            }
        } catch (e: any) {
            console.error('Stripe Checkout Error:', e);
            alert('CHYBA APLIKACE: ' + e.message);
        }
    };

    const handleUpgrade = (plan: 'free' | 'pro' | 'credits_500') => {
        if (plan === 'free') {
            // Downgrade logic (existing or placeholder)
            if (!confirm('Opravdu chcete změnit tarif na START?')) return;
            startTransition(async () => {
                try {
                    await updateSubscription('free');
                    showMessage('success', 'Tarif změněn na START');
                } catch (e) {
                    showMessage('error', 'Změna tarifu se nezdařila');
                }
            });
        } else if (plan === 'pro') {
            // Stripe Checkout for PRO
            handleStripeCheckout('price_1SwVthEkWRb0lr92TGxTjKaQ');
        } else if (plan === 'credits_500') {
            // Stripe Checkout for Credits
            handleStripeCheckout('price_1SwVvCEkWRb0lr92lpwHLHD1');
        }
    };

    const handleSignOut = () => {
        startTransition(async () => {
            await signOut();
        });
    };

    const handleDeleteAccount = () => {
        if (!confirm('OPRAVDU CHCETE SMAZAT ÚČET? Tato akce je nevratná a smaže všechna vaše data!')) return;

        startTransition(async () => {
            try {
                await deleteAccount();
            } catch (e) {
                showMessage('error', 'Nepodařilo se smazat účet.');
            }
        });
    };

    const renderTabs = () => (
        <nav className="flex space-x-2 mb-8 bg-slate-100 p-1.5 rounded-xl overflow-x-auto">
            {[
                { id: 'app', label: 'Aplikace', icon: Monitor },
                { id: 'profile', label: 'Profil', icon: User },
                { id: 'security', label: 'Zabezpečení', icon: Shield },
                { id: 'billing', label: 'Fakturace', icon: CreditCard },
                { id: 'subscription', label: 'Předplatné', icon: Star },
            ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                            ${isActive
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }
                        `}
                    >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                    </button>
                );
            })}
        </nav>
    );

    const isDemoUser = user.email === 'demo@medicahub.cz';

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center">
                        <Link
                            href="/hub"
                            className="mr-4 p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900">Nastavení účtu</h1>
                    </div>

                    <button
                        onClick={handleSignOut}
                        disabled={isPending}
                        className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Odhlásit se
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
                {renderTabs()}

                {message && (
                    <div className={`mb-6 p-4 rounded-xl flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <Check className="w-5 h-5 mr-3" /> : null}
                        {message.text}
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">


                    {/* APP SETTINGS TAB */}
                    {activeTab === 'app' && (
                        <div className="space-y-8 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Nastavení aplikace</h2>
                                <p className="text-sm text-slate-500">Přizpůsobte si chování aplikace MedicaHub.</p>
                            </div>

                            {/* Inactivity Timer */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-md font-semibold text-slate-900">Automatický návrat do Hubu</h3>
                                        <p className="text-xs text-slate-500 mt-1">Při neaktivitě se aplikace automaticky vrátí na rozcestník.</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="neverTimeout"
                                            checked={neverTimeout}
                                            onChange={handleNeverChange}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="neverTimeout" className="ml-2 text-sm text-slate-700 font-medium">Nikdy</label>
                                    </div>
                                </div>

                                <div className={`transition-opacity duration-200 ${neverTimeout ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                    <input
                                        type="range"
                                        min="0"
                                        max={TIMEOUT_VALUES.length - 1}
                                        step="1"
                                        value={sliderValue}
                                        onChange={handleSliderChange}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                    />
                                    <div className="flex justify-between mt-3 text-xs text-slate-400 font-medium px-1">
                                        <span>30s</span>
                                        <span>1m</span>
                                        <span>2m</span>
                                        <span>3m</span>
                                        <span>5m</span>
                                        <span>10m</span>
                                        <span>15m</span>
                                        <span>30m</span>
                                    </div>

                                    <div className="mt-6 text-center">
                                        <span className="inline-block bg-white border border-slate-200 px-4 py-1 rounded-full text-sm font-bold text-blue-600 shadow-sm">
                                            {timeoutSeconds < 60 ? `${timeoutSeconds} sekund` : `${timeoutSeconds / 60} min`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Theme Settings */}
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                                <h3 className="text-md font-semibold text-slate-900 mb-4">Vzhled aplikace</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <Sun className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-medium">Světlý</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-blue-600 bg-slate-800 text-white' : 'border-slate-200 bg-slate-900 text-slate-400 hover:border-slate-700'}`}
                                    >
                                        <Moon className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-medium">Tmavý</span>
                                    </button>

                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${theme === 'system' ? 'border-blue-600 bg-gradient-to-br from-white to-slate-900 text-slate-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <Monitor className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-medium">Systém</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleSaveAppSettings}
                                disabled={isPending}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center shadow-lg shadow-blue-500/20"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Uložit nastavení
                            </button>
                        </div>
                    )}

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="space-y-6 max-w-lg">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Osobní údaje</h2>
                                <p className="text-sm text-slate-500">Správa základních informací o vašem účtu.</p>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                    <input type="text" value={user.email} disabled className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Celé jméno</label>
                                    <input
                                        type="text"
                                        value={fullName || ''}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        placeholder="Jan Novák"
                                    />
                                </div>
                                <button
                                    onClick={handleUpdateProfile}
                                    disabled={isPending}
                                    className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center"
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Uložit změny
                                </button>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="space-y-6 max-w-lg">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Heslo a zabezpečení</h2>
                                <p className="text-sm text-slate-500">Změna přihlašovacího hesla.</p>
                            </div>
                            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
                                Pro změnu hesla ve verzi Demo prosím kontaktujte administrátora nebo použijte "Zapomenuté heslo" na přihlašovací obrazovce.
                                <br /><br />
                                <i>(Tato funkce vyžaduje ověření emailu, které v demo verzi není plně aktivní)</i>
                            </div>

                            <hr className="my-6 border-slate-200" />

                            <div>
                                <h3 className="text-md font-semibold text-red-600 mb-1">Nebezpečná zóna</h3>
                                <p className="text-sm text-slate-500 mb-4">Tato akce je nevratná.</p>

                                {isDemoUser ? (
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-sm italic">
                                        Mazání účtu je pro demo uživatele zakázáno.
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                                    >
                                        Vymazat celý účet a všechna data
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="space-y-6 max-w-2xl">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Fakturační údaje</h2>
                                <p className="text-sm text-slate-500">Tyto údaje budou použity na fakturách.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Název společnosti / Ordinace</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={billingData.company_name}
                                        onChange={e => setBillingData({ ...billingData, company_name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">IČO</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={billingData.ico}
                                        onChange={e => setBillingData({ ...billingData, ico: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">DIČ</label>
                                    <input
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={billingData.dic}
                                        onChange={e => setBillingData({ ...billingData, dic: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fakturační adresa</label>
                                    <textarea
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 min-h-[80px]"
                                        value={billingData.address}
                                        onChange={e => setBillingData({ ...billingData, address: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email pro zasílání faktur</label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-900"
                                        value={billingData.email_invoice}
                                        onChange={e => setBillingData({ ...billingData, email_invoice: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleUpdateBilling}
                                disabled={isPending}
                                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center"
                            >
                                {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                Uložit fakturační údaje
                            </button>
                        </div>
                    )}

                    {/* SUBSCRIPTION TAB */}
                    {activeTab === 'subscription' && (
                        <div className="space-y-8">
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 mb-1">Správa předplatného</h2>
                                <p className="text-sm text-slate-500">Vyberte si tarif, který vyhovuje vašim potřebám.</p>

                                <div className="mt-4 flex items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg mr-4">
                                        <Star className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-500 font-medium">Aktuální stav kreditů</div>
                                        <div className="text-2xl font-bold text-slate-900">{organization.credits || 0} kreditů</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                                {/* FREE PLAN */}
                                <div className={`border rounded-2xl p-6 relative flex flex-col h-full ${organization.subscription_plan === 'free' ? 'border-blue-500 ring-2 ring-blue-50 bg-blue-50/10' : 'border-slate-200'}`}>
                                    {organization.subscription_plan === 'free' && (
                                        <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                            VÁŠ TARIF
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-slate-900">Start</h3>
                                    <div className="mt-2 text-3xl font-bold text-slate-700">Zdarma</div>
                                    <p className="text-sm text-slate-500 mt-2">Základní přístup pro vyzkoušení.</p>
                                    <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-grow">
                                        <li className="flex items-center"><Check className="w-4 h-4 text-green-500 mr-2" /> Přístup k Hubu</li>
                                        <li className="flex items-center text-slate-400"><Check className="w-4 h-4 mr-2" /> Aplikace TermoLog</li>
                                        <li className="flex items-center text-slate-400"><Check className="w-4 h-4 mr-2" /> Aplikace MedLog</li>
                                    </ul>
                                    <button
                                        disabled={organization.subscription_plan === 'free'}
                                        onClick={() => handleUpgrade('free')}
                                        className={`mt-8 w-full py-2.5 rounded-xl font-medium text-sm border 
                                            ${organization.subscription_plan === 'free'
                                                ? 'bg-transparent text-blue-600 border-blue-200 cursor-default'
                                                : 'text-slate-600 hover:bg-slate-50 border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                                    >
                                        {organization.subscription_plan === 'free' ? 'Aktuální tarif' : 'Downgrade na Start'}
                                    </button>
                                </div>

                                {/* PRO PLAN */}
                                <div className={`border rounded-2xl p-6 relative flex flex-col h-full ${organization.subscription_plan === 'pro' ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/30' : 'border-slate-200 shadow-xl'}`}>
                                    {organization.subscription_plan === 'pro' && (
                                        <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
                                            VÁŠ TARIF
                                        </div>
                                    )}
                                    <h3 className="text-xl font-bold text-slate-900 text-blue-600">MedicaHub Pro</h3>
                                    <div className="mt-2 text-3xl font-bold text-slate-900">490 Kč<span className="text-lg font-normal text-slate-400">/ měsíc</span></div>
                                    <p className="text-sm text-slate-500 mt-2">Kompletní řešení pro vaši ordinaci.</p>
                                    <ul className="mt-6 space-y-3 text-sm text-slate-700 font-medium flex-grow">
                                        <li className="flex items-center"><Check className="w-4 h-4 text-blue-600 mr-2" /> Vše ze Start</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 text-blue-600 mr-2" /> <span className="text-blue-600">TermoLog </span> &nbsp; - Monitoring teplot</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 text-blue-600 mr-2" /> <span className="text-blue-600">MedLog </span> &nbsp; - Evidence léků</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 text-blue-600 mr-2" /> Prioritní podpora</li>
                                    </ul>
                                    <button
                                        disabled={organization.subscription_plan === 'pro'}
                                        onClick={() => handleUpgrade('pro')}
                                        className={`mt-8 w-full py-2.5 rounded-xl font-bold text-sm shadow-md transition-all
                                            ${organization.subscription_plan === 'pro'
                                                ? 'bg-blue-100 text-blue-700 cursor-default'
                                                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-blue-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-300'}`}
                                    >
                                        {organization.subscription_plan === 'pro' ? 'Aktivní' : 'Upgradovat na Pro'}
                                    </button>
                                </div>

                                {/* 500 CREDITS */}
                                <div className="border border-slate-200 rounded-2xl p-6 relative flex flex-col h-full hover:border-slate-300 transition-colors">
                                    <h3 className="text-xl font-bold text-slate-900 text-purple-600">Balíček 500 Kreditů</h3>
                                    <div className="mt-2 text-3xl font-bold text-slate-900">200 Kč<span className="text-lg font-normal text-slate-400">/ jednorázově</span></div>
                                    <p className="text-xs text-slate-400 font-medium">Uvedená cena je bez DPH.</p>
                                    <p className="text-sm text-slate-500 mt-2">Přednabitý kredit pro specifické služby.</p>
                                    <ul className="mt-6 space-y-3 text-sm text-slate-600 flex-grow">
                                        <li className="flex items-center"><Check className="w-4 h-4 text-purple-600 mr-2" /> Platnost kreditu neomezená</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 text-purple-600 mr-2" /> Využití na extra služby</li>
                                        <li className="flex items-center"><Check className="w-4 h-4 text-purple-600 mr-2" /> Jednoduché dobíjení</li>
                                    </ul>
                                    <button
                                        onClick={() => handleUpgrade('credits_500' as any)}
                                        className="mt-8 w-full py-2.5 rounded-xl font-bold text-sm shadow-md transition-all bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-50"
                                    >
                                        Koupit kredity
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
