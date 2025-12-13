"use client";

import { Prescription } from "@/interfaces/medical-exam";
import { UserRole } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Pill } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

interface PrescriptionDetailViewProps {
  prescription: Prescription;
  userRole?: UserRole;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
};

export function PrescriptionDetailView({
  prescription,
  userRole,
}: PrescriptionDetailViewProps) {
  const router = useRouter();
  const isStaff =
    userRole === "ADMIN" || userRole === "DOCTOR" || userRole === "NURSE";

  const totalCost = prescription.items.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0
  );

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Header Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <Button variant="outline">
          <Printer className="h-4 w-4 mr-2" /> Print
        </Button>
      </div>

      {/* Main Prescription Card */}
      <Card className="p-6">
        {/* Prescription Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2">
            <Pill className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">PRESCRIPTION</h1>
          </div>
          <p className="text-muted-foreground">#{prescription.id}</p>
        </div>

        {/* Patient/Doctor Info */}
        <div className="grid grid-cols-3 gap-4 mb-8 text-sm">
          <div>
            <p className="font-semibold">Patient:</p>
            <p className="text-muted-foreground">
              {prescription.patient.fullName}
            </p>
          </div>
          <div>
            <p className="font-semibold">Doctor:</p>
            <p className="text-muted-foreground">
              {prescription.doctor.fullName}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">Date:</p>
            <p className="text-muted-foreground">
              {format(new Date(prescription.prescribedAt), "PPP")}
            </p>
          </div>
        </div>

        {/* Prescribed Medicines */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Prescribed Medicines</h2>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[5%]">#</TableHead>
                  <TableHead>Medicine</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescription.items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.medicine.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.instructions || "No specific instructions"}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell>{item.dosage}</TableCell>
                    <TableCell>
                      {item.durationDays ? `${item.durationDays} days` : "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* General Notes */}
        {prescription.notes && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">General Notes</h3>
            <p className="text-muted-foreground text-sm p-4 border rounded-md bg-stone-50">
              {prescription.notes}
            </p>
          </div>
        )}

        {/* Cost Summary (Staff only) */}
        {isStaff && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold">Cost Summary</h3>
            <Card className="bg-slate-50">
              <CardContent className="p-4 space-y-2 text-sm">
                {prescription.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.medicine.name} ({item.quantity} x{" "}
                      {formatCurrency(item.unitPrice)})
                    </span>
                    <span>
                      {formatCurrency(item.quantity * item.unitPrice)}
                    </span>
                  </div>
                ))}
                <div className="border-t my-2"></div>
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>{formatCurrency(totalCost)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audit Info */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>
            Prescribed on {format(new Date(prescription.createdAt), "PPPp")} by{" "}
            {prescription.doctor.fullName}
          </p>
        </div>
      </Card>
    </div>
  );
}
