"use client";

import { Column } from "@/app/admin/_components/MyTable";
import { Invoice } from "@/interfaces/billing";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, CreditCard, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { InvoiceStatusBadge } from "./_components/invoice-status-badge";

interface InvoiceColumnActions {
  onViewDetails: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onCancelInvoice: (invoice: Invoice) => void;
}

export const getInvoiceColumns = ({
  onViewDetails,
  onRecordPayment,
  onCancelInvoice,
}: InvoiceColumnActions): Column<Invoice>[] => [
  {
    key: "invoiceNumber",
    label: "Invoice #",
  },
  {
    key: "patientName",
    label: "Patient",
  },
  {
    key: "invoiceDate",
    label: "Date",
    render: (row) => {
      return new Date(row.invoiceDate).toLocaleDateString();
    },
  },
  {
    key: "totalAmount",
    label: "Total",
    render: (row) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(row.totalAmount);
    },
  },
  {
    key: "paidAmount",
    label: "Paid",
    render: (row) => {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(row.paidAmount);
    },
  },
  {
    key: "balance",
    label: "Balance",
    render: (row) => {
      return (
        <span
          className={
            row.balance > 0 ? "text-red-500 font-medium" : "text-green-500"
          }
        >
          {new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
          }).format(row.balance)}
        </span>
      );
    },
  },
  {
    key: "status",
    label: "Status",
    render: (row) => {
      return <InvoiceStatusBadge status={row.status} />;
    },
  },
  {
    key: "actions",
    label: "Actions",
    render: (row) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onViewDetails(row)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            {row.status !== "PAID" && row.status !== "CANCELLED" && (
              <DropdownMenuItem onClick={() => onRecordPayment(row)}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </DropdownMenuItem>
            )}
            {row.status === "UNPAID" && (row.payments?.length ?? 0) === 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onCancelInvoice(row)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancel Invoice
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
