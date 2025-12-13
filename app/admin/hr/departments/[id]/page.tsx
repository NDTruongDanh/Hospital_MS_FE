"use client";

import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDepartment } from "@/hooks/queries/useHr";
import { DepartmentStatusBadge } from "../../_components/department-status-badge";
import { Spinner } from "@/components/ui/spinner";

export default function DepartmentViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: department, isLoading, error } = useDepartment(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Department not found</CardTitle>
            <CardDescription>
              The department you are looking for does not exist.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={() => router.push("/admin/hr/departments")}>
              Back to list
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Department Details
          </h1>
          <p className="text-muted-foreground">
            View-only page, use Edit to update information.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/hr/departments")}
          >
            Back
          </Button>
          <Button
            onClick={() => router.push(`/admin/hr/departments/${id}/edit`)}
          >
            Edit
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{department.name}</CardTitle>
            <CardDescription>
              {department.description || "No description"}
            </CardDescription>
          </div>
          <DepartmentStatusBadge status={department.status} />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-medium">{department.location || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{department.phoneExtension || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Head Doctor</p>
            <p className="font-medium">
              {department.headDoctorName ? (
                <>
                  {department.headDoctorName}{" "}
                  <Badge variant="outline" className="ml-1">
                    {department.headDoctorId}
                  </Badge>
                </>
              ) : (
                "None"
              )}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">ID</p>
            <p className="font-mono text-sm">{department.id}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
