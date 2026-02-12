"use client";

import { useState, useRef } from "react";
import { Search, Upload, FileText, Link2 } from "lucide-react";
import { useEvidence, useUploadEvidence } from "@/hooks/use-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Evidence Vault</h1>
          <p className="text-sm text-muted-foreground">
            {evidence?.length ?? 0} evidence files
          </p>
        </div>
        <div>
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
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search evidence by filename or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading evidence...</p>
      ) : evidence?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No evidence uploaded yet. Upload PNG, JPG, PDF, or DOCX files.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {evidence?.map((ev) => (
            <Card key={ev.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start gap-2">
                  <FileText className="h-5 w-5 text-navy shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <CardTitle className="text-sm truncate">
                      {ev.filename}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ev.filetype}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {ev.extracted_text && (
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {ev.extracted_text.slice(0, 200)}
                  </p>
                )}
                <div className="flex flex-wrap gap-1">
                  {ev.linked_controls.map((cid) => (
                    <Badge key={cid} variant="secondary" className="text-[10px]">
                      {cid}
                    </Badge>
                  ))}
                </div>
                {ev.linked_soc2_targets.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Link2 className="h-3 w-3" />
                    SOC 2: {ev.linked_soc2_targets.join(", ")}
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
