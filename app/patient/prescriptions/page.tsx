"use client";

import { useState, useEffect } from "react";
import { 
  Search,
  Pill,
  Calendar,
  User,
  Eye,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import medicalExamService from "@/services/medical-exam.service";
import type { Prescription, PrescriptionStatus, PrescriptionItem } from "@/interfaces/medical-exam";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUS_CONFIG: Record<PrescriptionStatus, { label: string; class: string; icon: typeof Clock }> = {
  ACTIVE: { label: "Chờ lấy thuốc", class: "badge-warning", icon: Clock },
  DISPENSED: { label: "Đã lấy thuốc", class: "badge-success", icon: CheckCircle },
  CANCELLED: { label: "Đã hủy", class: "badge-danger", icon: XCircle },
};

export default function PatientPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // Get current patient's prescriptions via medical exams
      const response = await medicalExamService.getList({ size: 50 });
      const exams = response.content || [];
      // Extract prescriptions from exams that have them
      const rxList: Prescription[] = [];
      for (const exam of exams) {
        if (exam.hasPrescription && exam.prescription) {
          rxList.push(exam.prescription);
        }
      }
      setPrescriptions(rxList);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      toast.error("Không thể tải danh sách đơn thuốc");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const calculateTotal = (items: PrescriptionItem[]) => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = rx.doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (rx.notes?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !statusFilter || rx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-display">Đơn thuốc của tôi</h1>
        <p className="text-[hsl(var(--muted-foreground))] mt-1">
          Xem lịch sử đơn thuốc được kê
        </p>
      </div>

      {/* Filters */}
      <div className="card-base">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="search-input w-full max-w-none">
              <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text"
                placeholder="Tìm theo bác sĩ, ghi chú..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { value: "", label: "Tất cả" },
              { value: "ACTIVE", label: "Chờ lấy" },
              { value: "DISPENSED", label: "Đã lấy" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === f.value
                    ? "bg-[hsl(var(--primary))] text-white"
                    : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="card-base text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
            <p className="text-small mt-2">Đang tải...</p>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="card-base text-center py-12">
            <Pill className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] mt-2">
              Không có đơn thuốc nào
            </p>
          </div>
        ) : (
          filteredPrescriptions.map((rx) => {
            const status = STATUS_CONFIG[rx.status];
            const StatusIcon = status.icon;
            const totalAmount = calculateTotal(rx.items);
            
            return (
              <div key={rx.id} className="card-base">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(var(--primary-light))] flex items-center justify-center text-[hsl(var(--primary))]">
                      <Pill className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">{rx.notes || "Đơn thuốc"}</p>
                      <div className="flex items-center gap-4 mt-1 text-small">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(rx.prescribedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {rx.doctor.fullName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`badge ${status.class}`}>
                      <StatusIcon className="w-3 h-3" />
                      {status.label}
                    </span>
                    <span className="font-semibold text-lg">{rx.items.length} loại thuốc</span>
                    <button
                      onClick={() => setSelectedPrescription(rx)}
                      className="btn-secondary text-sm py-2"
                    >
                      <Eye className="w-4 h-4" />
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn thuốc</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
                <p className="font-semibold">{selectedPrescription.notes || "Đơn thuốc"}</p>
                <div className="flex gap-4 mt-2 text-small">
                  <span>{selectedPrescription.doctor.fullName}</span>
                  <span>{formatDate(selectedPrescription.prescribedAt)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-label">Danh sách thuốc</p>
                {selectedPrescription.items.map((item, i) => (
                  <div key={i} className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{item.medicine.name}</p>
                        <p className="text-small">{item.dosage}</p>
                        {item.instructions && (
                          <p className="text-small">{item.instructions}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="badge badge-info">x{item.quantity}</p>
                        <p className="text-small mt-1">{formatCurrency(item.quantity * item.unitPrice)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-[hsl(var(--border))]">
                <span className="font-semibold">Tổng cộng</span>
                <span className="text-xl font-bold text-[hsl(var(--primary))]">
                  {formatCurrency(calculateTotal(selectedPrescription.items))}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
