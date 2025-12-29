"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  Filter,
  Download,
  Mail,
  Phone,
  Building2,
  User,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { hrService } from "@/services/hr.service";
import { Employee, EmployeeRequest, EmployeeRole, EmployeeStatus } from "@/interfaces/hr";
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

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  // Fetch data
  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, [searchQuery, roleFilter, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await hrService.getEmployees({
        search: searchQuery || undefined,
        position: roleFilter || undefined,
        departmentId: departmentFilter || undefined,
      });
      setEmployees(response.content || []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await hrService.getDepartments();
      setDepartments(response.content || []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmployee) return;
    
    try {
      await hrService.deleteEmployee(deleteEmployee.id);
      toast.success("Đã xóa nhân viên thành công");
      setDeleteEmployee(null);
      fetchEmployees();
    } catch (error) {
      toast.error("Không thể xóa nhân viên");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
    fetchEmployees();
  };

  const roles = ["DOCTOR", "NURSE", "RECEPTIONIST", "ADMIN"];

  const getRoleBadge = (position: string) => {
    const badges: Record<string, string> = {
      DOCTOR: "badge-info",
      NURSE: "badge-success",
      RECEPTIONIST: "badge-warning",
      ADMIN: "badge-danger",
    };
    return badges[position] || "badge-info";
  };

  const getRoleLabel = (position: string) => {
    const labels: Record<string, string> = {
      DOCTOR: "Bác sĩ",
      NURSE: "Y tá",
      RECEPTIONIST: "Lễ tân",
      ADMIN: "Quản trị",
    };
    return labels[position] || position;
  };

  const handleExportExcel = () => {
    try {
      // Prepare data for export
      const exportData = employees.map(emp => ({
        "Họ và tên": emp.fullName,
        "ID": emp.id,
        "Số điện thoại": emp.phoneNumber || "-",
        "Phòng ban": emp.departmentName || "-",
        "Vị trí": getRoleLabel(emp.role || ""),
        "Trạng thái": emp.status === "ACTIVE" ? "Đang làm việc" : emp.status === "ON_LEAVE" ? "Nghỉ phép" : "Đã nghỉ việc",
        "Chuyên khoa": emp.specialization || "-",
        "Số chứng chỉ": emp.licenseNumber || "-",
        "Địa chỉ": emp.address || "-",
      }));

      // Create CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map(row => 
          headers.map(h => `"${(row as any)[h] || ""}"`).join(",")
        )
      ].join("\n");

      // Download
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `NhanVien_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Đã xuất file Excel thành công");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Không thể xuất file Excel");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý nhân viên</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {employees.length} nhân viên trong hệ thống
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary" onClick={() => setEditingEmployee(null)}>
              <Plus className="w-5 h-5" />
              Thêm nhân viên
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Chỉnh sửa nhân viên" : "Thêm nhân viên mới"}
              </DialogTitle>
            </DialogHeader>
            <EmployeeForm
              employee={editingEmployee}
              departments={departments}
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
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            className="dropdown min-w-[150px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vị trí</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {getRoleLabel(role)}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            className="dropdown min-w-[180px]"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>

          {/* Export */}
          <button onClick={handleExportExcel} className="btn-outline-icon">
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Liên hệ</th>
              <th>Phòng ban</th>
              <th>Vị trí</th>
              <th>Trạng thái</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    Chưa có nhân viên nào
                  </p>
                </td>
              </tr>
            ) : (
              employees.map((employee) => (
                <tr key={employee.id}>
                  {/* Employee Info */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        {employee.fullName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-small">ID: {employee.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        -
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                        {employee.phoneNumber || "-"}
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      {employee.departmentName || "-"}
                    </div>
                  </td>

                  {/* Position */}
                  <td>
                    <span className={`badge ${getRoleBadge(employee.role || "")}`}>
                      {getRoleLabel(employee.role || "")}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <span className={`badge ${
                      employee.status === "ACTIVE" 
                        ? "badge-success" 
                        : "badge-danger"
                    }`}>
                      {employee.status === "ACTIVE" ? "Đang làm" : "Nghỉ việc"}
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
                            setEditingEmployee(employee);
                            setIsFormOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteEmployee(employee)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteEmployee} onOpenChange={() => setDeleteEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa nhân viên</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa nhân viên "{deleteEmployee?.fullName}"?
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

// Employee Form Component
interface EmployeeFormProps {
  employee: Employee | null;
  departments: { id: string; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

function EmployeeForm({ employee, departments, onSuccess, onCancel }: EmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<EmployeeRequest>({
    accountId: employee?.accountId || "",
    fullName: employee?.fullName || "",
    role: employee?.role || "DOCTOR",
    departmentId: employee?.departmentId || "",
    specialization: employee?.specialization || "",
    licenseNumber: employee?.licenseNumber || "",
    phoneNumber: employee?.phoneNumber || "",
    address: employee?.address || "",
    status: employee?.status || "ACTIVE",
    hiredAt: employee?.hiredAt || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (employee) {
        await hrService.updateEmployee(employee.id, formData);
        toast.success("Đã cập nhật nhân viên thành công");
      } else {
        await hrService.createEmployee(formData);
        toast.success("Đã thêm nhân viên mới thành công");
      }
      onSuccess();
    } catch (error) {
      toast.error(employee ? "Không thể cập nhật nhân viên" : "Không thể thêm nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const roles: EmployeeRole[] = ["DOCTOR", "NURSE", "RECEPTIONIST", "ADMIN"];
  const statuses: EmployeeStatus[] = ["ACTIVE", "ON_LEAVE", "RESIGNED"];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Full Name */}
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <label className="text-label">Họ và tên *</label>
          <input
            type="text"
            className="input-base"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
          />
        </div>

        {/* Account ID */}
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <label className="text-label">Account ID</label>
          <input
            type="text"
            className="input-base"
            value={formData.accountId}
            onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
            placeholder="Tùy chọn"
          />
        </div>

        {/* Role */}
        <div className="space-y-2">
          <label className="text-label">Vai trò *</label>
          <select
            className="input-base"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as EmployeeRole })}
            required
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role === "DOCTOR" ? "Bác sĩ" : 
                 role === "NURSE" ? "Y tá" : 
                 role === "RECEPTIONIST" ? "Lễ tân" : "Quản trị"}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div className="space-y-2">
          <label className="text-label">Khoa *</label>
          <select
            className="input-base"
            value={formData.departmentId}
            onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
            required
          >
            <option value="">Chọn khoa</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Specialization */}
        <div className="space-y-2">
          <label className="text-label">Chuyên khoa</label>
          <input
            type="text"
            className="input-base"
            value={formData.specialization}
            onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            placeholder="VD: Tim mạch, Nội tiết"
          />
        </div>

        {/* License Number */}
        <div className="space-y-2">
          <label className="text-label">Số chứng chỉ hành nghề</label>
          <input
            type="text"
            className="input-base"
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            placeholder="XX-12345"
            pattern="^[A-Z]{2}-[0-9]{5}$"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Định dạng: 2 chữ cái viết hoa, dấu gạch ngang, 5 số (VD: BS-12345)</p>
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-label">Số điện thoại</label>
          <input
            type="tel"
            className="input-base"
            value={formData.phoneNumber}
            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
            placeholder="0123456789"
            pattern="^[0-9]{10,15}$"
          />
          <p className="text-xs text-[hsl(var(--muted-foreground))]">10-15 chữ số</p>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="text-label">Trạng thái *</label>
          <select
            className="input-base"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
            required
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status === "ACTIVE" ? "Đang làm việc" : 
                 status === "ON_LEAVE" ? "Nghỉ phép" : "Đã nghỉ việc"}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className="col-span-2 space-y-2">
          <label className="text-label">Địa chỉ</label>
          <input
            type="text"
            className="input-base"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        {/* Hired At */}
        <div className="col-span-2 sm:col-span-1 space-y-2">
          <label className="text-label">Ngày bắt đầu làm việc</label>
          <input
            type="date"
            className="input-base"
            value={formData.hiredAt}
            onChange={(e) => setFormData({ ...formData, hiredAt: e.target.value })}
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
          {employee ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}
