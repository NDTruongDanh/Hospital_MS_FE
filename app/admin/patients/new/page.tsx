"use client";

import { useRouter } from "next/navigation";
import { useCreatePatient } from "@/hooks/queries/usePatient";
import { PatientForm, PatientFormValues } from "../_components";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserPlus } from "lucide-react";
import Link from "next/link";

export default function NewPatientPage() {
  const router = useRouter();
  const { mutate: createPatient, isPending } = useCreatePatient();

  const handleSubmit = (data: PatientFormValues) => {
    createPatient(
      {
        fullName: data.fullName,
        email: data.email || undefined,
        phoneNumber: data.phoneNumber,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: data.gender,
        address: data.address || undefined,
        identificationNumber: data.identificationNumber || undefined,
        healthInsuranceNumber: data.healthInsuranceNumber || undefined,
        bloodType: data.bloodType,
        allergies: data.allergies && data.allergies.length ? data.allergies.join(", ") : undefined,
        relativeFullName: data.relativeFullName || undefined,
        relativePhoneNumber: data.relativePhoneNumber || undefined,
        relativeRelationship: data.relativeRelationship,
      },
      {
        onSuccess: () => {
          router.push("/admin/patients");
        },
      }
    );
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/patients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <UserPlus className="h-6 w-6" />
            New Patient
          </h1>
          <p className="text-muted-foreground">
            Register a new patient in the system
          </p>
        </div>
      </div>

      {/* Form */}
      <PatientForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={isPending}
      />
    </div>
  );
}
