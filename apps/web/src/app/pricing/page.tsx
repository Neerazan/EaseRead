'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  X,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  BookOpen,
  MessageSquareText,
  Upload,
  FileText,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge?: string;
  features: PlanFeature[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Free',
    description: 'Perfect for getting started with AI-powered reading.',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { text: 'Up to 5 documents', included: true },
      { text: 'PDF upload support', included: true },
      { text: 'Basic AI Q&A', included: true },
      { text: 'In-browser PDF reader', included: true },
      { text: 'Document search', included: true },
      { text: 'EPUB & TXT support', included: false },
      { text: 'Unlimited documents', included: false },
      { text: 'Advanced AI insights', included: false },
      { text: 'Priority processing', included: false },
      { text: 'API access', included: false },
    ],
    cta: 'Get Started Free',
    ctaHref: '/signup',
  },
  {
    name: 'Pro',
    description: 'For serious readers who want the full power of AI.',
    monthlyPrice: 12,
    yearlyPrice: 8,
    badge: 'Most Popular',
    highlighted: true,
    features: [
      { text: 'Unlimited documents', included: true },
      { text: 'All format support (PDF, EPUB, TXT)', included: true },
      { text: 'Advanced AI Q&A with context', included: true },
      { text: 'In-browser reader for all formats', included: true },
      { text: 'Smart search & filters', included: true },
      { text: 'Spoiler prevention for fiction', included: true },
      { text: 'AI-generated summaries', included: true },
      { text: 'Priority document processing', included: true },
      { text: 'Reading analytics', included: true },
      { text: 'API access', included: true },
    ],
    cta: 'Upgrade to Pro',
    ctaHref: '/signup',
  },
];

const faqs = [
  {
    question: 'Can I try EaseRead for free?',
    answer:
      'Absolutely! Our Free plan lets you upload up to 5 PDF documents and use basic AI Q&A features. No credit card required.',
  },
  {
    question: 'What file formats are supported?',
    answer:
      'Free users can upload PDFs. Pro users get support for PDF, EPUB, and TXT files, with more formats coming soon.',
  },
  {
    question: 'How does the AI Q&A work?',
    answer:
      'When you upload a document, our AI processes it into chunks and creates embeddings. You can then ask natural language questions, and our RAG pipeline finds the most relevant passages to generate accurate answers.',
  },
  {
    question: 'What is spoiler prevention?',
    answer:
      "For fiction documents, you can enable spoiler prevention. This ensures the AI won't reference events or plot points that occur after your current reading position.",
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      "Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period.",
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. Your documents are securely stored, and we never share your content with third parties. All data transmission is encrypted.',
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-blue-50 border border-brand-blue-100 mb-6">
            <Sparkles className="w-4 h-4 text-brand-blue" />
            <span className="text-sm font-medium text-brand-blue">
              Simple, transparent pricing
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Choose your reading{' '}
            <span className="gradient-text">superpower</span>
          </h1>
          <p className="text-lg text-muted max-w-xl mx-auto">
            Start free and upgrade when you need more. No hidden fees, no
            surprises.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-gray-100 dark:bg-gray-900">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? 'bg-white dark:bg-gray-800 text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                isYearly
                  ? 'bg-white dark:bg-gray-800 text-foreground shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] font-bold text-brand-red">
                SAVE 33%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-b from-brand-blue-50 to-white dark:from-brand-blue-50/10 dark:to-surface border-2 border-brand-blue shadow-xl shadow-brand-blue/10'
                  : 'bg-surface border border-border hover:border-gray-300 dark:hover:border-gray-700 shadow-sm'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1 bg-brand-blue text-white text-xs font-bold rounded-full shadow-lg">
                    {plan.badge}
                  </span>
                </div>
              )}

              <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-sm text-muted mt-1">{plan.description}</p>

              {/* Price */}
              <div className="mt-6 mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-foreground">
                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-muted text-sm">/month</span>
                </div>
                {isYearly && plan.monthlyPrice > 0 && (
                  <p className="text-xs text-muted mt-1">
                    Billed ${plan.yearlyPrice * 12}/year
                  </p>
                )}
              </div>

              {/* CTA */}
              <Link
                href={plan.ctaHref}
                className={`block text-center py-3 px-6 rounded-xl font-semibold transition-all no-underline ${
                  plan.highlighted
                    ? 'btn-primary w-full'
                    : 'btn-secondary w-full'
                }`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4 inline ml-2" />
              </Link>

              {/* Features */}
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-4">
                  What&apos;s included
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-gray-300 dark:text-gray-700 mt-0.5 flex-shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? 'text-foreground'
                            : 'text-muted line-through'
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            All plans include
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: Shield, label: 'Secure storage' },
              { icon: BookOpen, label: 'In-browser reader' },
              { icon: MessageSquareText, label: 'AI Q&A' },
              { icon: Upload, label: 'Easy upload' },
              { icon: Zap, label: 'Fast processing' },
              { icon: FileText, label: 'Document management' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-3 p-4 rounded-xl bg-surface border border-border"
              >
                <div className="w-9 h-9 rounded-lg bg-brand-blue-50 dark:bg-brand-blue-50/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4.5 h-4.5 text-brand-blue" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-3">
            Frequently asked questions
          </h2>
          <p className="text-muted text-center mb-10">
            Everything you need to know about EaseRead.
          </p>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <span className="text-sm font-semibold text-foreground pr-4">
                    {faq.question}
                  </span>
                  {openFaq === i ? (
                    <ChevronUp className="w-4 h-4 text-muted flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 animate-fade-in">
                    <p className="text-sm text-muted leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
