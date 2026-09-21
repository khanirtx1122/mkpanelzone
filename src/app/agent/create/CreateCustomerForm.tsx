"use client";

import { useActionState, useEffect, useRef } from "react";
import { agentCreateCustomer } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { Upload, CheckCircle2 } from "lucide-react";

export function CreateCustomerForm() {
  const [state, formAction, pending] = useActionState<any, FormData>(agentCreateCustomer, null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      if (formRef.current) formRef.current.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Customer Identifier (Username)</label>
        <Input name="identifier" type="text" required placeholder="customer123" />
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Access Password</label>
        <Input name="password" type="text" required placeholder="Password for customer access" minLength={6} />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-bold text-brand-ink-2 mb-1">Platform</label>
        <select 
          name="platformType" 
          required 
          className="w-full bg-foreground/5 border border-border-subtle rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-brand-blue-500/50 transition-colors"
        >
          <option value="ANDROID">ANDROID</option>
          <option value="IOS">IPHONE (IOS)</option>
          <option value="PC">PC</option>
        </select>
        <p className="text-xs text-brand-ink-3">The default package for the selected platform will be automatically assigned.</p>
      </div>

      <div>
        <label className="block text-sm font-bold text-brand-ink-2 mb-2">Payment Proof (Screenshot)</label>
        <div className="relative group cursor-pointer border-2 border-dashed border-border-subtle rounded-xl p-6 text-center hover:border-brand-blue-500/50 transition-colors bg-foreground/5">
          <input 
            type="file" 
            name="paymentProof" 
            accept="image/*" 
            required 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-brand-blue-500/10 flex items-center justify-center text-brand-blue-500 group-hover:scale-110 transition-transform">
              <Upload size={20} />
            </div>
            <p className="text-sm font-bold text-foreground mt-2">Click or drag image to upload</p>
            <p className="text-xs text-brand-ink-3">JPEG, PNG up to 5MB</p>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-brand-red-500 text-sm">{state.error}</p>
      )}
      
      {state?.success && (
        <div className="flex items-center gap-2 text-green-500 bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
          <CheckCircle2 size={18} />
          <p className="text-sm font-bold">Customer created successfully.</p>
        </div>
      )}

      <Button type="submit" variant="primary" size="lg" className="w-full mt-4" disabled={pending}>
        {pending ? "CREATING CUSTOMER..." : "CREATE CUSTOMER"}
      </Button>
    </form>
  );
}
