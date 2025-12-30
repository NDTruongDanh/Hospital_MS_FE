"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Pill,
  Package,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getMedicines, createMedicine, updateMedicine, deleteMedicine as deleteMedicineApi } from "@/services/medicine.service";
import { categoryService } from "@/services/category.service";
import type { Medicine, CreateMedicineRequest, UpdateMedicineRequest } from "@/interfaces/medicine";
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

interface Category {
  id: string;
  name: string;
}

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<string>("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [deletingMedicine, setDeletingMedicine] = useState<Medicine | null>(null);

  useEffect(() => {
    fetchMedicines();
    fetchCategories();
  }, [searchQuery, categoryFilter, stockFilter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await getMedicines({
        search: searchQuery || undefined,
        categoryId: categoryFilter || undefined,
      });
      let data = response.content || [];
      
      // Apply stock filter (using quantity field)
      if (stockFilter === "low") {
        data = data.filter((m) => m.quantity <= 10);
      } else if (stockFilter === "out") {
        data = data.filter((m) => m.quantity === 0);
      }
      
      setMedicines(data);
    } catch (error) {
      console.error("Failed to fetch medicines:", error);
      toast.error("Không thể tải danh sách thuốc");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getList();
      setCategories(response?.content || []);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const handleDelete = async () => {
    if (!deletingMedicine) return;
    
    try {
      await deleteMedicineApi(deletingMedicine.id);
      toast.success("Đã xóa thuốc thành công");
      setDeletingMedicine(null);
      fetchMedicines();
    } catch (error) {
      toast.error("Không thể xóa thuốc");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingMedicine(null);
    fetchMedicines();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.quantity === 0) {
      return { label: "Hết hàng", class: "badge-danger" };
    }
    if (medicine.quantity <= 10) {
      return { label: "Sắp hết", class: "badge-warning" };
    }
    return { label: "Còn hàng", class: "badge-success" };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý thuốc</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {medicines.length} loại thuốc trong kho
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary" onClick={() => setEditingMedicine(null)}>
              <Plus className="w-5 h-5" />
              Thêm thuốc
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingMedicine ? "Chỉnh sửa thuốc" : "Thêm thuốc mới"}
              </DialogTitle>
            </DialogHeader>
            <MedicineForm
              medicine={editingMedicine}
              categories={categories}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="search-input w-full max-w-none">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm theo tên thuốc, hoạt chất..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Category Filter */}
          <select
            className="dropdown min-w-[180px]"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            className="dropdown min-w-[150px]"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
          >
            <option value="">Tất cả tồn kho</option>
            <option value="low">Sắp hết hàng</option>
            <option value="out">Đã hết hàng</option>
          </select>
        </div>
      </div>

      {/* Low Stock Alert */}
      {medicines.some((m) => m.quantity <= 10) && (
        <div className="alert-banner">
          <AlertTriangle className="w-5 h-5 text-[hsl(var(--warning))]" />
          <div className="flex-1">
            <p className="font-medium">Cảnh báo tồn kho</p>
            <p className="text-sm opacity-80">
              Có {medicines.filter((m) => m.quantity <= 10).length} loại thuốc sắp hết hoặc đã hết
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Tên thuốc</th>
              <th>Danh mục</th>
              <th>Đơn vị</th>
              <th>Giá bán</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : medicines.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Pill className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    {searchQuery || categoryFilter ? "Không tìm thấy thuốc phù hợp" : "Chưa có thuốc nào"}
                  </p>
                </td>
              </tr>
            ) : (
              medicines.map((medicine) => {
                const stockStatus = getStockStatus(medicine);
                return (
                  <tr key={medicine.id}>
                    {/* Name */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary-light))] flex items-center justify-center">
                          <Pill className="w-5 h-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                          <p className="font-medium">{medicine.name}</p>
                          {medicine.activeIngredient && (
                            <p className="text-small">{medicine.activeIngredient}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>{medicine.categoryName || "-"}</td>

                    {/* Unit */}
                    <td>{medicine.unit}</td>

                    {/* Price */}
                    <td className="font-medium">{formatCurrency(medicine.sellingPrice)}</td>

                    {/* Stock */}
                    <td>
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        {medicine.quantity}
                      </div>
                    </td>

                    {/* Status */}
                    <td>
                      <span className={`badge ${stockStatus.class}`}>
                        {stockStatus.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn-icon w-8 h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingMedicine(medicine);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeletingMedicine(medicine)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingMedicine} onOpenChange={() => setDeletingMedicine(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa thuốc</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa thuốc "{deletingMedicine?.name}"?
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Medicine Form Component
interface MedicineFormProps {
  medicine: Medicine | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

function MedicineForm({ medicine, categories, onSuccess, onCancel }: MedicineFormProps) {
  const [loading, setLoading] = useState(false);
  // Note: Backend also supports optional fields: concentration, manufacturer, sideEffects, storageConditions
  // These are not exposed in UI currently but can be added to this form if needed
  const [formData, setFormData] = useState<Partial<CreateMedicineRequest>>({
    name: medicine?.name || "",
    activeIngredient: medicine?.activeIngredient || "",
    categoryId: medicine?.categoryId || "",
    unit: medicine?.unit || "Viên",
    quantity: medicine?.quantity || 0,
    purchasePrice: medicine?.purchasePrice || 0,
    sellingPrice: medicine?.sellingPrice || 0,
    expiresAt: medicine?.expiresAt?.split("T")[0] || "",
    description: medicine?.description || "",
    packaging: medicine?.packaging || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        activeIngredient: formData.activeIngredient || undefined,
        unit: formData.unit,
        quantity: formData.quantity,
        purchasePrice: formData.purchasePrice,
        sellingPrice: formData.sellingPrice,
        // Convert date string (YYYY-MM-DD) to ISO timestamp for backend
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt + "T00:00:00Z").toISOString() : undefined,
        description: formData.description || undefined,
        packaging: formData.packaging || undefined,
        categoryId: formData.categoryId || undefined,
      };

      if (medicine) {
        await updateMedicine(medicine.id, payload as UpdateMedicineRequest);
        toast.success("Đã cập nhật thuốc thành công");
      } else {
        await createMedicine(payload as CreateMedicineRequest);
        toast.success("Đã thêm thuốc mới thành công");
      }
      onSuccess();
    } catch (error) {
      toast.error(medicine ? "Không thể cập nhật thuốc" : "Không thể thêm thuốc");
    } finally {
      setLoading(false);
    }
  };

  const units = ["Viên", "Vỉ", "Hộp", "Chai", "Ống", "Gói", "Tuýp", "Lọ"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Name */}
        <div className="col-span-2 space-y-2">
          <label className="text-label">Tên thuốc *</label>
          <input
            type="text"
            className="input-base"
            placeholder="Ví dụ: Paracetamol 500mg"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Active Ingredient */}
        <div className="space-y-2">
          <label className="text-label">Hoạt chất</label>
          <input
            type="text"
            className="input-base"
            placeholder="Ví dụ: Paracetamol"
            value={formData.activeIngredient}
            onChange={(e) => setFormData({ ...formData, activeIngredient: e.target.value })}
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-label">Danh mục</label>
          <select
            className="input-base"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Unit */}
        <div className="space-y-2">
          <label className="text-label">Đơn vị tính *</label>
          <select
            className="input-base"
            value={formData.unit}
            onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            required
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <label className="text-label">Số lượng tồn</label>
          <input
            type="number"
            className="input-base"
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
            min="0"
          />
        </div>

        {/* Purchase Price */}
        <div className="space-y-2">
          <label className="text-label">Giá mua (VNĐ)</label>
          <input
            type="number"
            className="input-base"
            value={formData.purchasePrice}
            onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
            min="0"
          />
        </div>

        {/* Selling Price */}
        <div className="space-y-2">
          <label className="text-label">Giá bán (VNĐ) *</label>
          <input
            type="number"
            className="input-base"
            value={formData.sellingPrice}
            onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
            required
            min="0"
          />
        </div>

        {/* Expires At */}
        <div className="space-y-2">
          <label className="text-label">Hạn sử dụng *</label>
          <input
            type="date"
            className="input-base"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            required
          />
        </div>

        {/* Packaging */}
        <div className="space-y-2">
          <label className="text-label">Quy cách đóng gói</label>
          <input
            type="text"
            className="input-base"
            placeholder="Ví dụ: Hộp 10 vỉ x 10 viên"
            value={formData.packaging}
            onChange={(e) => setFormData({ ...formData, packaging: e.target.value })}
          />
        </div>

        {/* Description */}
        <div className="col-span-2 space-y-2">
          <label className="text-label">Mô tả / Ghi chú</label>
          <textarea
            className="input-base min-h-[80px] resize-none"
            placeholder="Mô tả thuốc, cách sử dụng..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {medicine ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}
