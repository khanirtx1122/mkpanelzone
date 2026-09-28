import { prisma } from "@/lib/prisma";
import { getFreePanelConfig, FREE_PANEL_DEFAULTS } from "@/lib/freePanel";
import { saveFreePanelConfig, importFreePanelKeys, setFreePanelKeyStatus, generateFreePanelKeys } from "../actions";
import { Save, Gift, KeyRound, Plus, Ban, RotateCcw, AlertTriangle, CheckCircle2, Sparkles, KeySquare } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { AdminSubmitButton } from "@/components/admin/AdminButton";
import { FreePanelResultToasts } from "./FreePanelForms";

export default async function FreePanelSettingsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const cfg = await getFreePanelConfig();

  const [available, assigned, disabled] = await Promise.all([
    prisma.freePanelKey.count({ where: { status: "AVAILABLE" } }),
    prisma.freePanelKey.count({ where: { status: "ASSIGNED" } }),
    prisma.freePanelKey.count({ where: { status: "DISABLED" } }),
  ]);
  const total = available + assigned + disabled;
  const LOW_STOCK_THRESHOLD = 10;
  const isLow = available > 0 && available <= LOW_STOCK_THRESHOLD;

  // Recent inventory (sensibly limited; masked for readability)
  const recentKeys = await prisma.freePanelKey.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { claim: { select: { id: true, createdAt: true } } },
  });
  const maskKey = (k: string) =>
    k.length <= 8 ? `${k.slice(0, 2)}••••` : `${k.slice(0, 4)}••••${k.slice(-4)}`;

  const importResult =
    searchParams.imported != null
      ? { imported: Number(searchParams.imported), skipped: Number(searchParams.skipped ?? 0), submitted: Number(searchParams.submitted ?? 0), invalid: Number(searchParams.invalid ?? 0) }
      : null;

  const generateResult =
    searchParams.generated != null
      ? { generated: Number(searchParams.generated), requested: Number(searchParams.requested ?? 0) }
      : null;

  const stats = [
    { label: "Available", value: available, color: "#4DA3FF" },
    { label: "Assigned", value: assigned, color: "#22C55E" },
    { label: "Total", value: total, color: "#94A3B8" },
  ];

  const field = (name: string, label: string, value: string, opts?: { type?: string; mono?: boolean; full?: boolean; placeholder?: string }) => (
    <div className={`space-y-2 ${opts?.full ? "md:col-span-2" : ""}`}>
      <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">{label}</label>
      <input
        type={opts?.type || "text"}
        name={name}
        defaultValue={value}
        placeholder={opts?.placeholder}
        className={`w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50 transition-colors ${opts?.mono ? "font-mono" : ""}`}
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Suspense fallback={null}><FreePanelResultToasts /></Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans flex items-center gap-2">
            <Gift className="text-brand-blue-400" size={22} /> Free Panel Access
          </h1>
          <p className="text-sm text-brand-ink-3 mt-1 font-mono">
            MK FREE PC PANEL — offer status, key inventory, links and delivery.
          </p>
        </div>
        <Link
          href="/mkpanelzoneadmin/popups"
          className="text-xs font-bold tracking-widest uppercase text-brand-ink-3 hover:text-white transition-colors w-fit"
        >
          ← Popups
        </Link>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-green-500/5 border-green-500/20 text-sm">
          <CheckCircle2 size={16} className="text-green-400 shrink-0" />
          <span className="text-white font-bold">
            {importResult.imported} keys imported
          </span>
          {importResult.skipped > 0 && (
            <span className="text-brand-ink-3">· {importResult.skipped} duplicates skipped (of {importResult.submitted} submitted)</span>
          )}
          {importResult.invalid > 0 && (
            <span className="text-orange-400">· {importResult.invalid} invalid format skipped</span>
          )}
        </div>
      )}
      {searchParams.error === "import" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-red-500/5 border-red-500/20 text-sm text-red-400">
          <AlertTriangle size={16} /> Import failed — please check the input and try again.
        </div>
      )}
      {searchParams.error === "generate" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-red-500/5 border-red-500/20 text-sm text-red-400">
          <AlertTriangle size={16} /> Key generation failed — please try again.
        </div>
      )}
      {generateResult && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-green-500/5 border-green-500/20 text-sm">
          <Sparkles size={16} className="text-brand-blue-400 shrink-0" />
          <span className="text-white font-bold">{generateResult.generated} keys generated</span>
          {generateResult.generated < generateResult.requested && (
            <span className="text-brand-ink-3">· {generateResult.requested - generateResult.generated} skipped (rare collision)</span>
          )}
        </div>
      )}

      {/* Low stock warning */}
      {isLow && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-orange-500/5 border-orange-500/20 text-sm">
          <AlertTriangle size={16} className="text-orange-400 shrink-0" />
          <span className="text-white font-bold">LOW KEY INVENTORY</span>
          <span className="text-brand-ink-3">Only {available} Free Panel key{available === 1 ? "" : "s"} remaining.</span>
        </div>
      )}

      {/* ── 1. OFFER STATUS + STATS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-[#0E1420] border border-white/5 rounded-xl p-5 lg:col-span-2">
          <form action={saveFreePanelConfig} className="space-y-5" id="offerForm">
            <input type="hidden" name="redirectUrl" value="/mkpanelzoneadmin/free-panel" />
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h2 className="text-base font-bold text-white">Offer Status</h2>
              <select
                name="enabled"
                defaultValue={String(cfg.enabled)}
                className="bg-black/50 border border-white/10 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-brand-blue-500/50 uppercase font-bold tracking-widest"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("title", "Offer Title", cfg.title)}
              {field("subtitle", "Subtitle", cfg.subtitle)}
              {field("durationLabel", "Duration Label", cfg.durationLabel, { full: true })}
              {field("ctaLabel", "CTA Label", cfg.ctaLabel)}
              {field("downloadLabel", "Download Button Label", cfg.downloadLabel)}
              {field("downloadUrl", "PC Download URL", cfg.downloadUrl, { mono: true, full: true, placeholder: "https://.../installer.exe" })}
              {field("whatsappUrl", "WhatsApp Channel URL", cfg.whatsappUrl, { mono: true, placeholder: "https://whatsapp.com/channel/..." })}
              {field("youtubeUrl", "YouTube Channel URL", cfg.youtubeUrl, { mono: true, placeholder: "https://youtube.com/@..." })}
              {field("discordUrl", "Discord Invite URL", cfg.discordUrl, { mono: true, placeholder: "https://discord.gg/..." })}
              {field("popupDelaySeconds", "Popup Delay (s)", String(cfg.popupDelaySeconds), { type: "number" })}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold tracking-widest uppercase text-brand-ink-3">
                Setup / Apply Steps (one per line)
              </label>
              <textarea
                name="setupInstructions"
                defaultValue={cfg.setupInstructions}
                rows={5}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {field("startDate", "Start Date", cfg.startDate ? cfg.startDate.slice(0, 16) : "", { type: "datetime-local" })}
              {field("endDate", "End Date", cfg.endDate ? cfg.endDate.slice(0, 16) : "", { type: "datetime-local" })}
            </div>
            <input type="hidden" name="popupFrequency" value={cfg.popupFrequency} />
            <AdminSubmitButton label="Save Settings" pendingLabel="Saving…" successLabel="Saved">
              <Save size={16} />
            </AdminSubmitButton>
          </form>
        </div>

        {/* Stats + quick import */}
        <div className="space-y-5">
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#0E1420] border border-white/5 rounded-xl p-4 text-center lg:text-left">
                <p className="text-[10px] font-bold tracking-widest uppercase text-brand-ink-3">{s.label}</p>
                <p className="text-2xl font-extrabold mt-1" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#0E1420] border border-white/5 rounded-xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-brand-blue-400" /> Generate Keys
            </h2>
            <p className="text-xs text-brand-ink-3 mb-3">
              Auto-generate keys in the owner format:
              <span className="font-mono text-brand-blue-400"> XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX-XXXXXX</span>
            </p>
            <form action={generateFreePanelKeys} className="space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  name="count"
                  min={1}
                  max={500}
                  defaultValue={25}
                  required
                  className="w-24 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
                />
                <span className="text-xs text-brand-ink-3">keys (1–500)</span>
              </div>
              <input
                type="text"
                name="notes"
                placeholder="Batch note (optional) — e.g. November drop"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              />
              <AdminSubmitButton variant="secondary" label="Generate Keys" pendingLabel="Generating…" successLabel="Generated" className="w-full">
                <Sparkles size={16} />
              </AdminSubmitButton>
            </form>
          </div>

          <div className="bg-[#0E1420] border border-white/5 rounded-xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <KeyRound size={16} className="text-brand-blue-400" /> Bulk Add Keys
            </h2>
            <p className="text-xs text-brand-ink-3 mb-3">
              Paste keys — one per line. Owner format
              <span className="font-mono"> XXXXXX-…-XXXXXX</span> or similar. Duplicates skipped.
            </p>
            <form action={importFreePanelKeys} className="space-y-3">
              <textarea
                name="keys"
                rows={7}
                required
                placeholder={"A1B2C3-D4E5F6-G7H8J9-K2L3M4-N5P6Q7-R8S9T2\nB2C3D4-E5F6G7-H8J9K2-L3M4N5-P6Q7R8-S9T2U3"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-blue-500/50"
              />
              <input
                type="text"
                name="notes"
                placeholder="Batch note (optional) — e.g. October release"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              />
              <AdminSubmitButton label="Import Keys" pendingLabel="Importing…" successLabel="Imported" className="w-full">
                <Plus size={16} />
              </AdminSubmitButton>
            </form>
          </div>
        </div>
      </div>

      {/* ── 2. KEY INVENTORY (recent) ── */}
      <div className="bg-[#0E1420] border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Key Inventory</h2>
          <span className="text-xs text-brand-ink-3 font-mono">latest {recentKeys.length} of {total} · disabled: {disabled}</span>
        </div>
        {recentKeys.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <KeySquare size={28} className="mx-auto text-brand-ink-3 mb-3" />
            <p className="text-sm font-bold text-white">No keys yet</p>
            <p className="text-xs text-brand-ink-3 mt-1 mb-4">Add a key batch to activate the Free Panel offer.</p>
            <Link href="#" className="hidden">Add keys</Link>
          </div>
        ) : (
          <>
          {/* Mobile: card list */}
          <div className="md:hidden divide-y divide-white/5">
            {recentKeys.map((k) => (
              <div key={k.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-sm text-white truncate">{maskKey(k.keyValue)}</p>
                  <span className={`inline-flex mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                    k.status === "AVAILABLE"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : k.status === "ASSIGNED"
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-brand-ink-3/10 text-brand-ink-3 border-brand-ink-3/20"
                  }`}>
                    {k.status}
                  </span>
                </div>
                {k.status !== "ASSIGNED" && (
                  <form action={setFreePanelKeyStatus} className="inline shrink-0">
                    <input type="hidden" name="keyId" value={k.id} />
                    <input type="hidden" name="status" value={k.status === "AVAILABLE" ? "DISABLED" : "AVAILABLE"} />
                    <AdminSubmitButton
                      variant={k.status === "AVAILABLE" ? "danger" : "secondary"}
                      label={k.status === "AVAILABLE" ? "Disable" : "Enable"}
                      pendingLabel="Working…"
                      successLabel="Done"
                      successHoldMs={800}
                      className="!px-3 !py-2 min-h-[44px]"
                    >
                      {k.status === "AVAILABLE" ? <Ban size={12} /> : <RotateCcw size={12} />}
                    </AdminSubmitButton>
                  </form>
                )}
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-black/40">
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-brand-ink-3">Key</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-brand-ink-3">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 hidden md:table-cell">Created</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 hidden lg:table-cell">Assigned</th>
                  <th className="px-5 py-3 text-[10px] font-bold tracking-widest uppercase text-brand-ink-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentKeys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 font-mono text-sm text-white">{maskKey(k.keyValue)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${
                          k.status === "AVAILABLE"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : k.status === "ASSIGNED"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-brand-ink-3/10 text-brand-ink-3 border-brand-ink-3/20"
                        }`}
                      >
                        {k.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-brand-ink-3 hidden md:table-cell">
                      {k.createdAt.toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-xs text-brand-ink-3 hidden lg:table-cell">
                      {k.assignedAt ? k.assignedAt.toLocaleDateString() : "—"}
                    </td>                    <td className="px-5 py-3 text-right">
                      {k.status !== "ASSIGNED" && (
                        <form action={setFreePanelKeyStatus} className="inline">
                          <input type="hidden" name="keyId" value={k.id} />
                          <input type="hidden" name="status" value={k.status === "AVAILABLE" ? "DISABLED" : "AVAILABLE"} />
                          <AdminSubmitButton
                            variant={k.status === "AVAILABLE" ? "danger" : "secondary"}
                            label={k.status === "AVAILABLE" ? "Disable" : "Enable"}
                            pendingLabel="Working…"
                            successLabel="Done"
                            successHoldMs={800}
                            className="!px-3 !py-1.5 !text-[10px]"
                          >
                            {k.status === "AVAILABLE" ? <Ban size={12} /> : <RotateCcw size={12} />}
                          </AdminSubmitButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <p className="text-[11px] text-brand-ink-3 font-mono">
        Defaults: title “{FREE_PANEL_DEFAULTS.title}” · assignment is atomic (one key per claim, never reused) · when
        Available hits 0 the public offer shows “FREE PANEL CURRENTLY ENDED” and reactivates automatically after a new import.
      </p>
    </div>
  );
}
