"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Download, Key, Link as LinkIcon, LogOut, ShieldCheck, HelpCircle } from "lucide-react";
import Link from "next/link";
import { PackageResource } from "@prisma/client";

import { customerLogout } from "@/app/actions";

interface DashboardClientProps {
  identifier: string;
  packageName: string;
  resources: PackageResource[];
  platformType: string;
}

export function DashboardClient({ identifier, packageName, resources, platformType }: DashboardClientProps) {
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const mainFile = resources.find(r => r.name === 'MAIN FILE');
  const filePassword = resources.find(r => r.name === 'FILE PASSWORD');
  
  const tutorials = resources.filter(r => r.name.includes('TUTORIAL'));
  
  const otherResources = resources.filter(r => 
    r.name !== 'MAIN FILE' && 
    r.name !== 'FILE PASSWORD' && 
    !r.name.includes('TUTORIAL')
  );

  const handleCopy = () => {
    if (filePassword?.secret) {
      navigator.clipboard.writeText(filePassword.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 md:py-24 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-16">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-mono font-bold text-foreground tracking-widest">MK PANEL ZONE</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild className="text-brand-ink-3 hover:text-foreground">
            <Link href="/support"><HelpCircle size={16} className="mr-2" /> SUPPORT</Link>
          </Button>
          <form action={customerLogout}>
            <Button type="submit" variant="outline" className="gap-2 text-brand-red-500 hover:text-red-400 hover:border-brand-red-500/50">
              <LogOut size={16} /> LOG OUT
            </Button>
          </form>
        </div>
      </div>

      {/* Intro Section */}
      <div className="mb-12">
        <p className="text-brand-blue-500 uppercase tracking-widest text-[13px] font-bold mb-2">Private Customer Portal</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">YOUR DIGITAL ACCESS</h1>
        <p className="text-brand-ink-3 max-w-2xl mb-8 text-[17px] leading-relaxed">
          Everything included in your package, organized in one place.
        </p>
        
        <div className="flex flex-wrap items-center gap-4 bg-background/40 border border-border-subtle p-4 rounded-xl max-w-md backdrop-blur-md shadow-[0_0_15px_rgba(47,95,208,0.05)]">
          <div className="w-12 h-12 rounded-full bg-brand-blue-500/10 border border-brand-blue-500/20 flex items-center justify-center">
            <ShieldCheck className="text-brand-blue-500" size={24} />
          </div>
          <div>
            <p className="text-sm font-bold text-brand-ink-3">Customer</p>
            <p className="font-extrabold text-foreground text-lg tracking-wide">{identifier}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1 bg-foreground/10 text-foreground text-[10px] font-bold rounded-full border border-border-subtle tracking-widest uppercase">
              {platformType}
            </span>
            <span className="px-3 py-1 bg-brand-blue-500/10 text-brand-blue-500 text-[10px] font-bold rounded-full border border-brand-blue-500/20 tracking-widest shadow-[0_0_10px_rgba(47,95,208,0.2)]">
              ACTIVE
            </span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="flex flex-col gap-6">
        
        {/* Row 1: Main File (2/3) + File Password (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <GlassCard className="lg:col-span-2 flex flex-col justify-between group hover:border-brand-blue-500/30 transition-all duration-obsidian">
            <div className="flex items-start justify-between mb-8">
              <div>
                <p className="text-brand-blue-500 text-[11px] font-bold tracking-widest uppercase mb-2">Primary Resource</p>
                <h3 className="text-2xl font-extrabold text-foreground mb-2 tracking-tight">MAIN FILE</h3>
                <p className="text-brand-ink-3 text-[15px]">Ready to download. Always check for the latest version.</p>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-foreground/5 border border-border-subtle flex items-center justify-center group-hover:bg-brand-blue-500/10 group-hover:border-brand-blue-500/30 transition-colors duration-obsidian">
                <Download size={28} className="text-brand-ink-2 group-hover:text-brand-blue-500 transition-colors duration-obsidian" />
              </div>
            </div>
            
            {mainFile?.url ? (
              <Button asChild variant="primary" className="w-full sm:w-auto">
                <Link href={mainFile.url} target="_blank">
                  DOWNLOAD FILE <Download size={16} className="ml-2" />
                </Link>
              </Button>
            ) : (
              <Button disabled variant="outline" className="w-full sm:w-auto opacity-50">
                Currently unavailable
              </Button>
            )}
          </GlassCard>

          <GlassCard className="lg:col-span-1 flex flex-col justify-between">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Key size={20} className="text-brand-red-500 drop-shadow-[0_0_8px_var(--color-brand-red-500)]" />
                <h3 className="text-xl font-extrabold tracking-tight text-foreground">FILE PASSWORD</h3>
              </div>
              <p className="text-brand-ink-3 text-[14px] mb-6">Required to extract the main file archive.</p>
              
              {filePassword?.secret ? (
                <div className="p-4 bg-background/60 border border-border-subtle rounded-xl font-mono text-center flex items-center justify-center relative overflow-hidden group">
                  <span className={`text-brand-red-500 font-bold tracking-widest transition-all duration-obsidian ${showPassword ? 'blur-none opacity-100 drop-shadow-[0_0_5px_var(--color-brand-red-500)]' : 'blur-[6px] opacity-60'}`}>
                    {showPassword ? filePassword.secret : '••••••••••••••••'}
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-background/40 border border-border-subtle rounded-xl text-center">
                  <span className="text-brand-ink-3 text-sm italic font-medium">Currently unavailable</span>
                </div>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 text-xs" 
                onClick={() => setShowPassword(!showPassword)}
                disabled={!filePassword?.secret}
              >
                {showPassword ? 'HIDE' : 'SHOW'}
              </Button>
              <Button 
                variant={copied ? "primary" : "outline"} 
                className={`flex-1 text-xs transition-all duration-300 ${copied ? 'bg-green-500/20 text-green-400 border-green-500/50' : ''}`}
                onClick={handleCopy}
                disabled={!filePassword?.secret}
              >
                {copied ? 'COPIED!' : 'COPY'}
              </Button>
            </div>
          </GlassCard>
        </div>

        {/* Row 2: Additional Resources (Utilities, Tools, etc.) */}
        {otherResources.length > 0 && (
          <div>
            <h3 className="text-[15px] font-extrabold tracking-widest text-foreground mb-6 mt-6 uppercase">Additional Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherResources.map((res, idx) => (
                <GlassCard key={idx} className="flex flex-col justify-between group hover:border-border-subtle transition-all duration-obsidian">
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-extrabold tracking-tight text-foreground mb-2 uppercase">{res.name}</h3>
                      <p className="text-brand-ink-3 text-[14px]">Required utility for {platformType.toLowerCase()} access.</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center text-brand-ink-2 group-hover:text-foreground transition-colors">
                      {res.type === 'LINK' ? <LinkIcon size={20} /> : <Download size={20} />}
                    </div>
                  </div>
                  {res.url ? (
                    <Button asChild variant="glass" className="w-full">
                      <Link href={res.url} target="_blank">
                        {res.type === 'LINK' ? 'OPEN LINK' : 'DOWNLOAD'} {res.type === 'LINK' ? <LinkIcon size={16} className="ml-2" /> : <Download size={16} className="ml-2" />}
                      </Link>
                    </Button>
                  ) : res.secret ? (
                    <div className="p-3 bg-background/60 border border-border-subtle rounded-lg font-mono text-center relative overflow-hidden group">
                      <span className="text-brand-red-500 font-bold tracking-widest">{res.secret}</span>
                    </div>
                  ) : (
                    <Button disabled variant="outline" className="w-full opacity-50">Currently unavailable</Button>
                  )}
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Row 3: Tutorials */}
        {tutorials.length > 0 && (
          <div>
            <h3 className="text-[15px] font-extrabold tracking-widest text-foreground mb-6 mt-6 uppercase">Tutorials & Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tutorials.map((tutorial, idx) => (
                <Link 
                  key={idx}
                  href={tutorial.url || "#"} 
                  target={tutorial.url ? "_blank" : undefined}
                  className={`block ${!tutorial.url ? 'pointer-events-none' : ''}`}
                >
                  <GlassCard className="h-full flex items-center p-6 hover:bg-foreground/[0.04] transition-all duration-obsidian border-border-subtle hover:border-brand-blue-500/30 group">
                    <div className="flex-1">
                      <p className="text-[14px] font-bold tracking-wide text-foreground group-hover:text-brand-blue-500 transition-colors">
                        {tutorial.name.replace(' TUTORIAL', '')}
                      </p>
                      <p className="text-[12px] font-medium tracking-wide text-brand-ink-3 mt-1">Video Guide</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-foreground/5 flex items-center justify-center text-brand-ink-2 group-hover:bg-brand-blue-500/10 group-hover:text-brand-blue-500 transition-colors duration-obsidian">
                      <LinkIcon size={16} />
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
