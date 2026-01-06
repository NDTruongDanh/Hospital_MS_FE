"use client";

import { FileText } from "lucide-react";
import { LabResultsList } from "@/components/lab/LabResultsList";
import { ListPageHeader } from "@/components/ui/list-page-header";
import { useLabResults } from "@/hooks/queries/useLab";

export default function AdminLabResultsPage() {
  const { data } = useLabResults({ page: 0, size: 100 });
  const results = data?.content || [];
  const totalResults = results.length;
  const pendingCount = results.filter((r) => r.status === "PENDING").length;
  const completedCount = results.filter((r) => r.status === "COMPLETED").length;
  const abnormalCount = results.filter((r) => r.isAbnormal).length;

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <ListPageHeader
        title="Lab Results"
        description="View and manage all lab results in the system"
        theme="teal"
        icon={<FileText className="h-6 w-6 text-white" />}
        stats={[
          { label: "Total Results", value: totalResults },
          { label: "Pending", value: pendingCount },
          { label: "Completed", value: completedCount },
          { label: "Abnormal", value: abnormalCount },
        ]}
      />

      <LabResultsList basePath="/admin/lab-results" showPatientColumn={true} />
    </div>
  );
}
