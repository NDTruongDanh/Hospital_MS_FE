"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  User,
  Shield,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Key,
  Eye,
  Phone,
  Briefcase,
  Calendar,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { authService, Account, AccountUpdateRequest } from "@/services/auth.service";
import { getPatientByAccountId } from "@/services/patient.service";
import { hrService } from "@/services/hr.service";
import { Patient } from "@/interfaces/patient";
import { Employee } from "@/interfaces/hr";
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

const ROLES = [
  { value: "ADMIN", label: "Quản trị viên", color: "badge-danger" },
  { value: "DOCTOR", label: "Bác sĩ", color: "badge-info" },
  { value: "NURSE", label: "Y tá", color: "badge-success" },
  { value: "RECEPTIONIST", label: "Lễ tân", color: "badge-warning" },
  { value: "PATIENT", label: "Bệnh nhân", color: "bg-gray-100 text-gray-700" },
];

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null);
  
  // Detail view states
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<Patient | Employee | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [searchQuery, roleFilter]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await authService.getAccounts(
        searchQuery || undefined,
        roleFilter || undefined
      );
      setAccounts(response.content || []);
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
      toast.error("Không thể tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteAccount) return;
    
    try {
      await authService.deleteAccount(deleteAccount.id);
      toast.success("Đã xóa tài khoản thành công");
      setDeleteAccount(null);
      fetchAccounts();
    } catch (error) {
      toast.error("Không thể xóa tài khoản");
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAccount(null);
    fetchAccounts();
  };

  const getRoleBadge = (role: string) => {
    const roleConfig = ROLES.find((r) => r.value === role);
    return {
      label: roleConfig?.label || role,
      class: roleConfig?.color || "badge-info",
    };
  };

  const handleViewAccount = async (account: Account) => {
    setViewingAccount(account);
    setOwnerInfo(null);
    setLoadingOwner(true);

    try {
      if (account.role === "PATIENT") {
        const patient = await getPatientByAccountId(account.id);
        setOwnerInfo(patient);
      } else if (["DOCTOR", "NURSE", "RECEPTIONIST", "ADMIN"].includes(account.role)) {
        const employee = await hrService.getEmployeeByAccountId(account.id);
        setOwnerInfo(employee);
      }
    } catch (error) {
      console.error("Failed to fetch owner info:", error);
    } finally {
      setLoadingOwner(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Quản lý tài khoản</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {accounts.length} tài khoản trong hệ thống
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <button className="btn-primary" onClick={() => setEditingAccount(null)}>
              <Plus className="w-5 h-5" />
              Tạo tài khoản
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? "Chỉnh sửa tài khoản" : "Tạo tài khoản mới"}
              </DialogTitle>
            </DialogHeader>
            <AccountForm
              account={editingAccount}
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
                placeholder="Tìm theo email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            className="dropdown min-w-[180px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Xác thực email</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : accounts.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    {searchQuery || roleFilter ? "Không tìm thấy tài khoản phù hợp" : "Chưa có tài khoản nào"}
                  </p>
                </td>
              </tr>
            ) : (
              accounts.map((account) => {
                const roleBadge = getRoleBadge(account.role);
                return (
                  <tr 
                    key={account.id}
                    onClick={() => handleViewAccount(account)}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    {/* Email */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          {account.email?.charAt(0).toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="font-medium">{account.email}</p>
                          <p className="text-small text-[hsl(var(--muted-foreground))]">
                            ID: {account.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td>
                      <span className={`badge ${roleBadge.class}`}>
                        <Shield className="w-3 h-3" />
                        {roleBadge.label}
                      </span>
                    </td>

                    {/* Email Verified */}
                    <td>
                      {account.emailVerified ? (
                        <span className="badge badge-success">
                          <CheckCircle className="w-3 h-3" />
                          Đã xác thực
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <XCircle className="w-3 h-3" />
                          Chưa xác thực
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="btn-icon w-8 h-8">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setEditingAccount(account);
                              setIsFormOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => setDeleteAccount(account)}
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
      <AlertDialog open={!!deleteAccount} onOpenChange={() => setDeleteAccount(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản "{deleteAccount?.email}"?
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

      {/* Account Detail Modal */}
      <Dialog open={!!viewingAccount} onOpenChange={() => setViewingAccount(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Chi tiết tài khoản
            </DialogTitle>
          </DialogHeader>
          {viewingAccount && (
            <div className="space-y-4">
              {/* Account Info Section */}
              <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Thông tin tài khoản</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="text-sm font-medium mt-1">{viewingAccount.email}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">ID tài khoản</label>
                    <p className="text-sm font-mono mt-1">{viewingAccount.id}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Vai trò</label>
                    <div className="mt-1">
                      <span className={`badge ${getRoleBadge(viewingAccount.role).class}`}>
                        <Shield className="w-3 h-3" />
                        {getRoleBadge(viewingAccount.role).label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Trạng thái email</label>
                    <div className="mt-1">
                      {viewingAccount.emailVerified ? (
                        <span className="badge badge-success">
                          <CheckCircle className="w-3 h-3" />
                          Đã xác thực
                        </span>
                      ) : (
                        <span className="badge badge-warning">
                          <XCircle className="w-3 h-3" />
                          Chưa xác thực
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Password note */}
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <Key className="w-4 h-4" />
                    <span className="text-sm font-medium">Mật khẩu</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Vì lý do bảo mật, mật khẩu không thể hiển thị. Sử dụng chức năng "Đặt lại mật khẩu" để thay đổi.
                  </p>
                </div>
              </div>

              {/* Owner Info Section */}
              <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Briefcase className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">
                    Thông tin chủ tài khoản ({viewingAccount.role === "PATIENT" ? "Bệnh nhân" : "Nhân viên"})
                  </h4>
                </div>
                
                {loadingOwner ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                  </div>
                ) : ownerInfo ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500">Họ và tên</label>
                      <p className="text-sm font-medium mt-1">{ownerInfo.fullName}</p>
                    </div>
                    {'phoneNumber' in ownerInfo && ownerInfo.phoneNumber && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Số điện thoại</label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {ownerInfo.phoneNumber}
                        </p>
                      </div>
                    )}
                    {'gender' in ownerInfo && ownerInfo.gender && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Giới tính</label>
                        <p className="text-sm mt-1">
                          {ownerInfo.gender === 'MALE' ? 'Nam' : ownerInfo.gender === 'FEMALE' ? 'Nữ' : 'Khác'}
                        </p>
                      </div>
                    )}
                    {'dateOfBirth' in ownerInfo && ownerInfo.dateOfBirth && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Ngày sinh</label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(ownerInfo.dateOfBirth).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    )}
                    {'address' in ownerInfo && ownerInfo.address && (
                      <div className="col-span-2">
                        <label className="text-xs font-medium text-gray-500">Địa chỉ</label>
                        <p className="text-sm mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {ownerInfo.address}
                        </p>
                      </div>
                    )}
                    {/* Employee-specific fields */}
                    {'role' in ownerInfo && 'departmentName' in ownerInfo && (
                      <>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Chức vụ</label>
                          <p className="text-sm mt-1">{getRoleBadge((ownerInfo as Employee).role).label}</p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-gray-500">Phòng ban</label>
                          <p className="text-sm mt-1">{(ownerInfo as Employee).departmentName || '-'}</p>
                        </div>
                      </>
                    )}
                    {/* Patient-specific fields */}
                    {'bloodType' in ownerInfo && ownerInfo.bloodType && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Nhóm máu</label>
                        <p className="text-sm mt-1">{ownerInfo.bloodType}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Chưa có thông tin chủ tài khoản được liên kết
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setViewingAccount(null);
                    setEditingAccount(viewingAccount);
                    setIsFormOpen(true);
                  }}
                  className="btn-secondary"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => setViewingAccount(null)}
                  className="btn-primary"
                >
                  Đóng
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Account Form Component
interface AccountFormProps {
  account: Account | null;
  onSuccess: () => void;
  onCancel: () => void;
}

function AccountForm({ account, onSuccess, onCancel }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: account?.email || "",
    password: "",
    role: account?.role || "PATIENT",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (account) {
        // Update - send email and role, only add password if provided
        // Match OLD-Frontend behavior exactly
        const updateData: AccountUpdateRequest = { 
          email: formData.email,
          role: formData.role as AccountUpdateRequest['role']
        };
        // Only add password if it's not empty (like OLD-Frontend account-form.tsx line 68-73)
        if (formData.password) {
          updateData.password = formData.password;
        }
        
        await authService.updateAccount(account.id, updateData);
        toast.success("Đã cập nhật tài khoản thành công");
      } else {
        // Create new
        if (!formData.password) {
          toast.error("Vui lòng nhập mật khẩu");
          setLoading(false);
          return;
        }
        await authService.createAccount({
          email: formData.email,
          password: formData.password,
          role: formData.role as any,
        });
        toast.success("Đã tạo tài khoản mới thành công");
      }
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || (account ? "Không thể cập nhật tài khoản" : "Không thể tạo tài khoản"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <label className="text-label">Email *</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="email"
            className="input-base pl-10"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label className="text-label">
          Mật khẩu {account ? "(để trống nếu không thay đổi)" : "*"}
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type={showPassword ? "text" : "password"}
            className="input-base pl-10 pr-20"
            placeholder={account ? "••••••••" : "Nhập mật khẩu"}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required={!account}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--primary))]"
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>

      {/* Role */}
      <div className="space-y-2">
        <label className="text-label">Vai trò *</label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <select
            className="input-base pl-10"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Description */}
      <div className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
        <p className="text-small">
          {formData.role === "ADMIN" && "Quản trị viên có toàn quyền truy cập hệ thống."}
          {formData.role === "DOCTOR" && "Bác sĩ có thể xem/khám bệnh nhân, kê đơn thuốc."}
          {formData.role === "NURSE" && "Y tá hỗ trợ bác sĩ, quản lý xét nghiệm."}
          {formData.role === "RECEPTIONIST" && "Lễ tân quản lý lịch hẹn, tiếp nhận bệnh nhân."}
          {formData.role === "PATIENT" && "Bệnh nhân có thể đặt lịch và xem hồ sơ cá nhân."}
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Hủy
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {account ? "Cập nhật" : "Tạo tài khoản"}
        </button>
      </div>
    </form>
  );
}
