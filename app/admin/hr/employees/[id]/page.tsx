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
import { useEmployee } from "@/hooks/queries/useHr";
import { Spinner } from "@/components/ui/spinner";

export default function EmployeeViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: employee, isLoading, error } = useEmployee(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee not found</CardTitle>
          <CardDescription>
            The employee you are looking for does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/admin/hr/employees")}>
            Back to list
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Employee Details
          </h1>
          <p className="text-muted-foreground">View-only employee profile.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/hr/employees")}
          >
            Back
          </Button>
          <Button onClick={() => router.push(`/admin/hr/employees/${id}/edit`)}>
            Edit
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{employee.fullName}</CardTitle>
            <CardDescription>{employee.email}</CardDescription>
          </div>
          <Badge variant="secondary" className="capitalize">
            {employee.role.toLowerCase().replace(/_/g, " ")}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Department</p>
            <p className="font-medium">
              {employee.departmentName || "N/A"}{" "}
              {employee.departmentId ? (
                <Badge variant="outline" className="ml-1">
                  {employee.departmentId}
                </Badge>
              ) : null}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline" className="uppercase">
              {employee.status}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-medium">{employee.phoneNumber || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Address</p>
            <p className="font-medium">{employee.address || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Specialization</p>
            <p className="font-medium">{employee.specialization || "N/A"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">License Number</p>
            <p className="font-medium">{employee.licenseNumber || "N/A"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
