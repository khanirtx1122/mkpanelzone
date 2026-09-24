import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Monitor,
  Smartphone,
  PackageOpen,
  Tag,
  KeyRound,
  ImageOff,
  ExternalLink,
  HardDrive,
  UserCog,
} from "lucide-react";
import { CustomerActions } from "./CustomerActions";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";

export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const customer = await prisma.customer.findUnique({
    where: { id: params.id },
    include: {
      agent: { select: { username: true } },
      package: { select: { id: true, name: true } },
      devices: true,
    },
  });

  const packages = await prisma.package.findMany({ orderBy: { name: "asc" } });

  if (!customer) {
    notFound();
  }

  const isPc = customer.platformType === "PC";

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Access Control"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="break-all">{customer.identifier}</span>
            <span className="inline-flex items-center gap-1.5 rounded-[9px] border border-border-subtle bg-foreground/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
              {isPc ? <Monitor size={11} aria-hidden /> : <Smartphone size={11} aria-hidden />}
              {customer.platformType}
            </span>
            <StatusBadge tone={toneFromStatus(customer.status)}>
              {customer.status}
            </StatusBadge>
          </span>
        }
        description={
          <span className="font-mono text-[11.5px] text-brand-ink-4">
            Record ID {customer.id}
          </span>
        }
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Customers", href: "/mkpanelzoneadmin/customers" },
          { label: customer.identifier },
        ]}
        actions={
          <Link
            href="/mkpanelzoneadmin/customers"
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[11px] border border-border-subtle px-3.5 text-[12px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden />
            All customers
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* ── Left: record ─────────────────────────────────────────── */}
        <div className="space-y-5">
          <section className="mat-3 rounded-[18px] p-5">
            <h2 className="mb-4 border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
              Customer record
            </h2>

            <dl className="space-y-4">
              <RecordRow
                icon={<Tag size={14} />}
                label="Created by"
                value={customer.agent?.username || customer.createdSource}
              />
              <RecordRow
                icon={<PackageOpen size={14} />}
                label="Assigned package"
                value={customer.package?.name || "None"}
                muted={!customer.package}
              />
              <RecordRow
                icon={<Calendar size={14} />}
                label="Created"
                value={customer.createdAt.toLocaleString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <RecordRow
                icon={<KeyRound size={14} />}
                label="Last sign-in"
                value={
                  customer.lastLoginAt
                    ? customer.lastLoginAt.toLocaleString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Never"
                }
                muted={!customer.lastLoginAt}
              />
            </dl>
          </section>

          {/* Payment proof */}
          <section className="mat-3 rounded-[18px] p-5">
            <h2 className="mb-4 border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
              Payment proof
            </h2>
            {customer.agentPaymentProof ? (
              <a
                href={customer.agentPaymentProof}
                target="_blank"
                rel="noreferrer"
                className="group relative block overflow-hidden rounded-[13px] border border-border-subtle bg-surface"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={customer.agentPaymentProof}
                  alt="Payment proof"
                  className="max-h-[320px] w-full object-contain"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-[rgba(4,6,10,0.62)] opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                  <span className="inline-flex items-center gap-2 rounded-[11px] border border-white/20 bg-white/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                    Open full size
                    <ExternalLink size={12} aria-hidden />
                  </span>
                </span>
              </a>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-[13px] border border-dashed border-border-subtle bg-foreground/[0.02] py-8 text-brand-ink-4">
                <ImageOff size={20} aria-hidden />
                <p className="text-[12px] font-medium">No proof attached</p>
              </div>
            )}
          </section>

          {/* Device bindings — real rows from the devices relation */}
          <section className="mat-3 rounded-[18px] p-5">
            <h2 className="mb-4 flex items-center justify-between border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
              Device bindings
              <span className="tabular text-brand-ink-4">{customer.devices.length}</span>
            </h2>

            {customer.devices.length === 0 ? (
              <p className="text-[12.5px] italic text-brand-ink-4">
                No device has been bound yet. The first successful sign-in will register one.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {customer.devices.map((device) => (
                  <li
                    key={device.id}
                    className="flex items-start gap-2.5 rounded-[11px] border border-border-subtle bg-foreground/[0.025] p-3"
                  >
                    <HardDrive size={13} className="mt-[2px] shrink-0 text-brand-ink-2" aria-hidden />
                    <div className="min-w-0">
                      <p className="break-all text-[12px] text-brand-ink-2">
                        {device.fingerprint || "Unnamed device"}
                      </p>
                      {/*
                        We deliberately show only a short prefix of the token hash
                        as an opaque identifier — never the full digest, and never
                        the token itself (spec §51).
                      */}
                      <p className="mt-1 break-all font-mono text-[10.5px] text-brand-ink-4">
                        #{device.deviceTokenHash.slice(0, 12)}
                      </p>
                      <p className="mt-1 text-[10.5px] text-brand-ink-4">
                        Bound{" "}
                        {device.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · Last used "}
                        {device.lastUsedAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* ── Right: actions ───────────────────────────────────────── */}
        <div className="min-w-0">
          <div className="mb-3.5 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
            <UserCog size={13} aria-hidden />
            Operations
          </div>

          <CustomerActions
            customerId={customer.id}
            currentStatus={customer.status}
            deviceCount={customer.devices.length}
            currentPlatform={customer.platformType}
            currentPackageId={customer.packageId || ""}
            packages={packages}
          />
        </div>
      </div>
    </div>
  );
}

function RecordRow({
  icon,
  label,
  value,
  muted = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-[1px] shrink-0 text-brand-ink-4">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-ink-4">
          {label}
        </dt>
        <dd
          className={`mt-1 break-words text-[13px] ${
            muted ? "italic text-brand-ink-4" : "font-semibold text-foreground"
          }`}
        >
          {value}
        </dd>
      </div>
    </div>
  );
}
