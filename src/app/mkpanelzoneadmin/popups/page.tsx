import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit3, AppWindow, ImageIcon, Repeat, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatTile, StatGrid } from "@/components/admin/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
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
  title: "Popups | Owner Panel",
};

export const dynamic = "force-dynamic";

/** ONCE_PER_SESSION → "Once per session" */
function humanise(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default async function PopupsPage() {
  const popups = await prisma.popup.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const live = popups.filter(
    (p) =>
      p.active &&
      (!p.startDate || p.startDate <= now) &&
      (!p.endDate || p.endDate >= now)
  ).length;
  const withImage = popups.filter((p) => p.imageUrl).length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Messaging"
        title="Popups"
        description="Overlay dialogs shown to visitors. Each popup controls its own display frequency so returning visitors are not interrupted repeatedly."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Popups" }]}
        actions={
          <Button asChild variant="primary">
            <Link href="/mkpanelzoneadmin/popups/new">
              <Plus size={16} />
              <span>New Popup</span>
            </Link>
          </Button>
        }
      />

      <StatGrid cols={3}>
        <StatTile label="Total" value={popups.length} icon={<AppWindow size={13} />} />
        <StatTile
          label="Live now"
          value={live}
          tone={live > 0 ? "success" : "neutral"}
          icon={<CalendarClock size={13} />}
        />
        <StatTile
          label="With artwork"
          value={withImage}
          tone="info"
          icon={<ImageIcon size={13} />}
        />
      </StatGrid>

      {popups.length === 0 ? (
        <div className="mat-2 rounded-[16px]">
          <EmptyState
            icon={AppWindow}
            title="No popups configured"
            description="Create a popup to promote an offer or surface a notice as an overlay."
          />
        </div>
      ) : (
        <DataTableShell>
          <DataTableScroll>
            <DataTableHead>
              <Th>Popup</Th>
              <Th>Frequency</Th>
              <Th>Scope</Th>
              <Th>Window</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </DataTableHead>
            <DataTableBody>
              {popups.map((popup) => (
                <Tr key={popup.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-border-subtle bg-surface">
                        {popup.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={popup.imageUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AppWindow size={15} className="text-brand-ink-4" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="max-w-[220px] truncate text-[13.5px] font-bold text-foreground">
                          {popup.title}
                        </p>
                        {popup.message && (
                          <p className="max-w-[220px] truncate text-[12px] text-brand-ink-3">
                            {popup.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </Td>

                  <Td>
                    <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-ink-2">
                      <Repeat size={12} className="text-brand-ink-4" aria-hidden />
                      {humanise(popup.frequency)}
                    </span>
                  </Td>

                  <Td>
                    <span className="rounded-[7px] border border-border-subtle bg-foreground/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
                      {popup.scope}
                    </span>
                  </Td>

                  <Td>
                    <span className="whitespace-nowrap text-[12px] text-brand-ink-3">
                      {popup.startDate || popup.endDate ? (
                        <>
                          {popup.startDate ? popup.startDate.toLocaleDateString() : "Any"}
                          {" → "}
                          {popup.endDate ? popup.endDate.toLocaleDateString() : "Any"}
                        </>
                      ) : (
                        <span className="italic text-brand-ink-4">Always</span>
                      )}
                    </span>
                  </Td>

                  <Td>
                    <StatusBadge tone={popup.active ? "success" : "neutral"} dot>
                      {popup.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </Td>

                  <Td align="right">
                    <RowActionLink href={`/mkpanelzoneadmin/popups/${popup.id}`}>
                      <Edit3 size={12} aria-hidden />
                      Edit
                    </RowActionLink>
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
