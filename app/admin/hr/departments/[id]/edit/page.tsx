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
import { toast } from "sonner";
import DepartmentForm from "../../_components/DepartmentForm";
import { DepartmentRequest } from "@/interfaces/hr";
import { useDepartment, useUpdateDepartment } from "@/hooks/queries/useHr";
import { Spinner } from "@/components/ui/spinner";

export default function DepartmentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data: department, isLoading, error } = useDepartment(id);
  const updateDepartment = useUpdateDepartment();

  const handleSubmit = async (values: DepartmentRequest) => {
    try {
      await updateDepartment.mutateAsync({ id, ...values });
      toast.success("Department updated successfully.");
      router.push("/admin/hr/departments");
    } catch (error) {
      console.error("Failed to update department:", error);
      toast.error("Failed to update department. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner className="text-muted-foreground" />
      </div>
    );
  }

  if (error || !department) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Department not found</CardTitle>
          <CardDescription>
            The department you are looking for does not exist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push("/admin/hr/departments")}>
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
            Edit Department
          </h1>
          <p className="text-muted-foreground">
            Update department information.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Modify fields and save</CardDescription>
        </CardHeader>
        <CardContent>
          <DepartmentForm
            initialData={department}
            onSubmit={handleSubmit}
            isLoading={updateDepartment.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
