import { prisma } from "@/lib/prisma";
import { resolveProofWithExistence } from "@/lib/paymentProof";
import { ProofManager, type ProofItem } from "./ProofManager";

export const metadata = {
  title: "Proof Storage | Owner Panel",
};

const PER_SOURCE = 30;

/**
 * PROOF STORAGE MANAGER.
 *
 * Proofs are enumerated from their database references (checkout orders +
 * agent-created customers) — that is the authoritative inventory of what is
 * in use. Existence is probed once here, on a dedicated page, so the owner
 * sees honest missing-file states instead of silent garbage.
 */
export default async function ProofStoragePage() {
  const [orders, customers] = await Promise.all([
    prisma.order.findMany({
      where: { paymentProofPath: { not: null } },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE,
      select: { id: true, orderNumber: true, customerEmail: true, paymentProofPath: true, createdAt: true },
    }),
    prisma.customer.findMany({
      where: { agentPaymentProof: { not: null } },
      orderBy: { createdAt: "desc" },
      take: PER_SOURCE,
      select: {
        id: true,
        identifier: true,
        agentPaymentProof: true,
        createdAt: true,
        createdSource: true,
        agent: { select: { username: true } },
      },
    }),
  ]);

  const items: ProofItem[] = await Promise.all([
    ...orders.map(async (order): Promise<ProofItem> => {
      const proof = await resolveProofWithExistence(order.paymentProofPath);
      return {
        key: `order-${order.id}`,
        source: "order",
        id: order.id,
        path: order.paymentProofPath || "",
        url: proof?.url || "",
        exists: proof?.exists ?? false,
        inlineVisible: proof?.inlineVisible ?? false,
        ref: order.orderNumber,
        origin: order.customerEmail,
        date: order.createdAt.toLocaleString(),
      };
    }),
    ...customers.map(async (customer): Promise<ProofItem> => {
      const proof = await resolveProofWithExistence(customer.agentPaymentProof);
      const origin =
        customer.createdSource === "OWNER_ADMIN"
          ? "Created by Owner Admin"
          : customer.agent
            ? `Created by reseller ${customer.agent.username}`
            : customer.createdSource;
      return {
        key: `customer-${customer.id}`,
        source: "customer",
        id: customer.id,
        path: customer.agentPaymentProof || "",
        url: proof?.url || "",
        exists: proof?.exists ?? false,
        inlineVisible: proof?.inlineVisible ?? false,
        ref: customer.identifier,
        origin,
        date: customer.createdAt.toLocaleString(),
      };
    }),
  ]);

  items.sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">Proof Storage</h1>
        <p className="text-sm text-brand-ink-3 mt-1 font-mono">
          Payment screenshots referenced by orders and customers — {items.length} shown, newest first.
        </p>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center border border-white/5 rounded-2xl bg-white/5">
          <p className="text-brand-ink-3">No payment proofs are stored yet.</p>
        </div>
      ) : (
        <ProofManager items={items} />
      )}
    </div>
  );
}
