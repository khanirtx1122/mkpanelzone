import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Package,
  ExternalLink,
  Clock,
  Mail,
  MessageCircle,
  ImageOff,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { updateOrderStatus } from "../../actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";

export const dynamic = "force-dynamic";

export default async function OrderDetailsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { product: true },
  });

  if (!order) {
    notFound();
  }

  const setStatus = updateOrderStatus as unknown as (formData: FormData) => Promise<void>;

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        eyebrow="Fulfilment"
        title={
          <span className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[20px] sm:text-[23px]">{order.orderNumber}</span>
            <StatusBadge tone={toneFromStatus(order.status)}>{order.status}</StatusBadge>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1.5">
              <Clock size={12} aria-hidden />
              Placed {new Date(order.createdAt).toLocaleString()}
            </span>
            <span className="text-brand-ink-4" aria-hidden>
              ·
            </span>
            <span>
              Last updated {new Date(order.updatedAt).toLocaleString()}
            </span>
          </span>
        }
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Orders", href: "/mkpanelzoneadmin/orders" },
          { label: order.orderNumber },
        ]}
        actions={
          <Link
            href="/mkpanelzoneadmin/orders"
            className="inline-flex h-[38px] items-center gap-1.5 rounded-[11px] border border-border-subtle px-3.5 text-[12px] font-bold uppercase tracking-[0.05em] text-brand-ink-2 transition-colors hover:border-border-strong hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden />
            All orders
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* ── Customer ─────────────────────────────────────────────── */}
        <section className="mat-3 rounded-[18px] p-5 sm:p-6">
          <SectionTitle icon={<Mail size={14} />}>Customer Details</SectionTitle>
          <dl className="space-y-4">
            <Field label="Email" value={order.customerEmail} />
            <Field
              label="Discord / Contact"
              value={order.customerDiscord || "Not provided"}
              muted={!order.customerDiscord}
              icon={<MessageCircle size={12} />}
            />
          </dl>
        </section>

        {/* ── Product ──────────────────────────────────────────────── */}
        <section className="mat-3 rounded-[18px] p-5 sm:p-6">
          <SectionTitle icon={<Package size={14} />}>Product Snapshot</SectionTitle>
          <div className="flex items-center gap-4">
            {order.product.coverImageUrl ? (
              <span className="h-16 w-16 shrink-0 overflow-hidden rounded-[12px] border border-border-subtle bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.product.coverImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </span>
            ) : (
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] border border-border-subtle bg-foreground/[0.03] text-brand-ink-4">
                <ImageOff size={20} aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold text-foreground">
                {order.product.name}
              </p>
              <p className="mt-0.5 truncate font-mono text-[11px] text-brand-ink-3">
                {order.product.slug}
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-[12px] border border-border-subtle bg-foreground/[0.025] px-4 py-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
              Price at purchase
            </span>
            <span className="tabular text-[19px] font-extrabold text-foreground">
              PKR {order.priceSnapshot.toFixed(2)}
            </span>
          </div>
        </section>

        {/* ── Payment verification ─────────────────────────────────── */}
        <section className="mat-3 rounded-[18px] p-5 sm:p-6 lg:col-span-2">
          <SectionTitle icon={<ShieldCheck size={14} />}>Payment Verification</SectionTitle>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Amount reported"
                  value={order.amountReported ? `PKR ${order.amountReported}` : "Not reported"}
                  muted={!order.amountReported}
                />
                <div>
                  <dt className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
                    Amount matches price
                  </dt>
                  <dd>
                    <StatusBadge
                      tone={order.amountMatches ? "success" : "warning"}
                      icon={order.amountMatches ? CheckCircle2 : XCircle}
                    >
                      {order.amountMatches ? "Matches" : "Mismatch"}
                    </StatusBadge>
                  </dd>
                </div>
              </dl>

              <div className="border-t border-border-subtle pt-5">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
                  Order Actions
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <ConfirmSubmit
                    action={setStatus}
                    fields={{ orderId: order.id, status: "approved" }}
                    tone="success"
                    disabled={order.status === "approved"}
                  >
                    <CheckCircle2 size={13} aria-hidden />
                    Approve
                  </ConfirmSubmit>

                  <ConfirmSubmit
                    action={setStatus}
                    fields={{ orderId: order.id, status: "delivered" }}
                    tone="info"
                    disabled={order.status === "delivered"}
                  >
                    <Truck size={13} aria-hidden />
                    Mark delivered
                  </ConfirmSubmit>

                  <ConfirmSubmit
                    action={setStatus}
                    fields={{ orderId: order.id, status: "rejected" }}
                    tone="warning"
                    disabled={order.status === "rejected"}
                    confirm={{
                      title: "Reject this order?",
                      description: `Order ${order.orderNumber} will be marked as rejected.`,
                      body: "The customer will see the rejected status on their order record. You can move it back to pending or approved at any time by using the other actions.",
                      confirmLabel: "Reject order",
                      tone: "warning",
                    }}
                  >
                    <XCircle size={13} aria-hidden />
                    Reject
                  </ConfirmSubmit>

                  <ConfirmSubmit
                    action={setStatus}
                    fields={{ orderId: order.id, status: "cancelled" }}
                    tone="danger"
                    disabled={order.status === "cancelled"}
                    confirm={{
                      title: "Cancel this order?",
                      description: `Order ${order.orderNumber} will be marked as cancelled.`,
                      body: "Cancelling is a terminal state for the customer's checkout flow. No record is deleted and no payment data is removed.",
                      confirmLabel: "Cancel order",
                      tone: "danger",
                    }}
                  >
                    <XCircle size={13} aria-hidden />
                    Cancel
                  </ConfirmSubmit>
                </div>
              </div>
            </div>

            {/* Proof screenshot */}
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
                Proof screenshot
              </p>
              {order.paymentProofPath ? (
                <a
                  href={order.paymentProofPath}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative block aspect-[3/4] w-full overflow-hidden rounded-[14px] border border-border-subtle bg-surface"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.paymentProofPath}
                    alt="Payment proof"
                    className="h-full w-full object-contain"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-[rgba(4,6,10,0.62)] opacity-0 backdrop-blur-[2px] transition-opacity duration-200 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-2 rounded-[11px] border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white">
                      Open full size
                      <ExternalLink size={13} aria-hidden />
                    </span>
                  </span>
                </a>
              ) : (
                <div className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-[14px] border border-dashed border-border-subtle bg-foreground/[0.02] text-brand-ink-4">
                  <ImageOff size={24} aria-hidden />
                  <p className="text-[12.5px] font-medium">No proof uploaded</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 border-b border-border-subtle pb-3 text-[10.5px] font-bold uppercase tracking-[0.14em] text-brand-ink-3">
      <span className="text-brand-ink-2" aria-hidden>
        {icon}
      </span>
      {children}
    </h2>
  );
}

function Field({
  label,
  value,
  muted = false,
  icon,
}: {
  label: string;
  value: string;
  muted?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.13em] text-brand-ink-3">
        {label}
      </dt>
      <dd
        className={`flex items-center gap-1.5 break-words text-[13.5px] ${
          muted ? "text-brand-ink-4 italic" : "font-medium text-foreground"
        }`}
      >
        {icon && !muted ? (
          <span className="text-brand-ink-3" aria-hidden>
            {icon}
          </span>
        ) : null}
        {value}
      </dd>
    </div>
  );
}
