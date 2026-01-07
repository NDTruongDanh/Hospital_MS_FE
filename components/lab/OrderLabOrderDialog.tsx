"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FlaskConical, Loader2, X, FileText } from "lucide-react";
import { useActiveLabTests } from "@/hooks/queries/useLab";
import { useCreateLabOrder } from "@/hooks/queries/useLabOrder";
import { useMyEmployeeProfile } from "@/hooks/queries/useHr";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { LabTestCategory } from "@/services/lab.service";
import { OrderPriority } from "@/services/lab-order.service";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OrderLabOrderDialogProps {
  medicalExamId: string;
  patientId: string;
  patientName: string;
  onSuccess?: () => void;
}

const categoryLabels: Record<LabTestCategory, string> = {
  LAB: "Laboratory",
  IMAGING: "Imaging",
  PATHOLOGY: "Pathology",
};

const categoryColors: Record<LabTestCategory, string> = {
  LAB: "bg-blue-100 text-blue-800",
  IMAGING: "bg-purple-100 text-purple-800",
  PATHOLOGY: "bg-orange-100 text-orange-800",
};

const priorityOptions: { value: OrderPriority; label: string }[] = [
  { value: "NORMAL", label: "Bình thường" },
  { value: "URGENT", label: "Khẩn cấp" },
];

export function OrderLabOrderDialog({
  medicalExamId,
  patientId,
  patientName,
  onSuccess,
}: OrderLabOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedTestIds, setSelectedTestIds] = useState<string[]>([]);
  const [priority, setPriority] = useState<OrderPriority>("NORMAL");
  const [notes, setNotes] = useState("");

  const { data: labTests, isLoading: isLoadingTests } = useActiveLabTests();
  const createLabOrder = useCreateLabOrder();
  const { data: myProfile } = useMyEmployeeProfile();

  const selectedTests = labTests?.filter((t) => selectedTestIds.includes(t.id)) || [];
  const totalPrice = selectedTests.reduce((sum, t) => sum + (t.price || 0), 0);

  const toggleTest = (testId: string) => {
    setSelectedTestIds((prev) =>
      prev.includes(testId)
        ? prev.filter((id) => id !== testId)
        : [...prev, testId]
    );
  };

  const removeTest = (testId: string) => {
    setSelectedTestIds((prev) => prev.filter((id) => id !== testId));
  };

  const handleSubmit = async () => {
    if (selectedTestIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một xét nghiệm");
      return;
    }

    try {
      await createLabOrder.mutateAsync({
        medicalExamId,
        labTestIds: selectedTestIds,
        priority,
        notes: notes || undefined,
        patientId,
        patientName,
        orderingDoctorId: myProfile?.id,
        orderingDoctorName: myProfile?.fullName,
      });

      toast.success(`Đã tạo phiếu xét nghiệm với ${selectedTestIds.length} mục!`);
      setOpen(false);
      setSelectedTestIds([]);
      setPriority("NORMAL");
      setNotes("");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể tạo phiếu xét nghiệm");
    }
  };

  const handleReset = () => {
    setSelectedTestIds([]);
    setPriority("NORMAL");
    setNotes("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-2 border-teal-300 bg-teal-50 text-teal-700 hover:bg-teal-100 hover:border-teal-400 font-medium shadow-sm"
        >
          <FileText className="h-4 w-4" />
          Tạo Phiếu Xét nghiệm
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-teal-500" />
            Tạo Phiếu Xét nghiệm
          </DialogTitle>
          <DialogDescription>
            Chọn các xét nghiệm cho bệnh nhân <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          <div className="grid gap-4">
            {/* Priority Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mức ưu tiên</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as OrderPriority)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-muted-foreground">
                  Đã chọn: <span className="font-bold text-foreground">{selectedTestIds.length}</span> xét nghiệm
                </div>
              </div>
            </div>

            {/* Test Selection */}
            <div className="space-y-2">
              <Label>Chọn xét nghiệm *</Label>
              {isLoadingTests ? (
                <div className="flex items-center gap-2 text-muted-foreground p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : (
                <ScrollArea className="h-[200px] border rounded-lg p-3">
                  <div className="space-y-2">
                    {labTests?.map((test) => (
                      <div
                        key={test.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedTestIds.includes(test.id)
                            ? "bg-teal-50 border-teal-300"
                            : "hover:bg-muted/50"
                        }`}
                        onClick={() => toggleTest(test.id)}
                      >
                        <Checkbox
                          checked={selectedTestIds.includes(test.id)}
                          onCheckedChange={() => toggleTest(test.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{test.name}</span>
                            <Badge className={categoryColors[test.category]} variant="secondary">
                              {categoryLabels[test.category]}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Mã: {test.code}</span>
                            <span>•</span>
                            <span className="text-teal-600 font-medium">
                              {test.price?.toLocaleString("vi-VN")} VND
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Selected Tests Summary */}
            {selectedTests.length > 0 && (
              <div className="space-y-2">
                <Label>Xét nghiệm đã chọn</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map((test) => (
                    <Badge key={test.id} variant="secondary" className="gap-1 py-1 px-2">
                      {test.name}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeTest(test.id);
                        }}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="text-right text-sm">
                  Tổng: <span className="font-bold text-teal-600">{totalPrice.toLocaleString("vi-VN")} VND</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="notes"
                placeholder="Nhập ghi chú cho phiếu xét nghiệm..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 border-t pt-4">
          <Button variant="ghost" onClick={handleReset} disabled={selectedTestIds.length === 0}>
            Xóa tất cả
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedTestIds.length === 0 || createLabOrder.isPending}
          >
            {createLabOrder.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                Tạo phiếu ({selectedTestIds.length})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
