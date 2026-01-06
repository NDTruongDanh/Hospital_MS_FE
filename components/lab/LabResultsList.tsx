"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import {
  FileText,
  Search,
  Eye,
  ImagePlus,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterPills } from "@/components/ui/filter-pills";
import Link from "next/link";
import { useLabResults } from "@/hooks/queries/useLab";
import {
  LabTestResult,
  ResultStatus,
  LabTestCategory,
} from "@/services/lab.service";

const statusConfig: Record<
  ResultStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  PENDING: {
    label: "Pending",
    icon: Clock,
    color: "bg-yellow-100 text-yellow-800",
  },
  PROCESSING: {
    label: "Processing",
    icon: Clock,
    color: "bg-blue-100 text-blue-800",
  },
  COMPLETED: {
    label: "Completed",
    icon: CheckCircle,
    color: "bg-green-100 text-green-800",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
  },
};

const categoryLabels: Record<LabTestCategory, string> = {
  LAB: "Lab Test",
  IMAGING: "Imaging",
  PATHOLOGY: "Pathology",
};

interface LabResultsListProps {
  basePath: string; // "/admin/lab-results" or "/doctor/lab-results"
  patientId?: string;
  showPatientColumn?: boolean;
}

export function LabResultsList({
  basePath,
  patientId,
  showPatientColumn = true,
}: LabResultsListProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ResultStatus | "ALL">("ALL");

  const { data, isLoading } = useLabResults({ page: 0, size: 100 });
  const results: LabTestResult[] = data?.content || [];

  // Filter results
  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.patientName?.toLowerCase().includes(search.toLowerCase()) ||
      result.labTestName.toLowerCase().includes(search.toLowerCase()) ||
      result.labTestCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || result.status === statusFilter;
    const matchesPatient = !patientId || result.patientId === patientId;
    return matchesSearch && matchesStatus && matchesPatient;
  });

  // Stats for FilterPills
  const pendingCount = useMemo(
    () => results.filter((r) => r.status === "PENDING").length,
    [results]
  );
  const processingCount = useMemo(
    () => results.filter((r) => r.status === "PROCESSING").length,
    [results]
  );
  const completedCount = useMemo(
    () => results.filter((r) => r.status === "COMPLETED").length,
    [results]
  );
  const cancelledCount = useMemo(
    () => results.filter((r) => r.status === "CANCELLED").length,
    [results]
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "MM/dd/yyyy HH:mm", { locale: enUS });
  };

  return (
    <div className="space-y-6">
      {/* Quick Filter Pills */}
      <FilterPills
        filters={[
          { id: "ALL", label: "All", count: results.length },
          {
            id: "PENDING",
            label: "Pending",
            count: pendingCount,
            countColor: "warning",
          },
          {
            id: "PROCESSING",
            label: "Processing",
            count: processingCount,
            countColor: "warning",
          },
          {
            id: "COMPLETED",
            label: "Completed",
            count: completedCount,
            countColor: "success",
          },
          {
            id: "CANCELLED",
            label: "Cancelled",
            count: cancelledCount,
            countColor: cancelledCount > 0 ? "danger" : "default",
          },
        ]}
        activeFilter={statusFilter}
        onFilterChange={(id) => setStatusFilter(id as ResultStatus | "ALL")}
      />

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient name or test..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card className="border-2 border-slate-200 shadow-md rounded-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {showPatientColumn && <TableHead>Patient</TableHead>}
                <TableHead>Test Type</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
                <TableHead>Abnormal</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: showPatientColumn ? 9 : 8 }).map(
                      (_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      )
                    )}
                  </TableRow>
                ))
              ) : filteredResults.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showPatientColumn ? 9 : 8}
                    className="text-center py-12"
                  >
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      No lab results found
                    </h3>
                    <p className="text-muted-foreground">
                      {search || statusFilter !== "ALL"
                        ? "Try adjusting your filters"
                        : "Lab results will appear here when available"}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredResults.map((result) => {
                  const statusInfo = statusConfig[result.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={result.id}>
                      {showPatientColumn && (
                        <TableCell className="font-medium">
                          {result.patientName}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{result.labTestName}</span>
                          <span className="text-xs text-muted-foreground">
                            {categoryLabels[result.labTestCategory]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.labTestCode}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.resultValue || "-"}</TableCell>
                      <TableCell>
                        {result.isAbnormal ? (
                          <Badge variant="destructive">Abnormal</Badge>
                        ) : result.status === "COMPLETED" ? (
                          <Badge variant="secondary">Normal</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {result.images?.length > 0 ? (
                          <Badge variant="outline">
                            <ImagePlus className="h-3 w-3 mr-1" />
                            {result.images.length}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(result.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Link href={`${basePath}/${result.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
