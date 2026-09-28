import { prisma } from "@/lib/prisma";
import { getFreePanelConfig, FREE_PANEL_DEFAULTS } from "@/lib/freePanel";
import { saveFreePanelConfig, importFreePanelKeys, setFreePanelKeyStatus } from "../actions";
import { Save, Gift, KeyRound, Plus, Ban, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

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
      ? { imported: Number(searchParams.imported), skipped: Number(searchParams.skipped ?? 0), submitted: Number(searchParams.submitted ?? 0) }
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
        </div>
      )}
      {searchParams.error === "import" && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border bg-red-500/5 border-red-500/20 text-sm text-red-400">
          <AlertTriangle size={16} /> Import failed — please check the input and try again.
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
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-[background-color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-blue-400"
            >
              <Save size={16} /> Save Settings
            </button>
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
              <KeyRound size={16} className="text-brand-blue-400" /> Bulk Add Keys
            </h2>
            <p className="text-xs text-brand-ink-3 mb-3">
              Paste keys — one per line. Duplicates are skipped automatically.
            </p>
            <form action={importFreePanelKeys} className="space-y-3">
              <textarea
                name="keys"
                rows={7}
                required
                placeholder={"KEY-001-XXXX\nKEY-002-XXXX\nKEY-003-XXXX"}
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-blue-500/50"
              />
              <input
                type="text"
                name="notes"
                placeholder="Batch note (optional) — e.g. October release"
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              />
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-blue-500 hover:bg-brand-blue-600 text-white rounded-lg font-bold tracking-wider uppercase text-xs transition-[background-color,transform] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-brand-blue-400"
              >
                <Plus size={16} /> Import Keys
              </button>
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
          <p className="px-5 py-10 text-center text-sm text-brand-ink-3">
            No keys yet. Import a batch to activate the offer.
          </p>
        ) : (
          <div className="overflow-x-auto">
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
                    </td>
                    <td className="px-5 py-3 text-right">
                      {k.status !== "ASSIGNED" && (
                        <form action={setFreePanelKeyStatus} className="inline">
                          <input type="hidden" name="keyId" value={k.id} />
                          <input type="hidden" name="status" value={k.status === "AVAILABLE" ? "DISABLED" : "AVAILABLE"} />
                          <button
                            type="submit"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded border transition-[background-color,transform] active:scale-95 ${
                              k.status === "AVAILABLE"
                                ? "text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/20"
                                : "text-brand-ink-2 bg-white/5 hover:bg-white/10 border-white/10"
                            }`}
                          >
                            {k.status === "AVAILABLE" ? <><Ban size={12} /> Disable</> : <><RotateCcw size={12} /> Enable</>}
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-brand-ink-3 font-mono">
        Defaults: title “{FREE_PANEL_DEFAULTS.title}” · assignment is atomic (one key per claim, never reused) · when
        Available hits 0 the public offer shows “FREE PANEL CURRENTLY ENDED” and reactivates automatically after a new import.
      </p>
    </div>
  );
}
