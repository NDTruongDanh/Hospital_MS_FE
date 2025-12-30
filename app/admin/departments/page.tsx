"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Building2,
  Users,
  Loader2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { hrService } from "@/services/hr.service";
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

interface Department {
  id: string;
  name: string;
  description?: string;
  location?: string;
  phoneExtension?: string;
  headOfDepartment?: string;
  employeeCount?: number;
}

interface Employee {
  id: string;
  fullName: string;
  role: string;
  specialization?: string;
  phoneNumber?: string;
  status: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [deleteDepartment, setDeleteDepartment] = useState<Department | null>(null);
  const [viewingDepartment, setViewingDepartment] = useState<Department | null>(null);

  // Fetch data
  useEffect(() => {
    fetchDepartments();
  }, [searchQuery]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const [deptResponse, empResponse] = await Promise.all([
        hrService.getDepartments({ search: searchQuery }),
        hrService.getEmployees({ size: 1000 }), // Fetch all employees
      ]);
      
      setDepartments(deptResponse.content || []);
      
      // Store all employees
      const employees = empResponse.content || [];
      setAllEmployees(employees);
      
      // Calculate employee count per department
      const counts: Record<string, number> = {};
      employees.forEach((emp: any) => {
        if (emp.departmentId) {
          counts[emp.departmentId] = (counts[emp.departmentId] || 0) + 1;
        }
      });
      setEmployeeCounts(counts);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      toast.error("Không thể tải danh sách phòng ban");
    } finally {
      setLoading(false);
    }
  };

  // Get employees for a specific department
  const getEmployeesForDepartment = (departmentId: string) => {
    return allEmployees.filter((emp: any) => emp.departmentId === departmentId);
  };

  const handleDelete = async () => {
    if (!deleteDepartment) return;
    
    try {
      await hrService.deleteDepartment(deleteDepartment.id);
      toast.success("Đã xóa phòng ban thành công");
      setDeleteDepartment(null);
      fetchDepartments();
    } catch (error) {
      toast.error("Không thể xóa phòng ban");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingDepartment(null);
    fetchDepartments();
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý phòng ban</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {departments.length} phòng ban trong bệnh viện
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary" onClick={() => setEditingDepartment(null)}>
              <Plus className="w-5 h-5" />
              Thêm phòng ban
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingDepartment ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới"}
              </DialogTitle>
            </DialogHeader>
            <DepartmentForm
              department={editingDepartment}
              onSuccess={handleFormSuccess}
              onCancel={() => setIsFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="card-base">
        <div className="search-input w-full max-w-md">
          <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Tìm kiếm phòng ban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="card-base text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
          <p className="text-[hsl(var(--muted-foreground))] mt-2">
            {searchQuery ? "Không tìm thấy phòng ban phù hợp" : "Chưa có phòng ban nào"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDepartments.map((department) => (
            <div
              key={department.id}
              className="card-base group hover:border-[hsl(var(--primary))] transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary-light))] flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="btn-icon w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingDepartment(department);
                        setIsFormOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => setDeleteDepartment(department)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                {department.name}
              </h3>
              {department.description && (
                <p className="text-small text-[hsl(var(--muted-foreground))] mb-4 line-clamp-2">
                  {department.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 pt-4 border-t border-[hsl(var(--border))]">
                {department.location && (
                  <div className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))]">
                    <MapPin className="w-4 h-4" />
                    {department.location}
                  </div>
                )}
                <button 
                  onClick={() => setViewingDepartment(department)}
                  className="flex items-center gap-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary))] transition-colors cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  {employeeCounts[department.id] || 0} nhân viên
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Employees Modal */}
      <Dialog open={!!viewingDepartment} onOpenChange={() => setViewingDepartment(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Nhân viên trong {viewingDepartment?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {viewingDepartment && getEmployeesForDepartment(viewingDepartment.id).length === 0 ? (
              <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                <Users className="w-12 h-12 mx-auto opacity-50 mb-2" />
                <p>Chưa có nhân viên nào trong phòng ban này</p>
              </div>
            ) : (
              <div className="space-y-3">
                {viewingDepartment && getEmployeesForDepartment(viewingDepartment.id).map((emp: any) => (
                  <div 
                    key={emp.id}
                    className="flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-[hsl(var(--primary))] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary)/0.7)] flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {emp.fullName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{emp.fullName}</p>
                        <div className="flex items-center gap-2 text-sm mt-0.5">
                          <span className="font-medium text-[hsl(var(--primary))] capitalize">{emp.role?.toLowerCase()}</span>
                          {emp.specialization && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-gray-600">{emp.specialization}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      {emp.phoneNumber && (
                        <p className="text-sm font-medium text-gray-700">📞 {emp.phoneNumber}</p>
                      )}
                      <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${
                        emp.status === "ACTIVE" 
                          ? "bg-green-500 text-white" 
                          : "bg-gray-400 text-white"
                      }`}>
                        {emp.status === "ACTIVE" ? "✓ Đang làm" : emp.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDepartment} onOpenChange={() => setDeleteDepartment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phòng ban</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa phòng ban "{deleteDepartment?.name}"?
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

// Department Form Component
interface DepartmentFormProps {
  department: Department | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function DepartmentForm({ department, onSuccess, onCancel }: DepartmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: department?.name || "",
    description: department?.description || "",
    location: department?.location || "",
    phoneExtension: department?.phoneExtension || "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (department) {
        await hrService.updateDepartment(department.id, formData);
        toast.success("Đã cập nhật phòng ban thành công");
      } else {
        await hrService.createDepartment(formData);
        toast.success("Đã thêm phòng ban mới thành công");
      }
      onSuccess();
    } catch (error) {
      toast.error(department ? "Không thể cập nhật phòng ban" : "Không thể thêm phòng ban");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-label">Tên phòng ban *</label>
        <input
          type="text"
          className="input-base"
          placeholder="Ví dụ: Khoa Nội tổng quát"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-label">Mô tả</label>
        <textarea
          className="input-base min-h-[100px] resize-none"
          placeholder="Mô tả ngắn về phòng ban..."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      {/* Location */}
      <div className="space-y-2">
        <label className="text-label">Vị trí *</label>
        <input
          type="text"
          className="input-base"
          placeholder="Ví dụ: Tầng 3, Tòa A"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          required
        />
      </div>

      {/* Phone Extension */}
      <div className="space-y-2">
        <label className="text-label">Số nội bộ *</label>
        <input
          type="text"
          className="input-base"
          placeholder="Ví dụ: 101, 201"
          value={formData.phoneExtension}
          onChange={(e) => setFormData({ ...formData, phoneExtension: e.target.value })}
          required
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {department ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}
