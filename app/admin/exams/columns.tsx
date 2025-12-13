"use client";

import { Column } from "@/app/admin/_components/MyTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MedicalExam } from "@/interfaces/medical-exam";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import Link from "next/link";

export const medicalExamColumns: Column<MedicalExam>[] = [
  { key: "id", label: "ID" },
  { key: "patientName", label: "Patient" },
  { key: "doctorName", label: "Doctor" },
  { key: "diagnosis", label: "Diagnosis" },
  {
    key: "examDate",
    label: "Date",
    render: (row) => new Date(row.examDate).toLocaleDateString(),
  },
  {
    key: "action",
    label: "Actions",
    render: (exam) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/admin/exams/${exam.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          {exam.status !== "FINALIZED" && (
            <DropdownMenuItem asChild>
              <Link href={`/admin/exams/${exam.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];
