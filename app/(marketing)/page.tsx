'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Mic,
  Calendar,
  Smartphone,
  FileText,
  CheckCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  Play,
  Pill,
  Thermometer,
  Sparkles
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RoadmapCanvas } from '@/components/RoadmapCanvas';
import { CommunityEngagement } from '@/components/CommunityEngagement';

// --- Utility ---
function cn_inline(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const FadeIn = ({ children, delay = 0, className }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.6, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

const BentoCard = ({
  children,
  className,
  title,
  description,
  icon: Icon,
  gradient = "from-slate-100 to-slate-200"
}: {
  children?: React.ReactNode,
  className?: string,
  title: string,
  description: string,
  icon: any,
  gradient?: string
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={cn_inline(
      "relative overflow-hidden rounded-3xl p-8 shadow-sm border border-slate-200 bg-white group hover:shadow-xl transition-all duration-300",
      className
    )}
  >
    <div className={cn_inline("absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none", gradient)}></div>

    <div className="relative z-10 h-full flex flex-col">
      <div className="mb-4 inline-flex p-3 rounded-2xl bg-white shadow-sm border border-slate-100 w-fit text-blue-600 group-hover:text-purple-600 group-hover:scale-110 transition-all duration-300">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 leading-relaxed text-sm lg:text-base">{description}</p>
      {children}
    </div>
  </motion.div>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-purple-100 selection:text-purple-900 font-sans">

      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image src="/logo.svg" alt="MedicaHub Logo" width={32} height={32} />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">Medica<span className="text-blue-600">Hub</span></span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              Přihlásit se
            </Link>
            <Link
              href="/login" // Or register
              className="text-sm font-bold bg-slate-900 text-white px-4 py-2 rounded-full hover:bg-slate-800 transition-all hover:shadow-lg hover:shadow-purple-500/20"
            >
              Začít zdarma
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 -z-10 w-[800px] h-[800px] bg-gradient-to-b from-blue-50 to-purple-50 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/4"></div>
        <div className="absolute bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-50 to-blue-50 rounded-full blur-3xl opacity-60 -translate-x-1/3 translate-y-1/4"></div>

        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

          {/* Text Content */}
          <div className="max-w-2xl">
            <FadeIn>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Nová éra ordinací
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Ordinace na <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">autopilot.</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg">
                Vy lečíte, my řešíme zbytek. Sada AI nástrojů a mikro-aplikací, které vás zbaví administrativy. VoiceLog pro diktování, Smart Calendar pro provoz a další.
              </p>
            </FadeIn>

            <FadeIn delay={0.3} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex justify-center items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-full font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1"
              >
                Vyzkoušet zdarma <ArrowRight size={18} />
              </Link>
              <a
                href="#features"
                className="inline-flex justify-center items-center gap-2 bg-white text-slate-700 border border-slate-200 px-8 py-3.5 rounded-full font-bold hover:bg-slate-50 transition-all hover:border-slate-300"
              >
                <Play size={16} className="fill-slate-700" /> Jak to funguje
              </a>
            </FadeIn>
          </div>

          {/* Abstract Visual / Hero Image */}
          <FadeIn delay={0.4} className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-[600px] mx-auto">
              {/* Central Hub Orb */}
              <motion.div
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 flex items-center justify-center z-10"
              >
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-white to-blue-50 shadow-2xl border border-white/50 backdrop-blur-xl flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-xl"></div>
                  <Image src="/logo.svg" alt="Hub Core" width={100} height={100} className="drop-shadow-lg" />
                </div>
              </motion.div>

              {/* Floating Satellite Cards */}
              <motion.div
                animate={{ x: [0, 10, 0], y: [0, -15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute top-20 right-10 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-48 z-20"
              >
                <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Mic size={20} /></div>
                <div>
                  <div className="h-2 w-16 bg-slate-200 rounded mb-1"></div>
                  <div className="h-2 w-10 bg-slate-200 rounded"></div>
                </div>
              </motion.div>

              {/* Floating App Icon: MedLog */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute top-10 left-10 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 z-20 flex items-center justify-center"
              >
                <div className="bg-emerald-100 p-2 rounded-full text-emerald-500"><Pill size={24} /></div>
              </motion.div>

              {/* Floating App Icon: EventLog */}
              <motion.div
                animate={{ y: [0, -12, 0], x: [0, 5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute bottom-32 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 z-20 flex items-center justify-center"
              >
                <div className="bg-orange-100 p-2 rounded-full text-orange-500"><Calendar size={24} /></div>
              </motion.div>

              {/* Floating App Icon: TermoLog */}
              <motion.div
                animate={{ y: [0, 8, 0], x: [0, -5, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
                className="absolute -top-6 right-1/3 bg-white p-3 rounded-2xl shadow-lg border border-slate-100 z-20 flex items-center justify-center"
              >
                <div className="bg-blue-100 p-2 rounded-full text-blue-500"><Thermometer size={24} /></div>
              </motion.div>

              <motion.div
                animate={{ x: [0, -10, 0], y: [0, 15, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute bottom-10 left-0 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 w-52 z-20"
              >
                <div className="bg-green-100 p-2 rounded-lg text-green-600"><CheckCircle size={20} /></div>
                <div className="text-xs font-medium text-slate-600">Revize hotova</div>
              </motion.div>

              {/* Connecting Rings */}
              <div className="absolute inset-0 border border-slate-200/50 rounded-full scale-75"></div>
              <div className="absolute inset-0 border border-dashed border-slate-200/50 rounded-full scale-110 opacity-50 animate-[spin_60s_linear_infinite]"></div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* --- Bento Grid Section --- */}
      <section id="features" className="py-20 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <FadeIn>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Vaše nové superschopnosti</h2>
              <p className="text-slate-500">
                Jeden účet, nekonečno možností. Všechny nástroje jsou propojené, bezpečné a připravené k okamžitému použití.
              </p>
            </FadeIn>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(0,_300px)]">

            {/* Card 1: AI Big Feature */}
            <div className="md:col-span-2 md:row-span-2">
              <BentoCard
                title="VoiceLog AI"
                description="Mluvte, nepište. Otevřete aplikaci, namluvte nález a naše AI ho během vteřiny přepíše do strukturované lékařské zprávy s 99% přesností. Rozumí latině, dávkování i zkratkám."
                icon={Mic}
                gradient="from-purple-50 to-blue-50"
                className="h-full bg-gradient-to-br from-white to-purple-50/50"
              >
                <div className="mt-8 relative h-48 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex items-center justify-center">
                  {/* Visual representation of voice wave */}
                  <div className="flex items-center gap-1">
                    {[16, 32, 24, 48, 32, 64, 40, 56, 32, 16].map((h, i) => (
                      <motion.div
                        key={i}
                        animate={{ height: [h, h * 1.5, h] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                        className="w-2 bg-gradient-to-t from-purple-500 to-blue-500 rounded-full opacity-80"
                        style={{ height: h }}
                      />
                    ))}
                  </div>
                  <div className="absolute top-4 left-4 text-xs font-mono text-slate-300">REC 00:04</div>
                </div>
              </BentoCard>
            </div>

            {/* Card 2: Operations */}
            <div className="md:col-span-1 md:row-span-1">
              <BentoCard
                title="Provozní Mozek"
                description="Systém automaticky hlídá expirace léků a termíny revizí. Sám předpřipraví objednávky a upozorní vás včas."
                icon={Calendar}
                gradient="from-orange-50 to-red-50"
                className="h-full"
              />
            </div>

            {/* Card 3: Paperless */}
            <div className="md:col-span-1 md:row-span-1">
              <BentoCard
                title="Vše digitálně"
                description="Žádné papíry. Exporty do IS, cloudové zálohy a historie změn na jedno kliknutí."
                icon={FileText}
                gradient="from-emerald-50 to-green-50"
                className="h-full"
              />
            </div>

            {/* Card 4: Mobile */}
            <div className="md:col-span-3 lg:col-span-1">
              <BentoCard
                title="Vždy po ruce"
                description="Plně responzivní. Diktujte na mobilu cestou na sál, kontrolujte stavy na tabletu."
                icon={Smartphone}
                gradient="from-blue-50 to-cyan-50"
                className="h-full"
              />
            </div>

          </div>
        </div>
      </section>

      {/* --- Benefits Section --- */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <FadeIn delay={0.1} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bleskový start</h3>
              <p className="text-slate-500">Žádná složitá instalace. Běží to v prohlížeči. Zaregistrujete se a za 2 minuty pracujete.</p>
            </FadeIn>
            <FadeIn delay={0.2} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <ShieldCheck size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Bezpečnost především</h3>
              <p className="text-slate-500">Šifrovaná data na úrovni bankovních standardů. Vaše data jsou jen vaše.</p>
            </FadeIn>
            <FadeIn delay={0.3} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Fair Play cena</h3>
              <p className="text-slate-500">Platíte jen za to, co vám skutečně šetří čas. Žádné skryté poplatky.</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* --- Community Engagement Section --- */}
      <CommunityEngagement />

      {/* --- Interactive Roadmap Section --- */}
      <section className="py-20 bg-slate-50/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
          <FadeIn>
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Kam směřujeme?</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">
              Sledujte naši cestu a objevujte, co pro vás chystáme v nadcházejících měsících.
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.2} className="w-full h-[600px] bg-white border-y border-slate-200 relative">
          <div className="absolute inset-0 bg-[#F8FAFC]">
            {/* Embedded Roadmap Canvas */}
            <RoadmapCanvas className="w-full h-full" />
          </div>
          {/* Overlay Gradients to blend edges */}
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />
        </FadeIn>

        <div className="text-center mt-8">
          <Link href="/roadmap" className="inline-flex items-center gap-2 text-blue-600 font-bold hover:text-blue-700 transition-colors">
            Zobrazit celou roadmapu <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* --- CTA Footer --- */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 lg:p-20 relative overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500 rounded-full blur-[128px] opacity-20 group-hover:opacity-30 transition-opacity duration-1000"></div>

            <div className="relative z-10">
              <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Připraveni na upgrade ordinace?</h2>
              <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto">Přidejte se k moderním lékařům, kteří už šetří hodiny času týdně díky MedicaHubu.</p>
              <Link
                href="/login"
                className="inline-flex justify-center items-center gap-2 bg-white text-slate-900 px-10 py-4 rounded-full font-bold hover:bg-blue-50 transition-all hover:scale-105"
              >
                Začít hned teď
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
            <div className="relative h-6 w-6">
              <Image src="/logo.svg" alt="Footer Logo" width={24} height={24} />
            </div>
            <span className="font-bold text-slate-900">MedicaHub</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-500">
            <Link href="#" className="hover:text-slate-900 transition-colors">Kontakt</Link>
            <Link href="#" className="hover:text-slate-900 transition-colors">Podmínky</Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">Přihlášení</Link>
          </div>
          <div className="text-slate-400 text-sm">
            © 2026 FineMedica s.r.o.
          </div>
        </div>
      </footer>
    </div>
  );
}
