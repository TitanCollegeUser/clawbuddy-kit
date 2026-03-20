import { useState } from "react";
import { motion } from "framer-motion";
import {
  Zap, ArrowRight, CheckCircle2, Clock, DollarSign, Users,
  Bot, Calendar, Mail, Phone, Brain, BarChart3, Shield,
  ChevronDown, ChevronUp, Star, Building2, Briefcase,
} from "lucide-react";

// ── CTA config ───────────────────────────────────────────────
const CTA_URL = "https://calendly.com/mani-verticalsystems/discovery";
const CTA_TEXT = "Book a Discovery Call";
const CTA_SUBTEXT = "Free. 30 minutes. No pitch deck.";

// ── Conversion-optimized landing page ────────────────────────
// Brand voice: Direct, specific numbers, proof-driven, no fluff.
// Never hustle bro. Never corporate. Never apologetic.

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// ── CTA Button Component ─────────────────────────────────────
const CTAButton = ({ className = "", size = "lg" }: { className?: string; size?: "lg" | "md" }) => (
  <a
    href={CTA_URL}
    target="_blank"
    rel="noopener noreferrer"
    className={`inline-flex items-center gap-2 rounded-xl font-semibold transition-all duration-300 border border-orange-500/30 ${
      size === "lg"
        ? "px-8 py-4 text-lg"
        : "px-6 py-3 text-base"
    } bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400 hover:shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:-translate-y-0.5 ${className}`}
  >
    {CTA_TEXT}
    <ArrowRight className="w-5 h-5" />
  </a>
);

// ── Case Study Card ──────────────────────────────────────────
const CaseStudyCard = () => (
  <div className="surface-card p-8 md:p-10 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
    <div className="flex items-center gap-3 mb-6">
      <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <Star className="w-5 h-5 text-emerald-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-emerald-400 tracking-wide uppercase">Case Study</p>
        <p className="text-xs text-white/50">ScribbleSoft — High-Voltage Power Industry</p>
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: "Value Created", value: "$62,000", color: "text-emerald-400" },
        { label: "AI Cost", value: "~$100", color: "text-amber-400" },
        { label: "Timeline", value: "4 Days", color: "text-blue-400" },
        { label: "Documents", value: "201", color: "text-purple-400" },
      ].map((stat) => (
        <div key={stat.label} className="text-center">
          <p className={`text-2xl md:text-3xl font-bold font-heading ${stat.color}`}>{stat.value}</p>
          <p className="text-xs text-white/50 mt-1 uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>

    <div className="space-y-3 mb-8">
      {[
        "Processed 33 meeting transcripts into 31 executive intelligence briefs",
        "Published 201 documents across 8 manual series — 3 weeks early",
        "Identified 30% of jobs quoted at expired vendor rates",
        "Contributed to a $35,000 change order recovery",
        "Seven-figure deals now in pipeline",
      ].map((item) => (
        <div key={item} className="flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-sm text-white/80">{item}</p>
        </div>
      ))}
    </div>

    <blockquote className="border-l-2 border-orange-500/40 pl-4 py-2">
      <p className="text-white/70 italic text-sm leading-relaxed">
        "Last Tuesday night, my AI agents were prepping recording materials and processing stakeholder reviews while I had dinner with my wife. That wasn't possible 60 days ago."
      </p>
      <p className="text-xs text-white/40 mt-2">— Brian Baskin, CEO, 25+ years in high-voltage power industry</p>
    </blockquote>
  </div>
);

// ── FAQ Section ──────────────────────────────────────────────
const faqs = [
  {
    q: "What does \"white-glove installation\" actually mean?",
    a: "We build and deploy the entire AI agent system for your business. You don't touch code. We handle the infrastructure, the agent configuration, the dashboard setup, the automations — everything. You get a working system, not a tutorial.",
  },
  {
    q: "How much does it cost?",
    a: "Installations start at $5,000 for a single-agent system. Multi-agent deployments with custom workflows run $10K–$50K+ depending on complexity. We scope it on the discovery call — no surprises.",
  },
  {
    q: "What AI infrastructure do you use?",
    a: "We deploy on your infrastructure — you own everything. Supabase for backend (free tier for most deployments), Netlify for frontend, and your choice of AI model (Claude, GPT-4, or both). Monthly AI costs are typically $50–$200 depending on usage.",
  },
  {
    q: "How long does an installation take?",
    a: "A single-agent system: 1–2 weeks. A full multi-agent deployment with custom workflows: 3–6 weeks. We've done $62,000 of value creation in 4 days — speed depends on complexity, not capability.",
  },
  {
    q: "Do I need technical knowledge?",
    a: "No. That's the whole point. You interact with your agents through a dashboard — approve tasks, review reports, answer questions. If you can use email, you can manage AI agents.",
  },
  {
    q: "What happens after the installation?",
    a: "Your system runs autonomously. We provide 30 days of support post-install, then optional ongoing management. Most clients add new agents or capabilities quarterly.",
  },
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="surface-card-static border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <span className="text-sm font-medium text-white/90 pr-4">{q}</span>
        {open ? <ChevronUp className="w-4 h-4 text-orange-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/40 shrink-0" />}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-5 pb-5"
        >
          <p className="text-sm text-white/60 leading-relaxed">{a}</p>
        </motion.div>
      )}
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────
export const AIForBusinessPage = () => {
  return (
    <div className="meetup-scope min-h-screen bg-background noise-bg grid-bg relative">
      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-[900px] mx-auto text-center">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full surface-card-static text-xs text-white/60 font-mono-data tracking-wider mb-8">
              <Zap className="w-3 h-3 text-orange-400" />
              VERTICAL SYSTEMS — AI GROWTH PARTNERS
            </div>
          </motion.div>

          <motion.h1
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-[1.1] mb-6"
          >
            <span className="text-white">We Install AI Agents</span>
            <br />
            <span className="text-gradient-orange">That Run Your Business</span>
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg text-white/60 max-w-[640px] mx-auto mb-4 leading-relaxed"
          >
            Your competitors are hiring employees. You're deploying AI agents that work 24/7,
            cost $130/month in credits, and don't call in sick. We build the whole system — you
            just approve from your dashboard.
          </motion.p>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.25 }}
            className="text-sm text-white/40 mb-10"
          >
            $62,000 of value created from ~$100 in AI costs. That's a real client result.
          </motion.p>

          <motion.div {...fadeUp} transition={{ delay: 0.3 }} className="flex flex-col items-center gap-3">
            <CTAButton />
            <p className="text-xs text-white/30">{CTA_SUBTEXT}</p>
          </motion.div>
        </div>
      </section>

      {/* ── PROBLEM ───────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-[900px] mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-white mb-4 text-center">
              You Know AI Can Help Your Business.
              <br />
              <span className="text-white/50">You Just Don't Know Where to Start.</span>
            </motion.h2>
            <motion.div variants={fadeUp} className="divider-glow my-8" />

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: Clock,
                  title: "You're drowning in manual work",
                  desc: "Follow-ups, meeting prep, competitor research, email campaigns — you do it all by hand because you can't trust a chatbot with real business operations.",
                },
                {
                  icon: Shield,
                  title: "You've seen the demos, not the deployments",
                  desc: "Every AI tool looks impressive in a 2-minute video. None of them show you how to actually run it in production without breaking everything.",
                },
                {
                  icon: DollarSign,
                  title: "Hiring is expensive, AI is confusing",
                  desc: "A single employee costs $5,000/month. An AI agent costs $50–$200/month. But you don't have 6 months to figure out the tech stack.",
                },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="surface-card p-6">
                  <item.icon className="w-8 h-8 text-orange-400/70 mb-4" />
                  <h3 className="text-sm font-heading font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SOLUTION ──────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent" />
        <div className="max-w-[900px] mx-auto relative">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
              <span className="text-gradient-orange">We Build It. You Run It.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-white/50 text-center mb-12 max-w-[500px] mx-auto">
              White-glove AI agent installation. Your infrastructure. Your data. Your dashboard. Our expertise.
            </motion.p>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                { icon: Bot, title: "AI Agents That Actually Work", desc: "Not chatbots. Autonomous agents that research competitors, prep meetings, send emails, make calls, and report back — all while you sleep.", color: "text-blue-400" },
                { icon: BarChart3, title: "Mission Control Dashboard", desc: "See every agent's status in real time. Approve tasks, review reports, answer questions — all from one screen. If you can use email, you can manage AI agents.", color: "text-emerald-400" },
                { icon: Brain, title: "Agents That Learn", desc: "Your agents build memory across sessions. They remember your preferences, your clients, your industry context. They get better every week.", color: "text-purple-400" },
                { icon: Shield, title: "You Own Everything", desc: "Deployed on your infrastructure. Your data never touches our servers. If you cancel tomorrow, your entire system keeps running.", color: "text-amber-400" },
              ].map((item) => (
                <motion.div key={item.title} variants={fadeUp} className="surface-card p-6 glow-hover">
                  <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
                  <h3 className="text-base font-heading font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── WHAT YOU GET ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-[900px] mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
              What Gets Installed
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-white/50 text-center mb-12 max-w-[600px] mx-auto">
              Every installation is scoped to your business. Here's what a typical multi-agent deployment includes.
            </motion.p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: BarChart3, name: "ClawBuddy Dashboard", desc: "Real-time kanban, AI log, approvals, insights, reports, animated agent office" },
                { icon: Calendar, name: "Meeting Intelligence", desc: "Auto-prep briefs, action items, stakeholder tracking across every meeting" },
                { icon: Mail, name: "AI Email Employee", desc: "Personalized outreach, follow-up sequences, lead nurturing — on autopilot" },
                { icon: Phone, name: "AI Phone Employee", desc: "Voice agent for inbound calls, scheduling, and qualification" },
                { icon: Brain, name: "Cognitive Memory", desc: "Persistent knowledge base — your agents remember everything across sessions" },
                { icon: Bot, name: "5 Automated Workflows", desc: "Morning digest, midday prep, evening report, competitor intel, meeting prep" },
              ].map((item) => (
                <motion.div key={item.name} variants={fadeUp} className="surface-card-static p-5">
                  <item.icon className="w-6 h-6 text-orange-400/60 mb-3" />
                  <h3 className="text-sm font-heading font-semibold text-white mb-1">{item.name}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CASE STUDY ────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-[900px] mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-center mb-3">
              The Proof
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-white/50 text-center mb-10">
              $62,000 of value. 4 days. ~$100 in AI costs. We show receipts.
            </motion.p>
            <motion.div variants={fadeUp}>
              <CaseStudyCard />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/[0.02] to-transparent" />
        <div className="max-w-[900px] mx-auto relative">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-center mb-12">
              Three Steps. No Jargon.
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Discovery Call",
                  desc: "30 minutes. We learn your business, identify where AI agents create the most value, and scope the installation. No pitch deck. No pressure.",
                },
                {
                  step: "02",
                  title: "We Build It",
                  desc: "Our team deploys the full system on your infrastructure — agents, dashboard, automations, memory. You see progress in real time on your ClawBuddy board.",
                },
                {
                  step: "03",
                  title: "You Go Live",
                  desc: "Your agents start working. You approve, redirect, and review from your dashboard. 30 days of hands-on support included. Your agents get smarter every week.",
                },
              ].map((item) => (
                <motion.div key={item.step} variants={fadeUp} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-5">
                    <span className="text-lg font-heading font-bold text-orange-400">{item.step}</span>
                  </div>
                  <h3 className="text-base font-heading font-semibold text-white mb-3">{item.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-14">
              <CTAButton size="md" />
              <p className="text-xs text-white/30 mt-3">{CTA_SUBTEXT}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── WHO THIS IS FOR ───────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-[900px] mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-center mb-12">
              Is This For You?
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div variants={fadeUp} className="surface-card p-6">
                <h3 className="text-sm font-heading font-semibold text-emerald-400 mb-5 uppercase tracking-wider">This is for you if:</h3>
                <div className="space-y-3">
                  {[
                    "You run a business and want AI handling operations — not just answering questions",
                    "You're spending 10+ hours/week on tasks AI could do in minutes",
                    "You want to deploy AI but don't have 6 months to learn the stack",
                    "You're a consultant or agency owner who wants to 10x delivery capacity",
                    "You value owning your infrastructure over renting someone else's SaaS",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-sm text-white/70">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={fadeUp} className="surface-card p-6">
                <h3 className="text-sm font-heading font-semibold text-red-400 mb-5 uppercase tracking-wider">This is NOT for you if:</h3>
                <div className="space-y-3">
                  {[
                    "You're looking for a chatbot or a simple AI tool",
                    "You want someone else to run your business for you",
                    "You're not ready to invest in production-grade infrastructure",
                    "You expect instant results without any involvement",
                    "You're only interested in personal productivity hacks",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <span className="text-red-400 mt-0.5 shrink-0 text-sm">✕</span>
                      <p className="text-sm text-white/70">{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-[700px] mx-auto">
          <motion.div initial="initial" whileInView="animate" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-heading font-bold text-center mb-10">
              Questions
            </motion.h2>
            <motion.div variants={fadeUp} className="surface-card overflow-hidden">
              {faqs.map((faq) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-[700px] mx-auto text-center">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp} className="text-2xl md:text-4xl font-heading font-bold mb-4">
              <span className="text-white">Stop Hiring.</span>{" "}
              <span className="text-gradient-orange">Start Deploying.</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-sm text-white/50 mb-10 max-w-[480px] mx-auto leading-relaxed">
              A single employee costs $5,000/month. An AI agent workforce costs a fraction of that — and works 24/7.
              Let's talk about what that looks like for your business.
            </motion.p>
            <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
              <CTAButton />
              <p className="text-xs text-white/30">{CTA_SUBTEXT}</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <footer className="px-4 sm:px-6 lg:px-8 py-8 border-t border-white/5">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-xs font-heading font-semibold text-white/70">Vertical Systems</p>
              <p className="text-[10px] text-white/30">AI Growth Partners Inc.</p>
            </div>
          </div>
          <p className="text-[10px] text-white/20">
            Vancouver, BC &middot; Mani Kanasani &middot; {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AIForBusinessPage;
