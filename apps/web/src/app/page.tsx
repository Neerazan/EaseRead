import Link from 'next/link';
import {
  FileText,
  MessageSquareText,
  Upload,
  Zap,
  Shield,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

const features = [
  {
    icon: MessageSquareText,
    title: 'AI-Powered Q&A',
    description:
      'Ask questions about your documents and get instant, accurate answers powered by advanced AI. No more endless scrolling.',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue-50',
  },
  {
    icon: Upload,
    title: 'Multi-Format Upload',
    description:
      'Upload PDFs, EPUBs, and text files. Our system processes and indexes your documents for lightning-fast retrieval.',
    color: 'text-brand-red',
    bg: 'bg-red-50 dark:bg-red-950/30',
  },
  {
    icon: Shield,
    title: 'Spoiler Prevention',
    description:
      'Reading fiction? Enable spoiler prevention to ensure AI answers never reveal plot twists ahead of where you are.',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
  },
  {
    icon: BookOpen,
    title: 'In-Browser Reader',
    description:
      'Read your documents directly in the browser with a clean, distraction-free interface. No downloads needed.',
    color: 'text-violet-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
  },
  {
    icon: Zap,
    title: 'Smart Processing',
    description:
      'Documents are automatically chunked, embedded, and indexed. Our RAG pipeline ensures precise, context-aware responses.',
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    icon: FileText,
    title: 'Document Library',
    description:
      'Organize and manage all your documents in one place. Search, filter, and access your reading history effortlessly.',
    color: 'text-brand-blue',
    bg: 'bg-brand-blue-50',
  },
];

const steps = [
  {
    number: '01',
    title: 'Upload Your Document',
    description:
      'Drag and drop or select a PDF, EPUB, or TXT file. We support files up to 10MB.',
  },
  {
    number: '02',
    title: 'AI Processes It',
    description:
      'Our AI worker chunks, embeds, and indexes your document for intelligent retrieval in seconds.',
  },
  {
    number: '03',
    title: 'Read & Ask Questions',
    description:
      'Read in-browser and ask anything about the document. Get instant, accurate, spoiler-free answers.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-brand-blue/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl animate-float stagger-3" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-blue/3 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-50 border border-brand-blue-100 mb-8">
            <Sparkles className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-medium text-brand-blue">
              AI-Powered Document Reading
            </span>
          </div>

          {/* Headline */}
          <h1 className="animate-fade-in-up stagger-1 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6">
            Read Smarter with <span className="gradient-text">Intelligent</span>{' '}
            <span className="relative">
              Insights
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="8"
                viewBox="0 0 200 8"
                fill="none"
              >
                <path
                  d="M1 5.5C47 2 153 2 199 5.5"
                  stroke="#E52535"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          {/* Subtext */}
          <p className="animate-fade-in-up stagger-2 text-lg sm:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload any document — PDF, EPUB, or text — and let AI help you
            understand it deeply. Ask questions, get summaries, and read without
            distractions.
          </p>

          {/* CTAs */}
          <div className="animate-fade-in-up stagger-3 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="btn-primary !py-3.5 !px-8 !text-base !rounded-xl no-underline group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="btn-secondary !py-3.5 !px-8 !text-base !rounded-xl no-underline"
            >
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-up stagger-4 mt-16 flex items-center justify-center gap-8 sm:gap-16">
            {[
              { value: 'PDF', label: 'Format Support' },
              { value: 'AI', label: 'Powered Q&A' },
              { value: '10MB', label: 'Max File Size' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-brand-blue">
                  {stat.value}
                </div>
                <div className="text-xs text-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ─────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-blue uppercase tracking-wider mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything you need to read smarter
            </h2>
            <p className="text-muted max-w-2xl mx-auto">
              From upload to understanding — EaseRead provides the tools to make
              every reading session more productive.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div
                key={feature.title}
                className={`glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 stagger-${i + 1}`}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}
                >
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950/50"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-brand-red uppercase tracking-wider mb-3">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Three steps to smarter reading
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-blue/30 to-brand-blue/5" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-blue text-white text-xl font-bold mb-5 shadow-lg shadow-brand-blue/20">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-brand-blue to-brand-blue-dark p-10 sm:p-16 text-center">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="absolute top-1/2 right-10 w-3 h-3 bg-brand-red rounded-full" />

            <div className="relative z-10">
              <Logo
                size={40}
                showText={false}
                className="justify-center mb-6 [&_path]:!stroke-white [&_line]:!stroke-white"
              />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to read smarter?
              </h2>
              <p className="text-blue-100 max-w-lg mx-auto mb-8">
                Join EaseRead and transform how you interact with documents.
                Start for free — no credit card required.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-brand-blue font-semibold rounded-xl hover:bg-blue-50 transition-all hover:shadow-lg no-underline"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-transparent text-white font-semibold rounded-xl border border-white/30 hover:bg-white/10 transition-all no-underline"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
