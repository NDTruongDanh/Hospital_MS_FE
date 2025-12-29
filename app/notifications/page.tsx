"use client";

import { useState } from "react";
import {
  Bell,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  FileText,
  CreditCard,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// Mock notification types - would come from backend
type NotificationType = "appointment" | "lab_result" | "payment" | "system" | "reminder";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// Mock data - in real implementation, fetch from backend
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "appointment",
    title: "Lịch hẹn sắp tới",
    message: "Bạn có lịch hẹn khám bệnh vào ngày 30/12/2024 lúc 09:00",
    isRead: false,
    createdAt: new Date().toISOString(),
    link: "/patient/appointments",
  },
  {
    id: "2",
    type: "lab_result",
    title: "Kết quả xét nghiệm",
    message: "Kết quả xét nghiệm máu của bạn đã có",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    type: "payment",
    title: "Thanh toán thành công",
    message: "Bạn đã thanh toán hóa đơn #INV-2024-001 thành công",
    isRead: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    link: "/patient/invoices",
  },
  {
    id: "4",
    type: "reminder",
    title: "Nhắc nhở",
    message: "Đừng quên uống thuốc theo đơn của bác sĩ",
    isRead: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
];

const TYPE_CONFIG: Record<NotificationType, { icon: typeof Bell; color: string }> = {
  appointment: { icon: Calendar, color: "text-blue-500" },
  lab_result: { icon: FileText, color: "text-purple-500" },
  payment: { icon: CreditCard, color: "text-green-500" },
  system: { icon: AlertCircle, color: "text-amber-500" },
  reminder: { icon: Clock, color: "text-orange-500" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  const markAllAsRead = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    toast.success("Đã đánh dấu tất cả là đã đọc");
    setLoading(false);
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success("Đã xóa thông báo");
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display">Thông báo</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Không có thông báo mới"}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={loading}
            className="btn-secondary"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card-base">
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "all"
                ? "bg-[hsl(var(--primary))] text-white"
                : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
            }`}
            onClick={() => setFilter("all")}
          >
            Tất cả ({notifications.length})
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "unread"
                ? "bg-[hsl(var(--primary))] text-white"
                : "bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80"
            }`}
            onClick={() => setFilter("unread")}
          >
            Chưa đọc ({unreadCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="card-base flex flex-col items-center justify-center py-12">
            <Bell className="w-16 h-16 text-[hsl(var(--muted-foreground))] opacity-50" />
            <p className="text-[hsl(var(--muted-foreground))] mt-4">
              {filter === "unread" ? "Không có thông báo chưa đọc" : "Không có thông báo nào"}
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => {
            const TypeIcon = TYPE_CONFIG[notification.type].icon;
            const iconColor = TYPE_CONFIG[notification.type].color;

            return (
              <div
                key={notification.id}
                className={`card-base transition-all ${
                  !notification.isRead 
                    ? "border-l-4 border-l-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5" 
                    : ""
                }`}
                onClick={() =>markAsRead(notification.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-lg bg-[hsl(var(--secondary))] ${iconColor}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className={`font-medium ${!notification.isRead ? "text-[hsl(var(--foreground))]" : "text-[hsl(var(--muted-foreground))]"}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                        {!notification.isRead && (
                          <button
                            className="btn-icon w-8 h-8 text-green-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            title="Đánh dấu đã đọc"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          className="btn-icon w-8 h-8 text-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Info message */}
      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm">
        <p className="font-medium">Thông báo thời gian thực</p>
        <p className="mt-1 text-blue-600 dark:text-blue-300">
          Hiện tại đang sử dụng dữ liệu mẫu. Kết nối với backend notification service để nhận thông báo thời gian thực.
        </p>
      </div>
    </div>
  );
}
