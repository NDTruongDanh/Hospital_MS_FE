"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Pill,
  LayoutGrid,
  List,
  X,
  AlertTriangle,
} from "lucide-react";
import { useMedicines, useDeleteMedicine } from "@/hooks/queries/useMedicine";
import { useCategories } from "@/hooks/queries/useCategory"; // Use useCategories for list
import { useDebounce } from "@/hooks/useDebounce";
import { MedicineCard } from "./medicine-card";
import { Medicine, MedicineListParams } from "@/interfaces/medicine";
import { format, isBefore } from "date-fns";
import { Spinner } from "@/components/ui/spinner";

export function MedicineListPage() {
  const [view, setView] = useState<"table" | "grid">("table");
  const [params, setParams] = useState<MedicineListParams>({
    page: 1,
    size: 10,
    search: "",
    categoryId: undefined,
  });
  const [searchInput, setSearchInput] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const { data, isLoading } = useMedicines({
    ...params,
    search: debouncedSearch,
  });
  const { data: categoriesData } = useCategories(); // Fetch list of categories
  const categories = categoriesData?.data?.content || [];
  const { mutate: deleteMedicine, isPending: isDeleting } = useDeleteMedicine();

  const medicines = data?.content ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalElements = data?.totalElements ?? 0;

  const handleCategoryChange = useCallback((value: string) => {
    setParams((prev) => ({
      ...prev,
      categoryId: value === "all" ? undefined : value,
      page: 1,
    }));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      deleteMedicine(id, {
        onSuccess: () => setDeleteId(null),
      });
    },
    [deleteMedicine]
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setParams({ page: 1, size: 10, search: "", categoryId: undefined });
  }, []);

  const hasActiveFilters = searchInput || params.categoryId;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price);
  };

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy");
    } catch {
      return date;
    }
  };

  const isExpired = (date: string) => {
    return isBefore(new Date(date), new Date());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight">All Medicines</h2>
        <Button asChild>
          <Link href="/admin/medicines/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Medicine
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-10"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
                  onClick={() => setSearchInput("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Select
                value={params.categoryId || "all"}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger className="h-10 w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 px-3 text-muted-foreground"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}

              <div className="flex border rounded-lg">
                <Button
                  variant={view === "table" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-r-none"
                  onClick={() => setView("table")}
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={view === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  className="h-10 w-10 rounded-l-none"
                  onClick={() => setView("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" className="text-muted-foreground" />
            </div>
          ) : medicines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Pill className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No medicines found</h3>
              <p className="text-muted-foreground mb-4">
                {hasActiveFilters
                  ? "Try adjusting your filters"
                  : "Get started by adding a medicine"}
              </p>
              {!hasActiveFilters && (
                <Button asChild>
                  <Link href="/admin/medicines/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Medicine
                  </Link>
                </Button>
              )}
            </div>
          ) : view === "table" ? (
            <div className="overflow-hidden rounded-b-xl border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Selling Price</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicines.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell>
                        <Link
                          href={`/admin/medicines/${medicine.id}`}
                          className="font-medium hover:underline"
                        >
                          {medicine.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {medicine.categoryName || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            medicine.quantity <= 10
                              ? "text-amber-600 font-medium"
                              : ""
                          }
                        >
                          {medicine.quantity}
                        </span>{" "}
                        <span className="text-muted-foreground text-sm">
                          {medicine.unit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(medicine.sellingPrice)} ₫
                      </TableCell>
                      <TableCell>
                        <span
                          className={
                            isExpired(medicine.expiresAt)
                              ? "text-destructive"
                              : ""
                          }
                        >
                          {formatDate(medicine.expiresAt)}
                        </span>
                        {isExpired(medicine.expiresAt) && (
                          <AlertTriangle className="h-3 w-3 inline ml-1 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/medicines/${medicine.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/medicines/${medicine.id}/edit`}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteId(medicine.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {medicines.map((medicine) => (
                <MedicineCard
                  key={medicine.id}
                  medicine={medicine}
                  onDelete={() => setDeleteId(medicine.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {medicines.length > 0 && (
        <Card>
          <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
            <p className="text-sm text-muted-foreground">
              Showing {medicines.length} of {totalElements} medicines
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={params.page === 1}
                onClick={() =>
                  setParams((prev) => ({ ...prev, page: prev.page! - 1 }))
                }
              >
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {params.page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={params.page === totalPages}
                onClick={() =>
                  setParams((prev) => ({ ...prev, page: prev.page! + 1 }))
                }
              >
                Next
              </Button>
              <Select
                value={String(params.size)}
                onValueChange={(value) =>
                  setParams((prev) => ({
                    ...prev,
                    size: Number(value),
                    page: 1,
                  }))
                }
              >
                <SelectTrigger className="h-9 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Medicine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this medicine? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => deleteId && handleDelete(deleteId)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
