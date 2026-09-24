import Link from "next/link";
import {
  LifeBuoy,
  MessageCircle,
  Send,
  Mail,
  ArrowRight,
  ShieldCheck,
  Clock,
  ReceiptText,
  KeyRound,
  MonitorSmartphone,
} from "lucide-react";
import { getSettings } from "@/lib/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Accordion } from "@/components/ui/Accordion";
import { GlowDivider } from "@/components/ui/GlowDivider";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = {
  title: "Support",
  description:
    "Get help with your MK Panel Zone order, access or device binding. Reach the team on Discord, Telegram or email.",
};

export const dynamic = "force-dynamic";

const BEFORE_YOU_ASK = [
  {
    Icon: ReceiptText,
    title: "Have your order number ready",
    body: "It is on the order confirmation and in your account. It lets us find the exact transaction immediately.",
  },
  {
    Icon: KeyRound,
    title: "Check your dashboard first",
    body: "Setup guides, credentials and tutorials for your package live inside Customer Access.",
  },
  {
    Icon: MonitorSmartphone,
    title: "Note your platform",
    body: "Accounts are bound to Android, iPhone or PC. Tell us which one so we do not send the wrong steps.",
  },
];

export default async function SupportPage() {
  /* Support channels come from the settings edited in the control room. They
     previously existed in the database but nothing read them, and the buttons
     on this page were not links at all — so "Join Discord" did nothing. */
  let settings: Record<string, string> = {};
  try {
    settings = await getSettings([
      "support_discord_link",
      "support_telegram_link",
      "support_email",
      "support_faq_text",
      "content_contact_email",
    ]);
  } catch {
    settings = {};
  }

  const email = settings.support_email?.trim() || settings.content_contact_email?.trim() || "";
  const discord = settings.support_discord_link?.trim() || "";
  const telegram = settings.support_telegram_link?.trim() || "";

  const channels = [
    discord && {
      key: "discord",
      Icon: MessageCircle,
      title: "Discord",
      body: "Open a ticket in the support channel with your order number. Fastest route for anything account-related.",
      cta: "Join the server",
      href: discord,
      external: true,
    },
    telegram && {
      key: "telegram",
      Icon: Send,
      title: "Telegram",
      body: "Direct message for quick questions. Share your order number so we can pull up the record.",
      cta: "Message on Telegram",
      href: telegram,
      external: true,
    },
    email && {
      key: "email",
      Icon: Mail,
      title: "Email",
      body: "Best for anything you need in writing. Replies typically land within 24 hours.",
      cta: email,
      href: `mailto:${email}`,
      external: false,
    },
  ].filter(Boolean) as {
    key: string;
    Icon: typeof Mail;
    title: string;
    body: string;
    cta: string;
    href: string;
    external: boolean;
  }[];

  const faqText = settings.support_faq_text?.trim() || "";

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 ambient-blue opacity-40" aria-hidden />

      <div className="relative mx-auto max-w-[1080px] px-4 py-16 sm:px-6 sm:py-20">
        <PageHeader
          eyebrow="Help Centre"
          title="Support"
          description="If something is not working — an order, a login, or a device binding — start here and we will take it from there."
          breadcrumbs={[{ label: "Home", href: "/" }, { label: "Support" }]}
        />

        {/* ── Channels ────────────────────────────────────────────── */}
        <ScrollReveal>
          {channels.length === 0 ? (
            <div className="mat-2 rounded-[16px]">
              <EmptyState
                icon={LifeBuoy}
                title="No support channels configured"
                description="The team has not published a contact channel yet. Please check back shortly."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {channels.map(({ key, Icon, title, body, cta, href, external }) => (
                <a
                  key={key}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
                  className="mat-3 group flex flex-col rounded-[18px] p-5 transition-[transform,border-color] duration-200 hover:-translate-y-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--accent)]"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
                    <Icon size={19} aria-hidden />
                  </span>
                  <h2 className="mt-4 text-[16px] font-extrabold tracking-tight text-foreground">
                    {title}
                  </h2>
                  <p className="mt-2 flex-1 text-[13px] leading-relaxed text-brand-ink-3">{body}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-[0.07em] text-brand-ink-2">
                    <span className="truncate">{cta}</span>
                    <ArrowRight
                      size={13}
                      className="shrink-0 transition-transform duration-200 group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </a>
              ))}
            </div>
          )}
        </ScrollReveal>

        <GlowDivider className="my-14" />

        {/* ── Before you ask ─────────────────────────────────────── */}
        <ScrollReveal>
          <SectionHeading
            eyebrow="Faster resolution"
            title="Three things that speed this up"
            description="Most delays come from a missing detail rather than a hard problem."
            accent="blue"
          />

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {BEFORE_YOU_ASK.map(({ Icon, title, body }) => (
              <div key={title} className="mat-2 rounded-[16px] p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-border-subtle bg-foreground/[0.035] text-brand-ink-2">
                  <Icon size={16} aria-hidden />
                </span>
                <h3 className="mt-3.5 text-[13.5px] font-bold text-foreground">{title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-relaxed text-brand-ink-3">{body}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* ── FAQ text from settings ─────────────────────────────── */}
        {faqText && (
          <>
            <GlowDivider className="my-14" />
            <ScrollReveal>
              <SectionHeading
                eyebrow="Reference"
                title="Support notes"
                description="Published by the team."
                accent="crimson"
              />
              <div className="mat-3 mt-8 rounded-[18px] p-5 sm:p-7">
                <p className="whitespace-pre-wrap text-[13.5px] leading-[1.75] text-brand-ink-2">
                  {faqText}
                </p>
              </div>
            </ScrollReveal>
          </>
        )}

        <GlowDivider className="my-14" />

        {/* ── Common questions ───────────────────────────────────── */}
        <ScrollReveal>
          <SectionHeading
            eyebrow="Self-service"
            title="Common questions"
            description="Answers that resolve most tickets before they are opened."
          />

          <div className="mt-8">
            <Accordion
              items={[
                {
                  question: "How long does delivery take?",
                  answer:
                    "Orders are verified manually. Most are reviewed within a few hours and the longest we quote is 12 hours. You will see the status change in your account as soon as it is approved.",
                },
                {
                  question: "I am on the wrong platform — what now?",
                  answer:
                    "Contact support with your order number. Accounts are bound to a single platform (Android, iPhone or PC), and moving one is a deliberate, verified change rather than something you can do from the dashboard.",
                },
                {
                  question: "Where are my credentials?",
                  answer:
                    "Sign in at Customer Access and open your dashboard. Credentials are masked by default — use SHOW to reveal them and COPY to put them on your clipboard.",
                },
                {
                  question: "Can I use the same account on two devices?",
                  answer:
                    "No — each account is issued for a single device. If you change hardware, contact support and we will transfer the access to your new device for you.",
                },
              ]}
            />
          </div>
        </ScrollReveal>

        {/* ── Security note ──────────────────────────────────────── */}
        <ScrollReveal>
          <div className="mat-2 mt-12 flex flex-col gap-4 rounded-[16px] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-[2px] flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[color:var(--status-info-border)] bg-[color:var(--status-info-bg)] text-[color:var(--status-info-text)]">
                <ShieldCheck size={16} aria-hidden />
              </span>
              <div>
                <p className="text-[13.5px] font-bold text-foreground">
                  We will never ask for your password
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[12.5px] leading-relaxed text-brand-ink-3">
                  <Clock size={11} className="shrink-0" aria-hidden />
                  Staff only ever need your order number to find your account.
                </p>
              </div>
            </div>

            <Link
              href="/access"
              className="group inline-flex h-[42px] shrink-0 items-center justify-center gap-1.5 rounded-[11px] border border-border-subtle px-4 text-[12px] font-bold uppercase tracking-[0.06em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
            >
              Customer Access
              <ArrowRight
                size={13}
                className="transition-transform duration-150 group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
