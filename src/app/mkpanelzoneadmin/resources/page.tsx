import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Plus,
  Edit3,
  Link2,
  Power,
  PowerOff,
  KeyRound,
  FileText,
  Download,
  Layers,
  ExternalLink,
} from "lucide-react";
import { toggleResourceStatus } from "../actions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { FilterChipRow } from "@/components/admin/FilterChips";
import { StatusBadge, toneFromStatus } from "@/components/ui/StatusBadge";
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
  title: "Resources | Owner Panel",
};

export const dynamic = "force-dynamic";

const PLATFORMS = ["ANDROID", "IOS", "PC"] as const;

export default async function ResourcesPage(props: {
  searchParams?: Promise<{ packageId?: string; platform?: string }>;
}) {
  const searchParams = await props.searchParams;
  const packageIdFilter = searchParams?.packageId || "";
  const platformFilter = searchParams?.platform || "";

  const [packages, resources] = await Promise.all([
    prisma.package.findMany({
      where: platformFilter ? { platformType: platformFilter } : {},
      orderBy: { name: "asc" },
    }),
    prisma.packageResource.findMany({
      where: {
        ...(packageIdFilter ? { packageId: packageIdFilter } : {}),
        ...(platformFilter && !packageIdFilter ? { platformType: platformFilter } : {}),
      },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const buildUrl = (updates: { platform?: string; packageId?: string }) => {
    const params = new URLSearchParams();
    const p = updates.platform !== undefined ? updates.platform : platformFilter;
    const pkg = updates.packageId !== undefined ? updates.packageId : packageIdFilter;
    if (p) params.set("platform", p);
    if (pkg) params.set("packageId", pkg);
    const qs = params.toString();
    return `/mkpanelzoneadmin/resources${qs ? `?${qs}` : ""}`;
  };

  const addResourceHref = (() => {
    const params = new URLSearchParams();
    if (packageIdFilter) params.set("packageId", packageIdFilter);
    if (platformFilter) params.set("platform", platformFilter);
    const qs = params.toString();
    return `/mkpanelzoneadmin/resources/new${qs ? `?${qs}` : ""}`;
  })();

  const activeCount = resources.filter((r) => r.status === "active").length;
  const secretCount = resources.filter((r) => r.secret).length;
  const isFiltered = Boolean(packageIdFilter) || Boolean(platformFilter);
  const setToggle = toggleResourceStatus as unknown as (formData: FormData) => Promise<void>;

  return (
    <div className="mx-auto max-w-[1320px]">
      <PageHeader
        eyebrow="Delivery"
        title="Resources"
        description="The digital assets a customer receives after purchase — links, credentials and tutorials, scoped to a package and a platform."
        breadcrumbs={[{ label: "Control Room", href: "/mkpanelzoneadmin" }, { label: "Resources" }]}
        actions={
          <Button asChild variant="primary">
            <Link href={addResourceHref}>
              <Plus size={16} />
              <span>Add Resource</span>
            </Link>
          </Button>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <StatTile
          label={isFiltered ? "Matching" : "Total"}
          value={resources.length}
          icon={<Layers size={13} />}
        />
        <StatTile
          label="Active"
          value={activeCount}
          tone="success"
          icon={<Power size={13} />}
        />
        <StatTile label="Holding a secret" value={secretCount} tone="info" icon={<KeyRound size={13} />} />
      </div>

      <div className="mat-2 mb-5 space-y-3.5 rounded-[16px] p-3.5 sm:p-4">
        <FilterChipRow
          label="Platform"
          activeValue={platformFilter}
          options={[
            { value: "", label: "All platforms", href: buildUrl({ platform: "", packageId: "" }) },
            ...PLATFORMS.map((plat) => ({
              value: plat,
              label: plat === "IOS" ? "iPhone / iOS" : plat.charAt(0) + plat.slice(1).toLowerCase(),
              href: buildUrl({ platform: plat, packageId: "" }),
            })),
          ]}
        />
        <div className="border-t border-border-subtle pt-3.5">
          <FilterChipRow
            label="Package"
            activeValue={packageIdFilter}
            options={[
              { value: "", label: "All packages", href: buildUrl({ packageId: "" }) },
              ...packages.map((pkg) => ({
                value: pkg.id,
                label: pkg.name,
                href: buildUrl({ packageId: pkg.id }),
              })),
            ]}
          />
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="mat-2 rounded-[16px]">
          <EmptyState
            icon={Layers}
            title={isFiltered ? "No resources in this slice" : "No resources yet"}
            description={
              isFiltered
                ? "This platform or package has no resources assigned. Switch the chips above to see the rest."
                : "Add links, credentials or tutorials to the packages you sell."
            }
          />
        </div>
      ) : (
        <DataTableShell>
          <DataTableScroll>
            <DataTableHead>
              <Th>Resource</Th>
              <Th>Type</Th>
              <Th>Package</Th>
              <Th>Status</Th>
              <Th align="right">Actions</Th>
            </DataTableHead>
            <DataTableBody>
              {resources.map((resource) => {
                const Meta = TYPE_ICON[resource.type?.toUpperCase()] ?? Link2;
                return (
                  <Tr key={resource.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-border-subtle bg-foreground/[0.035] text-brand-ink-2">
                          <Meta size={15} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[240px] truncate text-[13.5px] font-bold text-foreground">
                            {resource.name}
                          </p>
                          <p className="mt-0.5 max-w-[240px] truncate font-mono text-[10.5px] text-brand-ink-4">
                            {resource.url ? (
                              resource.url
                            ) : resource.secret ? (
                              <span className="tracking-[0.2em]">••••••••••••</span>
                            ) : (
                              "No target set"
                            )}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <span className="rounded-[7px] border border-border-subtle bg-foreground/[0.04] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-brand-ink-2">
                        {resource.type}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex flex-col items-start gap-1">
                        {resource.package ? (
                          <span className="text-[13px] font-semibold text-brand-ink-2">
                            {resource.package.name}
                          </span>
                        ) : (
                          <span className="text-[12px] italic text-brand-ink-4">
                            Global resource
                          </span>
                        )}
                        <span className="rounded-[6px] border border-border-subtle px-1.5 py-[2px] text-[9px] font-bold uppercase tracking-[0.09em] text-brand-ink-4">
                          {resource.platformType}
                        </span>
                      </div>
                    </Td>

                    <Td>
                      <StatusBadge tone={toneFromStatus(resource.status)}>
                        {resource.status}
                      </StatusBadge>
                    </Td>

                    <Td align="right">
                      <div className="flex items-center justify-end gap-2">
                        {resource.url && (
                          <RowActionLink
                            href={resource.url}
                            target="_blank"
                            rel="noreferrer"
                            title="Open target in a new tab"
                          >
                            <ExternalLink size={12} aria-hidden />
                          </RowActionLink>
                        )}

                        <RowActionLink href={`/mkpanelzoneadmin/resources/${resource.id}`}>
                          <Edit3 size={12} aria-hidden />
                          Edit
                        </RowActionLink>

                        <ConfirmSubmit
                          action={setToggle}
                          fields={{ resourceId: resource.id }}
                          tone={resource.status === "active" ? "warning" : "success"}
                          confirm={
                            resource.status === "active"
                              ? {
                                  title: `Disable “${resource.name}”?`,
                                  description:
                                    "Customers will immediately stop seeing this resource in their vault.",
                                  body: "Nothing is deleted — the resource stays configured and can be re-enabled in one click.",
                                  confirmLabel: "Disable resource",
                                  tone: "warning",
                                }
                              : undefined
                          }
                        >
                          {resource.status === "active" ? (
                            <>
                              <PowerOff size={12} aria-hidden />
                              Disable
                            </>
                          ) : (
                            <>
                              <Power size={12} aria-hidden />
                              Enable
                            </>
                          )}
                        </ConfirmSubmit>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </DataTableBody>
          </DataTableScroll>
        </DataTableShell>
      )}
    </div>
  );
}

const TYPE_ICON: Record<string, typeof Link2> = {
  LINK: Link2,
  URL: Link2,
  SECRET: KeyRound,
  CREDENTIAL: KeyRound,
  PASSWORD: KeyRound,
  TUTORIAL: FileText,
  GUIDE: FileText,
  DOWNLOAD: Download,
  FILE: Download,
};
