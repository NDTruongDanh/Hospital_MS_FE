"use client";

import { useState } from "react";
import { ReusableTable } from "@/app/admin/_components/MyTable";
import { Input } from "@/components/ui/input";
import {
  useInvoiceList,
  usePaymentSummaryCards,
  useCancelInvoice,
} from "@/hooks/queries/useBilling";
import { getInvoiceColumns } from "./columns";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  FileText,
  AlertCircle,
  Clock,
  Wallet,
  X,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CancelInvoiceDialog } from "@/app/admin/billing/_components/cancel-invoice-dialog";
import { Invoice } from "@/interfaces/billing";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

export default function InvoiceListPage() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [sort, setSort] = useState("invoiceDate,desc");
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading } = useInvoiceList({
    page,
    size: limit,
    search: debouncedSearch || undefined,
    status: status === "ALL" ? undefined : status,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    sort,
  });

  const { data: summary, isLoading: summaryLoading } = usePaymentSummaryCards();

  const clearFilters = () => {
    setSearch("");
    setStatus("ALL");
    setStartDate(undefined);
    setEndDate(undefined);
    setPage(0);
  };

  const hasFilters = search || status !== "ALL" || startDate || endDate;

  const router = useRouter();
  const { mutateAsync: cancelInvoiceMutation, isPending: isCanceling } =
    useCancelInvoice();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedInvoiceToCancel, setSelectedInvoiceToCancel] =
    useState<Invoice | null>(null);

  const handleOpenCancelDialog = (invoice: Invoice) => {
    setSelectedInvoiceToCancel(invoice);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async (reason: string) => {
    if (!selectedInvoiceToCancel) return;
    await cancelInvoiceMutation({
      id: selectedInvoiceToCancel.id,
      reason,
    });
    setCancelDialogOpen(false);
    setSelectedInvoiceToCancel(null);
  };

  const handleCancelClose = () => {
    setCancelDialogOpen(false);
    setSelectedInvoiceToCancel(null);
  };

  const columns = getInvoiceColumns({
    onViewDetails: (invoice) => router.push(`/admin/billing/${invoice.id}`),
    onRecordPayment: (invoice) =>
      router.push(`/admin/billing/${invoice.id}/payment`),
    onCancelInvoice: handleOpenCancelDialog,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Billing & Invoices
        </h1>
        <Button asChild variant="outline">
          <Link href="/admin/billing/payments">
            <CreditCard className="mr-2 h-4 w-4" />
            Payment History
          </Link>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today&apos;s Collections
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading
                ? "..."
                : formatCurrency(summary?.todayAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.todayCount || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              This Week&apos;s Collections
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {summaryLoading
                ? "..."
                : formatCurrency(summary?.thisWeekAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.thisWeekCount || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Payments</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {summaryLoading
                ? "..."
                : formatCurrency(summary?.cashAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.cashPercentage?.toFixed(1) || 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card Payments</CardTitle>
            <Wallet className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryLoading
                ? "..."
                : formatCurrency(summary?.cardAmount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.cardPercentage?.toFixed(1) || 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by patient name or invoice ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="UNPAID">Unpaid</SelectItem>
            <SelectItem value="PARTIALLY_PAID">Partially Paid</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="OVERDUE">Overdue</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="invoiceDate,desc">Date (newest)</SelectItem>
            <SelectItem value="invoiceDate,asc">Date (oldest)</SelectItem>
            <SelectItem value="totalAmount,desc">
              Total Amount (high to low)
            </SelectItem>
            <SelectItem value="status,asc">Status (A-Z)</SelectItem>
          </SelectContent>
        </Select>

        {/* Start Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[150px] justify-start text-left font-normal",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* End Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[150px] justify-start text-left font-normal",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={setEndDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <ReusableTable
        data={data?.content ?? []}
        columns={columns}
        loading={isLoading}
        pagination={{
          currentPage: (data?.page ?? 0) + 1,
          totalPages: data?.totalPages ?? 1,
          rowsPerPage: limit,
          totalItems: data?.totalElements ?? 0,
        }}
        onPageChange={setPage}
        onRowsPerPageChange={(size) => {
          setLimit(size);
          setPage(0);
        }}
      />

      <CancelInvoiceDialog
        open={cancelDialogOpen}
        onOpenChange={handleCancelClose}
        invoiceNumber={selectedInvoiceToCancel?.invoiceNumber ?? ""}
        onConfirm={handleCancelConfirm}
        isLoading={isCanceling}
      />
    </div>
  );
}
