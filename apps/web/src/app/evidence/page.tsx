"use client";

import { useState, useRef } from "react";
import { Search, Upload, FileText, Link2, Archive } from "lucide-react";
import { useEvidence, useUploadEvidence } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/layout/empty-state";
import { SkeletonCard } from "@/components/layout/skeleton";

export default function EvidenceVaultPage() {
  const [search, setSearch] = useState("");
  const { data: evidence, isLoading } = useEvidence("", search);
  const uploadEvidence = useUploadEvidence();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadEvidence.mutateAsync(file);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Archive}
        title="Evidence Vault"
        description={`${evidence?.length ?? 0} evidence files`}
        actions={
          <>
            <Button
              size="sm"
              variant="cta"
              onClick={() => fileRef.current?.click()}
              disabled={uploadEvidence.isPending}
            >
              <Upload className="h-4 w-4 mr-1" />
              {uploadEvidence.isPending ? "Uploading..." : "Upload Evidence"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf,.docx"
              className="hidden"
              onChange={handleUpload}
            />
          </>
        }
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search evidence..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-[13px]"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : evidence?.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="No evidence uploaded yet"
          description="Upload PNG, JPG, PDF, or DOCX files to build your evidence library."
          action={
            <Button size="sm" variant="cta" onClick={() => fileRef.current?.click()}>
              <Upload className="h-4 w-4 mr-1" /> Upload Evidence
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence?.map((ev) => (
            <Card key={ev.id} className="group hover:shadow-card-hover">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy/6 shrink-0 group-hover:bg-navy/10 transition-colors">
                    <FileText className="h-4 w-4 text-navy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground truncate">
                      {ev.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                      {ev.filetype}
                    </p>
                  </div>
                </div>
                {ev.extracted_text && (
                  <p className="text-[12px] text-muted-foreground line-clamp-3 leading-relaxed">
                    {ev.extracted_text.slice(0, 200)}
                  </p>
                )}
                {(ev.linked_controls.length > 0 || ev.linked_soc2_targets.length > 0) && (
                  <div className="flex flex-wrap gap-1 pt-1 border-t">
                    {ev.linked_controls.map((cid) => (
                      <span key={cid} className="inline-flex rounded-md bg-navy/6 px-1.5 py-0.5 text-[10px] font-medium text-navy">
                        {cid}
                      </span>
                    ))}
                    {ev.linked_soc2_targets.length > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                        <Link2 className="h-2.5 w-2.5" />
                        SOC 2
                      </span>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
