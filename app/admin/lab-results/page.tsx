"use client";

import { FileText } from "lucide-react";
import { LabResultsList } from "@/components/lab/LabResultsList";

export default function AdminLabResultsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <h1>
          <FileText className="h-6 w-6 text-teal-500" />
          Lab Results Management
        </h1>
        <p>View and manage all lab results in the system</p>
      </div>

      <LabResultsList basePath="/admin/lab-results" showPatientColumn={true} />
    </div>
  );
}
