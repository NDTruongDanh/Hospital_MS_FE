"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import EmployeeForm from "../../_components/EmployeeForm";
import { EmployeeRequest } from "@/interfaces/hr";
import { useEmployee, useUpdateEmployee } from "@/hooks/queries/useHr";
import { Spinner } from "@/components/ui/spinner";

export default function EmployeeEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: employee, isLoading, error } = useEmployee(id);
  const updateEmployee = useUpdateEmployee();

  const handleSubmit = async (values: EmployeeRequest) => {
    updateEmployee.mutate(
      { id, ...values },
      {
        onSuccess: () => router.push("/admin/hr/employees"),
        onError: () => alert("Failed to update employee. Please try again."),
      }
    );
  };

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
    <div className="w-full space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Edit Employee
          </h1>
          <p className="text-muted-foreground">Update staff profile.</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Modify fields and save</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeForm
            initialData={employee}
            onSubmit={handleSubmit}
            isLoading={updateEmployee.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
