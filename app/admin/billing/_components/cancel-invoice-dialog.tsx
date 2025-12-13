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
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

interface CancelInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNumber: string;
  onConfirm: (reason: string) => Promise<void>;
  isLoading?: boolean;
}

export function CancelInvoiceDialog({
  open,
  onOpenChange,
  invoiceNumber,
  onConfirm,
  isLoading,
}: CancelInvoiceDialogProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason for cancellation");
      return;
    }
    if (reason.length > 500) {
      setError("Reason cannot exceed 500 characters");
      return;
    }
    setError("");
    await onConfirm(reason);
    setReason("");
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setReason("");
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Cancel Invoice
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel invoice{" "}
            <strong>{invoiceNumber}</strong>? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">
              Reason for cancellation{" "}
              <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Enter the reason for cancelling this invoice..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              maxLength={500}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {error && <span className="text-destructive">{error}</span>}
              <span className="ml-auto">{reason.length}/500</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
