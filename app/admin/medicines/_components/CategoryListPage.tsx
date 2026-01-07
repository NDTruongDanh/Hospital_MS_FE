"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  MoreHorizontal,
  Search,
  Tag,
  Edit,
  Trash2,
  Loader2,
  FolderOpen,
  Grid3X3,
  List,
  Pill,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/queries/useCategory";
import { Category, CategoryRequest } from "@/interfaces/category";
import { CategoryForm } from "./CategoryForm";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Random colors for categories
const categoryColors = [
  { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-700", icon: "bg-teal-500" },
  { bg: "bg-violet-100", border: "border-violet-300", text: "text-violet-700", icon: "bg-violet-500" },
  { bg: "bg-amber-100", border: "border-amber-300", text: "text-amber-700", icon: "bg-amber-500" },
  { bg: "bg-sky-100", border: "border-sky-300", text: "text-sky-700", icon: "bg-sky-500" },
  { bg: "bg-rose-100", border: "border-rose-300", text: "text-rose-700", icon: "bg-rose-500" },
  { bg: "bg-emerald-100", border: "border-emerald-300", text: "text-emerald-700", icon: "bg-emerald-500" },
];

const getColorByIndex = (index: number) => categoryColors[index % categoryColors.length];

export function CategoryListPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"card" | "list">("card");

  const { data: categoriesData, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = categoriesData?.content ?? [];

  const filteredCategories = useMemo(() => {
    if (!search) return categories;
    const searchLower = search.toLowerCase();
    return categories.filter((cat: Category) =>
      cat.name.toLowerCase().includes(searchLower) ||
      (cat.description && cat.description.toLowerCase().includes(searchLower))
    );
  }, [categories, search]);

  const handleFormSubmit = (values: CategoryRequest) => {
    if (selectedCategory) {
      updateCategory.mutate(
        { id: selectedCategory.id, data: values },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật danh mục thành công!");
            setIsFormOpen(false);
            setSelectedCategory(null);
          },
          onError: () => toast.error("Không thể cập nhật danh mục."),
        }
      );
    } else {
      createCategory.mutate(values, {
        onSuccess: () => {
          toast.success("Đã tạo danh mục mới!");
          setIsFormOpen(false);
        },
        onError: () => toast.error("Không thể tạo danh mục."),
      });
    }
  };

  const openForm = (category: Category | null = null) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const openDeleteConfirm = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCategory) {
      deleteCategory.mutate(selectedCategory.id, {
        onSuccess: () => {
          toast.success("Đã xóa danh mục!");
          setIsDeleteConfirmOpen(false);
          setSelectedCategory(null);
        },
        onError: () => toast.error("Không thể xóa danh mục có thuốc."),
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
              <Tag className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                Danh mục thuốc
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {categories.length} danh mục
                </Badge>
              </h1>
              <p className="mt-1 text-amber-100">
                Quản lý các danh mục phân loại thuốc
              </p>
            </div>
          </div>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-white text-amber-700 hover:bg-white/90"
                onClick={() => openForm(null)}
              >
                <Plus className="mr-2 h-4 w-4" /> Thêm danh mục
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedCategory ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
                </DialogTitle>
              </DialogHeader>
              <CategoryForm
                initialData={selectedCategory || undefined}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
                isLoading={createCategory.isPending || updateCategory.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Tag className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{categories.length}</p>
                <p className="text-xs text-muted-foreground">Tổng danh mục</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
              <Input
                placeholder="Tìm kiếm danh mục..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-10 rounded-xl pl-9 border-2"
              />
            </div>

            <div className="ml-auto flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <Button
                variant={viewMode === "card" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("card")}
                className={cn("rounded-lg px-3", viewMode === "card" && "bg-amber-600 hover:bg-amber-700")}
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Cards
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className={cn("rounded-lg px-3", viewMode === "list" && "bg-amber-600 hover:bg-amber-700")}
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories Grid/List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-2 border-slate-200">
              <CardContent className="pt-6">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "card" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category: Category, index: number) => {
            const color = getColorByIndex(index);
            return (
              <Card
                key={category.id}
                className={cn(
                  "border-2 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden",
                  color.border
                )}
              >
                {/* Top gradient bar */}
                <div className={cn("h-1.5", color.icon)} />

                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", color.bg)}>
                        <Tag className={cn("h-5 w-5", color.text)} />
                      </div>
                      <div>
                        <h3 className={cn("font-semibold", color.text)}>
                          {category.name}
                        </h3>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openForm(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => openDeleteConfirm(category)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {category.description || "Không có mô tả"}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {filteredCategories.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Không tìm thấy danh mục nào</p>
            </div>
          )}
        </div>
      ) : (
        /* LIST VIEW */
        <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Tên danh mục</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="w-[100px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category: Category, index: number) => {
                const color = getColorByIndex(index);
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div className={cn("p-2 rounded-lg w-fit", color.bg)}>
                        <Tag className={cn("h-4 w-4", color.text)} />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {category.description || "Không có mô tả"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openForm(category)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteConfirm(category)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredCategories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    Không tìm thấy danh mục nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa danh mục "{selectedCategory?.name}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCategory.isPending}
            >
              {deleteCategory.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
