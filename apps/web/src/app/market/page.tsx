"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        title="U.S. Market Snapshot"
        description="Key indices & economic context — Feb 2026"
      />

      {/* Indices */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: "S&P 500", ticker: "SPX", value: "6,051.97", change: "+0.36%", up: true },
          { name: "Dow Jones", ticker: "DJI", value: "44,556.04", change: "+0.28%", up: true },
          { name: "Nasdaq", ticker: "IXIC", value: "19,654.02", change: "+0.51%", up: true },
          { name: "Russell 2000", ticker: "RUT", value: "2,279.71", change: "-0.12%", up: false },
        ].map((idx) => (
          <Card key={idx.ticker} className="hover:shadow-card-hover">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{idx.ticker}</span>
                <span className={`text-[11px] font-bold ${idx.up ? "text-emerald-600" : "text-red-500"}`}>
                  {idx.change}
                </span>
              </div>
              <p className="text-xl font-bold text-navy tabular-nums">{idx.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{idx.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Economic Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { name: "10-Yr Treasury", value: "4.54%", detail: "Yield" },
          { name: "Fed Funds Rate", value: "4.25–4.50%", detail: "Target range" },
          { name: "CPI (YoY)", value: "2.9%", detail: "Jan 2025" },
          { name: "Unemployment", value: "4.0%", detail: "Jan 2025" },
        ].map((item) => (
          <Card key={item.name} className="border-dashed hover:shadow-card-hover">
            <CardContent className="p-4">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{item.detail}</p>
              <p className="text-xl font-bold text-navy tabular-nums mt-1">{item.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Commentary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-section-title text-navy">Economy &amp; GRC Impact</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-navy/[0.03] border border-navy/10 p-5 space-y-4">
            <p className="text-[13px] text-foreground leading-relaxed">
              <span className="font-semibold text-navy">Wait... what does the U.S. market have to do with a GRC platform?</span>{" "}
              Great question. On the surface — absolutely nothing. But here&apos;s the thing: a booming economy means more federal spending,
              more government contracts, and more organizations scrambling to get FedRAMP/GovRAMP authorized. That means more demand for
              compliance platforms like this one. When the Fed holds rates steady and unemployment stays low, companies invest in growth —
              and growth means new contracts that require security assessments, audit readiness, and (you guessed it) NIST 800-53 narratives.
            </p>
            <p className="text-[13px] text-muted-foreground leading-relaxed italic">
              Also, let&apos;s be real — I just like being able to see market updates in one spot without opening five tabs.
              So this section is purely for Nathan Philipos (creator of Project Atelier)&apos;s convenience. 😄
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
