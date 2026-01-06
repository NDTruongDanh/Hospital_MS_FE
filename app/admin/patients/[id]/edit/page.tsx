"use client";

import { useParams, useRouter } from "next/navigation";
import { usePatient, useUpdatePatient } from "@/hooks/queries/usePatient";
import { PatientForm, PatientFormValues } from "../../_components";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Edit, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditPatientPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { data: patient, isLoading, error } = usePatient(patientId);
  const { mutate: updatePatient, isPending } = useUpdatePatient(patientId);

  const handleSubmit = (data: PatientFormValues) => {
    if (!patient) return;

    const allergyString =
      data.allergies && data.allergies.length
        ? data.allergies.join(", ")
        : null;

    // PUT requires full object with all required fields (fullName, dateOfBirth, gender)
    // For @Pattern validated optional fields, use undefined to exclude from request when empty
    const payload = {
      fullName: data.fullName,
      email: data.email?.trim() || null, // Send null to clear/skip if empty. Trim whitespace.
      phoneNumber: data.phoneNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      address: data.address || null,
      identificationNumber: data.identificationNumber || null,
      healthInsuranceNumber: data.healthInsuranceNumber || null,
      bloodType: data.bloodType || null,
      allergies: allergyString || null,
      relativeFullName: data.relativeFullName || null,
      relativePhoneNumber: data.relativePhoneNumber || null,
      relativeRelationship: data.relativeRelationship || null,
      accountId: data.accountId || patient.accountId || null,
    };

    console.log("Submitting Update Payload:", payload);

    updatePatient(payload, {
      onSuccess: () => {
        router.push(`/admin/patients/${patientId}`);
      },
    });
  };

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/patients">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Edit Patient</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-medium">Patient not found</h3>
          <p className="text-muted-foreground mb-4">
            The patient you are trying to edit does not exist or has been
            deleted.
          </p>
          <Button asChild>
            <Link href="/admin/patients">Back to Patients</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/patients/${patientId}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Edit Patient
          </h1>
          <p className="text-muted-foreground">
            Update information for {patient.fullName}
          </p>
        </div>
      </div>

      {/* Form */}
      <PatientForm
        initialData={patient}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isPending}
      />
    </div>
  );
}
