"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useCreatePrescription,
  useUpdatePrescription,
  useMedicalExam,
} from "@/hooks/queries/useMedicalExam";
import { PrescriptionForm } from "../../_components/prescription-form";
import { PrescriptionFormValues } from "@/lib/schemas/medical-exam";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

export default function ManagePrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: exam, isLoading } = useMedicalExam(id);
  const { mutateAsync: createPrescription, isPending: isCreating } =
    useCreatePrescription();
  const { mutateAsync: updatePrescription, isPending: isUpdating } =
    useUpdatePrescription();

  const isEditing = !!exam?.prescription;

  const onSubmit = async (data: PrescriptionFormValues) => {
    const payload = {
      items: data.items.map((item) => ({
        medicineId: item.medicineId,
        quantity: item.quantity,
        dosage: item.dosage,
        duration: item.duration,
        notes: item.notes,
      })),
      notes: data.notes,
    };

    try {
      if (isEditing) {
        await updatePrescription({ examId: id, data: payload });
        toast.success("Prescription updated successfully");
      } else {
        await createPrescription({ examId: id, data: payload });
        toast.success("Prescription created successfully");
      }
      router.push(`/admin/exams/${id}`);
    } catch (error) {
      // The hook's onError will show the toast
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">
          Loading exam details...
        </span>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <p className="text-muted-foreground">Medical Exam not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const defaultValues = exam.prescription
    ? {
        ...exam.prescription,
        items: exam.prescription.items.map((item) => ({
          ...item,
          medicineId: item.medicineId.toString(),
        })),
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Manage Prescription" : "Create Prescription"}
          </h1>
          <p className="text-muted-foreground">For Exam ID: {exam.id}</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Prescription Details</CardTitle>
          <CardDescription>
            {isEditing
              ? "Edit the medicines on this prescription."
              : "Add medicines to the prescription."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PrescriptionForm
            onSubmit={onSubmit}
            isSubmitting={isCreating || isUpdating}
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
