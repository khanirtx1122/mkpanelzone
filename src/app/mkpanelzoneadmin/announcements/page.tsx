import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit3, Megaphone, CalendarClock, Radio } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { StatusBadge, type StatusTone } from "@/components/ui/StatusBadge";
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
  title: "Announcements | Owner Panel",
};

export const dynamic = "force-dynamic";

/** Mirrors the type vocabulary consumed by AnnouncementBar. */
const TYPE_TONE: Record<string, StatusTone> = {
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ALERT: "danger",
};

export default async function AnnouncementsPage() {
  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const live = announcements.filter(
    (a) =>
      a.active &&
      (!a.startDate || a.startDate <= now) &&
      (!a.endDate || a.endDate >= now)
  ).length;
  const scheduled = announcements.filter(
    (a) => a.active && a.startDate && a.startDate > now
  ).length;

  return (
    <div className="mx-auto max-w-[1180px]">
      <PageHeader
        eyebrow="Messaging"
        title="Announcements"
        description="Site-wide announcement bars shown to visitors and customers. Only one active announcement is displayed at a time."
        breadcrumbs={[
          { label: "Control Room", href: "/mkpanelzoneadmin" },
          { label: "Announcements" },
        ]}
        actions={
          <Button asChild variant="primary">
            <Link href="/mkpanelzoneadmin/announcements/new">
              <Plus size={16} />
              <span>New Announcement</span>
            </Link>
          </Button>
        }
      />

      <StatGrid cols={3}>
        <StatTile
          label="Total"
          value={announcements.length}
          icon={<Megaphone size={13} />}
        />
        <StatTile
          label="Live now"
          value={live}
          tone={live > 0 ? "success" : "neutral"}
          icon={<Radio size={13} />}
        />
        <StatTile
          label="Scheduled"
          value={scheduled}
          tone="info"
          icon={<CalendarClock size={13} />}
        />
      </StatGrid>

      {announcements.length === 0 ? (
        <div className="mat-2 rounded-[16px]">
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Announcements appear as a dismissible bar at the very top of the public site."
          />
        </div>
      ) : (
        <DataTableShell>
          <DataTableScroll>
            <DataTableHead>
              <Th>Message</Th>
              <Th>Type</Th>
              <Th>Scope</Th>
              <Th>Window</Th>
              <Th>Status</Th>
              <Th align="right">Action</Th>
            </DataTableHead>
            <DataTableBody>
              {announcements.map((a) => (
                <Tr key={a.id}>
                  <Td>
                    <div className="min-w-0">
                      {a.title && (
                        <p className="max-w-[280px] truncate text-[13.5px] font-bold text-foreground">
                          {a.title}
                        </p>
                      )}
                      <p className="max-w-[280px] truncate text-[12.5px] text-brand-ink-2">
                        {a.message}
                      </p>
                    </div>
                  </Td>

                  <Td>
                    <StatusBadge tone={TYPE_TONE[a.type] ?? "neutral"}>{a.type}</StatusBadge>
                  </Td>

                  <Td>
                    <span className="rounded-[7px] border border-border-subtle bg-foreground/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
                      {a.scope}
                    </span>
                  </Td>

                  <Td>
                    <span className="whitespace-nowrap text-[12px] text-brand-ink-3">
                      {a.startDate || a.endDate ? (
                        <>
                          {a.startDate ? a.startDate.toLocaleDateString() : "Any"}
                          {" → "}
                          {a.endDate ? a.endDate.toLocaleDateString() : "Any"}
                        </>
                      ) : (
                        <span className="italic text-brand-ink-4">Always</span>
                      )}
                    </span>
                  </Td>

                  <Td>
                    <StatusBadge tone={a.active ? "success" : "neutral"} dot>
                      {a.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </Td>

                  <Td align="right">
                    <RowActionLink href={`/mkpanelzoneadmin/announcements/${a.id}`}>
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
