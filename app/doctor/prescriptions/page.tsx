"use client";

import { useState, useEffect } from "react";
import { 
  Search,
  FileText,
  Eye,
  Loader2,
  Calendar,
  User,
  Pill,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  createdAt: string;
  diagnosis: string;
  items: {
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
  }[];
}

// Mock data for prescriptions
const mockPrescriptions: Prescription[] = [
  {
    id: "rx-001",
    patientName: "Nguyễn Văn An",
    patientId: "p001",
    createdAt: new Date().toISOString(),
    diagnosis: "Cảm cúm thông thường",
    items: [
      { medicineName: "Paracetamol 500mg", dosage: "1 viên", frequency: "3 lần/ngày", duration: "5 ngày", quantity: 15 },
      { medicineName: "Vitamin C 1000mg", dosage: "1 viên", frequency: "1 lần/ngày", duration: "7 ngày", quantity: 7 },
    ],
  },
  {
    id: "rx-002",
    patientName: "Lê Thị Bình",
    patientId: "p002",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    diagnosis: "Viêm họng cấp",
    items: [
      { medicineName: "Amoxicillin 500mg", dosage: "1 viên", frequency: "3 lần/ngày", duration: "7 ngày", quantity: 21 },
      { medicineName: "Strepsils", dosage: "1 viên", frequency: "4 lần/ngày", duration: "5 ngày", quantity: 20 },
    ],
  },
];

export default function DoctorPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      // In real app, fetch from API
      await new Promise(r => setTimeout(r, 500));
      setPrescriptions(mockPrescriptions);
    } catch (error) {
      console.error("Failed to fetch prescriptions:", error);
      toast.error("Không thể tải danh sách đơn thuốc");
    } finally {
      setLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(rx =>
    rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rx.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Đơn thuốc đã kê</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {prescriptions.length} đơn thuốc
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="card-base">
        <div className="search-input w-full max-w-md">
          <Search className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
          <input
            type="text"
            placeholder="Tìm theo tên bệnh nhân, chẩn đoán..."
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
              <th>Ngày kê</th>
              <th>Chẩn đoán</th>
              <th>Số loại thuốc</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[hsl(var(--primary))]" />
                  <p className="text-small mt-2">Đang tải...</p>
                </td>
              </tr>
            ) : filteredPrescriptions.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto text-[hsl(var(--muted-foreground))] opacity-50" />
                  <p className="text-[hsl(var(--muted-foreground))] mt-2">
                    Không có đơn thuốc nào
                  </p>
                </td>
              </tr>
            ) : (
              filteredPrescriptions.map((rx) => (
                <tr key={rx.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        {rx.patientName.charAt(0)}
                      </div>
                      <p className="font-medium">{rx.patientName}</p>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                      {formatDate(rx.createdAt)}
                    </div>
                  </td>
                  <td className="max-w-[200px] truncate">{rx.diagnosis}</td>
                  <td>
                    <span className="badge badge-info">
                      <Pill className="w-3 h-3" />
                      {rx.items.length} loại
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedPrescription(rx)}
                      className="btn-icon w-8 h-8"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Prescription Detail Modal */}
      <Dialog open={!!selectedPrescription} onOpenChange={() => setSelectedPrescription(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết đơn thuốc</DialogTitle>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[hsl(var(--secondary))]">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    {selectedPrescription.patientName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedPrescription.patientName}</p>
                    <p className="text-small">{formatDate(selectedPrescription.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-label">Chẩn đoán</p>
                <p className="font-medium">{selectedPrescription.diagnosis}</p>
              </div>

              <div>
                <p className="text-label mb-2">Danh sách thuốc</p>
                <div className="space-y-3">
                  {selectedPrescription.items.map((item, i) => (
                    <div key={i} className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm">
                      <p className="font-medium">{item.medicineName}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                        <p>Liều: {item.dosage}</p>
                        <p>Tần suất: {item.frequency}</p>
                        <p>Thời gian: {item.duration}</p>
                        <p>Số lượng: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
