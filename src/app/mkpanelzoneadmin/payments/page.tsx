import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit3, CreditCard, Power, PowerOff, Wallet, CheckCircle2 } from "lucide-react";
import { togglePaymentMethod } from "../actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatTile } from "@/components/admin/StatTile";
import { ConfirmSubmit } from "@/components/admin/ConfirmSubmit";
import {
  DataTableShell,
  DataTableScroll,
  DataTableHead,
  DataTableBody,
  Th,
  Td,
  Tr,
  RowActionLink,
} from "@/components/ui/DataTable";

export const metadata = {
  title: "Payment Methods | Owner Panel",
};

export const dynamic = "force-dynamic";

export default async function PaymentMethodsPage() {
  const methods = await prisma.paymentMethod.findMany({
    orderBy: { createdAt: "desc" },
  });

  const activeCount = methods.filter((m) => m.active).length;
  const setToggle = togglePaymentMethod as unknown as (formData: FormData) => Promise<void>;

  return (
    <div className="mx-auto max-w-[1080px]">
      <PageHeader
        eyebrow="Checkout"
        title="Payment Methods"
        description="The payment channels shown to customers at checkout. Only enabled methods are offered."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Payment Methods" },
        ]}
        actions={
          <Button asChild variant="primary">
            <Link href="/mkpanelzoneadmin/payments/new">
              <Plus size={16} />
              <span>Add Method</span>
            </Link>
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile label="Total" value={methods.length} icon={<Wallet size={13} />} />
        <StatTile
          label="Offered"
          value={activeCount}
          tone="success"
          icon={<CheckCircle2 size={13} />}
        />
        <StatTile
          label="Hidden"
          value={methods.length - activeCount}
          tone={methods.length - activeCount > 0 ? "warning" : "neutral"}
        />
      </div>

      {methods.length === 0 ? (
        <div className="mat-2 rounded-[16px]">
          <EmptyState
            icon={Wallet}
            title="No payment methods configured"
            description="Checkout cannot accept an order until at least one method is enabled. Add one to continue."
            action={
              <Button asChild variant="primary" size="sm">
                <Link href="/mkpanelzoneadmin/payments/new">
                  <Plus size={14} />
                  <span>Add Method</span>
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <DataTableShell>
          <DataTableScroll>
            <DataTableHead>
              <Th>Method</Th>
              <Th>Account details</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </DataTableHead>
            <DataTableBody>
              {methods.map((method) => (
                <Tr key={method.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-foreground/[0.05] text-brand-ink-2">
                        <CreditCard size={15} aria-hidden />
                      </span>
                      <span className="text-[13.5px] font-bold text-foreground">{method.name}</span>
                    </div>
                  </Td>

                  <Td>
                    <p className="max-w-[360px] whitespace-pre-wrap break-words font-mono text-[11.5px] leading-relaxed text-brand-ink-2">
                      {method.accountDetails}
                    </p>
                  </Td>

                  <Td>
                    <StatusBadge tone={method.active ? "success" : "neutral"} dot>
                      {method.active ? "Offered" : "Hidden"}
                    </StatusBadge>
                  </Td>

                  <Td align="right">
                    <div className="flex items-center justify-end gap-2">
                      <RowActionLink href={`/mkpanelzoneadmin/payments/${method.id}`}>
                        <Edit3 size={12} aria-hidden />
                        Edit
                      </RowActionLink>

                      <ConfirmSubmit
                        action={setToggle}
                        fields={{ methodId: method.id }}
                        tone={method.active ? "warning" : "success"}
                        confirm={
                          method.active
                            ? {
                                title: `Hide “${method.name}”?`,
                                description:
                                  "Customers will no longer be able to select this payment method at checkout.",
                                body: "Existing orders paid through this method are unaffected.",
                                confirmLabel: "Hide method",
                                tone: "warning",
                              }
                            : undefined
                        }
                      >
                        {method.active ? (
                          <>
                            <PowerOff size={12} aria-hidden />
                            Hide
                          </>
                        ) : (
                          <>
                            <Power size={12} aria-hidden />
                            Offer
                          </>
                        )}
                      </ConfirmSubmit>
                    </div>
                  </Td>
                </Tr>
              ))}
            </DataTableBody>
          </DataTableScroll>
        </DataTableShell>
      )}
    </div>
  );
}
