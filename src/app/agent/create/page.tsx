import { CreateCustomerForm } from "./CreateCustomerForm";
import { UserPlus } from "lucide-react";
import { listActivePlatforms } from "@/lib/platforms";

export const metadata = {
  title: "Create Customer | Agent Panel",
};

export default async function AgentCreateCustomerPage() {
  const platforms = await listActivePlatforms();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight uppercase mb-2">Create Customer</h1>
        <p className="text-brand-ink-3">Register a new customer and upload payment proof.</p>
      </div>

      <div className="p-1 rounded-2xl bg-gradient-to-b from-white/5 to-transparent">
        <div className="bg-background/50 backdrop-blur-xl border border-border-subtle p-6 md:p-8 rounded-xl shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-brand-blue-500/10 text-brand-blue-500 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Customer Details</h2>
          </div>
          
          <CreateCustomerForm platforms={platforms.map((p) => ({ code: p.code, name: p.name }))} />
        </div>
      </div>
    </div>
  );
}
