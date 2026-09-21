"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SuccessAutoRedirect() {
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Only run this once on mount
    if (hasRedirected.current) return;
    hasRedirected.current = true;

    try {
      const pendingUrl = sessionStorage.getItem("pendingWhatsAppRedirect");
      if (pendingUrl) {
        setRedirectUrl(pendingUrl);
        // Clear it so it doesn't trigger on refresh
        sessionStorage.removeItem("pendingWhatsAppRedirect");
        
        // Auto redirect after a short delay so they see the success page briefly
        setIsRedirecting(true);
        setTimeout(() => {
          window.location.assign(pendingUrl);
        }, 2000);
      }
    } catch (err) {
      console.error("Failed to read sessionStorage", err);
    }
  }, []);

  if (!redirectUrl) {
    return null; // Don't render anything if there's no redirect
  }

  return (
    <div className="mt-6 mb-8 p-6 bg-brand-blue-500/10 border border-brand-blue-500/30 rounded-xl">
      <h3 className="text-lg font-bold text-foreground mb-2 tracking-wide flex items-center justify-center gap-2">
        {isRedirecting && <Loader2 className="w-5 h-5 animate-spin text-brand-blue-500" />}
        Connecting to WhatsApp...
      </h3>
      <p className="text-sm text-brand-ink-3 mb-6 font-medium">
        We are forwarding your order details directly to our team on WhatsApp.
      </p>
      
      <Button 
        variant="primary" 
        size="lg" 
        onClick={() => window.location.assign(redirectUrl)}
        className="w-full sm:w-auto"
      >
        OPEN WHATSAPP NOW
      </Button>
      
      <p className="text-xs text-brand-ink-4 mt-4 mt-4 flex items-center justify-center gap-1">
        If nothing happens automatically, click the button above.
      </p>
    </div>
  );
}
