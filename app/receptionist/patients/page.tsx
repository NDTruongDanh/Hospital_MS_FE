"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  User,
  Phone,
  Mail,
  MoreHorizontal,
  Eye,
  Calendar,
  Loader2,
  UserPlus,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { getPatients } from "@/services/patient.service";
import { Patient } from "@/interfaces/patient";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReceptionistPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingPatient, setViewingPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
  }, [searchQuery]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await getPatients({
        search: searchQuery || undefined,
      });
      setPatients(response.content || []);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      toast.error("Không thể tải danh sách bệnh nhân");
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dob?: string | null) => {
    if (!dob) return "-";
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Danh sách bệnh nhân</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {patients.length} bệnh nhân trong hệ thống
          </p>
        </div>
        <Link href="/receptionist/walk-in" className="btn-primary">
          <UserPlus className="w-5 h-5" />
          Tiếp nhận mới
        </Link>
      </div>

      {/* Search */}
      <div className="card-base">
        <div className="search-input w-full max-w-md">
          <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Tìm theo tên, SĐT, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table-base">
          <thead>
            <tr>
              <th>Bệnh nhân</th>
              <th>Liên hệ</th>
              <th>Tuổi / Giới tính</th>
              <th>Địa chỉ</th>
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
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <User className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    {searchQuery ? "Không tìm thấy bệnh nhân phù hợp" : "Chưa có bệnh nhân nào"}
                  </p>
                </td>
              </tr>
            ) : (
              patients.map((patient) => (
                <tr 
                  key={patient.id}
                  onClick={() => setViewingPatient(patient)}
                  className="cursor-pointer hover:bg-gray-50"
                >
                  {/* Patient Info */}
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        {patient.fullName?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-medium">{patient.fullName}</p>
                        <p className="text-small">ID: {patient.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td>
                    <div className="space-y-1">
                      {patient.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                          {patient.phoneNumber}
                        </div>
                      )}
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                          {patient.email}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Age/Gender */}
                  <td>
                    <p>{calculateAge(patient.dateOfBirth)} tuổi</p>
                    <p className="text-small">
                      {patient.gender === "MALE" ? "Nam" : patient.gender === "FEMALE" ? "Nữ" : "-"}
                    </p>
                  </td>

                  {/* Address */}
                  <td>
                    {patient.address ? (
                      <div className="flex items-center gap-1 text-sm max-w-[200px] truncate">
                        <MapPin className="w-4 h-4 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
                        {patient.address}
                      </div>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Status */}
                  <td>
                    <span className="badge badge-info">
                      Hồ sơ
                    </span>
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
                        <DropdownMenuItem asChild>
                          <Link href={`/receptionist/patients/${patient.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/receptionist/appointments/new?patientId=${patient.id}`}>
                            <Calendar className="w-4 h-4 mr-2" />
                            Đặt lịch hẹn
                          </Link>
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

      {/* Patient Detail Modal */}
      <Dialog open={!!viewingPatient} onOpenChange={() => setViewingPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Thông tin chi tiết bệnh nhân</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto pr-2" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {viewingPatient && (
            <div className="space-y-4">
              {/* Basic Info */}
              <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-900">Thông tin cơ bản</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Họ và tên</label>
                    <p className="text-sm font-medium mt-1">{viewingPatient.fullName}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Mã bệnh nhân</label>
                    <p className="text-sm font-mono mt-1">{viewingPatient.id}</p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Phone className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Liên hệ</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Số điện thoại</label>
                    <p className="text-sm mt-1">{viewingPatient.phoneNumber || "-"}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Email</label>
                    <p className="text-sm mt-1">{viewingPatient.email || "-"}</p>
                  </div>
                </div>
              </div>

              {/* Personal Info */}
              <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-purple-900">Thông tin cá nhân</h4>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500">Ngày sinh</label>
                    <p className="text-sm mt-1">
                      {viewingPatient.dateOfBirth 
                        ? new Date(viewingPatient.dateOfBirth).toLocaleDateString('vi-VN')
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Tuổi</label>
                    <p className="text-sm mt-1">{calculateAge(viewingPatient.dateOfBirth)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500">Giới tính</label>
                    <p className="text-sm mt-1">
                      {viewingPatient.gender === 'MALE' ? 'Nam' : 
                       viewingPatient.gender === 'FEMALE' ? 'Nữ' : '-'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium text-gray-500">Địa chỉ</label>
                  <p className="text-sm mt-1">{viewingPatient.address || "-"}</p>
                </div>
              </div>

              {/* Medical Info - if available */}
              {(viewingPatient.bloodType || viewingPatient.allergies || viewingPatient.healthInsuranceNumber) && (
                <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h4 className="font-semibold text-red-900">Thông tin y tế</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingPatient.bloodType && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Nhóm máu</label>
                        <p className="text-sm mt-1">{viewingPatient.bloodType}</p>
                      </div>
                    )}
                    {viewingPatient.healthInsuranceNumber && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Số BHYT</label>
                        <p className="text-sm mt-1">{viewingPatient.healthInsuranceNumber}</p>
                      </div>
                    )}
                  </div>
                  {viewingPatient.allergies && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Dị ứng</label>
                      <p className="text-sm mt-1">{viewingPatient.allergies}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Emergency Contact - if available */}
              {(viewingPatient.relativeFullName || viewingPatient.relativePhoneNumber) && (
                <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl shadow-sm p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="font-semibold text-amber-900">Người liên hệ khẩn cấp</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {viewingPatient.relativeFullName && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Họ tên</label>
                        <p className="text-sm mt-1">{viewingPatient.relativeFullName}</p>
                      </div>
                    )}
                    {viewingPatient.relativePhoneNumber && (
                      <div>
                        <label className="text-xs font-medium text-gray-500">Số điện thoại</label>
                        <p className="text-sm mt-1">{viewingPatient.relativePhoneNumber}</p>
                      </div>
                    )}
                  </div>
                  {viewingPatient.relativeRelationship && (
                    <div>
                      <label className="text-xs font-medium text-gray-500">Mối quan hệ</label>
                      <p className="text-sm mt-1">{viewingPatient.relativeRelationship}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          </div>
          
          {/* Action Buttons - Fixed at bottom */}
          {viewingPatient && (
            <div className="flex gap-3 pt-4 border-t mt-2">
                <Link 
                  href={`/receptionist/patients/${viewingPatient.id}`}
                  onClick={() => setViewingPatient(null)}
                  className="btn-primary flex-1"
                >
                  <Eye className="w-4 h-4" />
                  Xem hồ sơ đầy đủ
                </Link>
                <Link 
                  href={`/receptionist/appointments/new?patientId=${viewingPatient.id}`}
                  onClick={() => setViewingPatient(null)}
                  className="btn-secondary flex-1"
                >
                  <Calendar className="w-4 h-4" />
                  Đặt lịch hẹn
                </Link>
              </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
