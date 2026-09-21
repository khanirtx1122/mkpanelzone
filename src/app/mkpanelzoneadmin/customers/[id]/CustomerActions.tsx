"use client";

import { useTransition, useState } from "react";
import { adminUpdateCustomerStatus, adminResetCustomerDevice, adminSetCustomerPassword, adminChangeCustomerPlatform } from "@/app/mkpanelzoneadmin/actions";
import { ShieldAlert, ShieldCheck, Trash2, KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";

export function CustomerActions({ 
  customerId, 
  currentStatus,
  deviceCount,
  currentPlatform,
  currentPackageId,
  packages
}: { 
  customerId: string; 
  currentStatus: string;
  deviceCount: number;
  currentPlatform: string;
  currentPackageId: string;
  packages: any[];
}) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleToggleStatus = () => {
    startTransition(async () => {
      const newStatus = currentStatus === "active" ? "disabled" : "active";
      const result = await adminUpdateCustomerStatus(customerId, newStatus);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage(`Status updated to ${newStatus}`);
        router.refresh();
      }
    });
  };

  const handleResetDevice = () => {
    if (!confirm("Are you sure you want to reset this customer's device binding? They will be able to login on a new device.")) return;
    
    startTransition(async () => {
      const result = await adminResetCustomerDevice(customerId);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Device binding reset successfully.");
        router.refresh();
      }
    });
  };

  const handleResetPassword = () => {
    const newPassword = prompt("Enter new password for this customer:");
    if (!newPassword) return;

    startTransition(async () => {
      const result = await adminSetCustomerPassword(customerId, newPassword);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Password updated successfully.");
      }
    });
  };

  const [platform, setPlatform] = useState(currentPlatform);
  const [packageId, setPackageId] = useState(currentPackageId);

  const handleUpdatePlatform = () => {
    startTransition(async () => {
      const result = await adminChangeCustomerPlatform(customerId, platform, packageId);
      if (result.error) {
        setMessage(result.error);
      } else {
        setMessage("Platform and package updated successfully.");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="p-6 border border-white/10 rounded-2xl bg-white/5 space-y-6">
        <h2 className="text-sm font-bold text-brand-ink-3 uppercase tracking-widest border-b border-white/5 pb-3">Management Actions</h2>
        
        {message && (
          <div className="p-3 bg-brand-blue-500/10 border border-brand-blue-500/20 text-brand-blue-400 rounded-lg text-sm font-bold">
            {message}
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <p className="font-bold text-white mb-1">Account Status</p>
              <p className="text-xs text-brand-ink-3">Enable or disable access to the platform</p>
            </div>
            <button
              onClick={handleToggleStatus}
              disabled={isPending}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                currentStatus === "active" 
                  ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                  : "bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20"
              }`}
            >
              {currentStatus === "active" ? (
                <><ShieldAlert size={16} /> Disable Account</>
              ) : (
                <><ShieldCheck size={16} /> Enable Account</>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <p className="font-bold text-white mb-1">Device Bindings ({deviceCount})</p>
              <p className="text-xs text-brand-ink-3">Clear registered hardware IDs</p>
            </div>
            <button
              onClick={handleResetDevice}
              disabled={isPending || deviceCount === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 font-bold text-sm hover:bg-orange-500/20 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} /> Reset Device
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
            <div>
              <p className="font-bold text-white mb-1">Force Password Reset</p>
              <p className="text-xs text-brand-ink-3">Override customer credentials</p>
            </div>
            <button
              onClick={handleResetPassword}
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-blue-500/10 text-brand-blue-500 border border-brand-blue-500/20 font-bold text-sm hover:bg-brand-blue-500/20 transition-colors"
            >
              <KeyRound size={16} /> Reset Password
            </button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5 gap-4">
            <div>
              <p className="font-bold text-white mb-1">Platform & Package</p>
              <p className="text-xs text-brand-ink-3">Change assigned platform and package</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={platform}
                onChange={(e) => {
                  setPlatform(e.target.value);
                  setPackageId("");
                }}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              >
                <option value="ANDROID" className="bg-black text-white">Android</option>
                <option value="IOS" className="bg-black text-white">iOS</option>
                <option value="PC" className="bg-black text-white">PC</option>
              </select>
              
              <select
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-brand-blue-500/50"
              >
                <option value="" className="bg-black text-white">None</option>
                {packages.filter(pkg => pkg.platformType === platform).map(pkg => (
                  <option key={pkg.id} value={pkg.id} className="bg-black text-white">{pkg.name}</option>
                ))}
              </select>

              <button
                onClick={handleUpdatePlatform}
                disabled={isPending || (platform === currentPlatform && packageId === currentPackageId)}
                className="px-4 py-2 rounded-lg bg-brand-blue-500/10 text-brand-blue-500 border border-brand-blue-500/20 font-bold text-sm hover:bg-brand-blue-500/20 transition-colors disabled:opacity-50"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
