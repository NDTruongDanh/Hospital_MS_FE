"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CompleteAppointmentModalProps {
  onConfirm: () => void;
  triggerLabel?: string;
}

export function CompleteAppointmentModal({
  onConfirm,
  triggerLabel = "Complete",
}: CompleteAppointmentModalProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hoàn tất lịch hẹn?</AlertDialogTitle>
          <AlertDialogDescription>
            Xác nhận đánh dấu lịch hẹn này là hoàn tất.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Xác nhận</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
