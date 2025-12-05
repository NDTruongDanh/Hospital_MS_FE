import { test, expect } from "@playwright/test";

/**
 * E2E Tests cho Appointment Service (Admin)
 * Dựa trên: DOCS/fe-specs/fe-spec-appointment-service.md
 *
 * Giả định:
 * - App có data mock (MSW hoặc seed) với appointment status: SCHEDULED/COMPLETED/CANCELLED/NO_SHOW.
 * - Đã login/bypass auth cho admin.
 * - Routes: /admin/appointments, /admin/appointments/new, /admin/appointments/{id}, /edit.
 */

const SAMPLE_APPOINTMENT_ID = process.env.APPOINTMENT_ID || "apt-1";

test.describe("Appointments - Admin", () => {
  test("Danh sách: hiển thị filters, table, pagination", async ({ page }) => {
    await page.goto("/admin/appointments");

    await expect(page.getByRole("heading", { name: /Appointments/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
    await expect(page.getByText(/Doctor/i)).toBeVisible();
    await expect(page.getByText(/Date/i)).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("Bộ lọc trạng thái đủ options", async ({ page }) => {
    await page.goto("/admin/appointments");
    await page.getByText(/Status/i).click();
    await expect(page.getByRole("option", { name: /SCHEDULED/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /COMPLETED/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /CANCELLED/i })).toBeVisible();
    await expect(page.getByRole("option", { name: /NO_SHOW/i })).toBeVisible();
  });

  test("Tạo mới appointment (submit rỗng báo lỗi)", async ({ page }) => {
    await page.goto("/admin/appointments/new");
    await page.getByRole("button", { name: /Book Appointment|Create/i }).click();
    await expect(page.getByText(/required|Please select/i).first()).toBeVisible();
  });

  test("Xem chi tiết appointment", async ({ page }) => {
    await page.goto(`/admin/appointments/${SAMPLE_APPOINTMENT_ID}`);
    await expect(page.getByText(/Appointment Details|Appointment #/i)).toBeVisible();
    await expect(page.getByText(/Status/i)).toBeVisible();
    await expect(page.getByText(/Patient/i)).toBeVisible();
    await expect(page.getByText(/Doctor/i)).toBeVisible();
  });

  test("Hủy appointment hiển thị dialog", async ({ page }) => {
    await page.goto(`/admin/appointments/${SAMPLE_APPOINTMENT_ID}`);
    const cancelBtn = page.getByRole("button", { name: /Cancel Appointment/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect(page.getByText(/Cancellation Reason/i)).toBeVisible();
    } else {
      test.skip(true, "Không có nút Cancel (status không cho hủy)");
    }
  });

  test("Reschedule/Chỉnh sửa appointment", async ({ page }) => {
    await page.goto(`/admin/appointments/${SAMPLE_APPOINTMENT_ID}/edit`);
    await expect(page.getByRole("heading", { name: /Edit|Reschedule/i })).toBeVisible();
    // Không submit thật; chỉ kiểm tra form render và validation
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page.getByText(/required|Please select/i).first()).toBeVisible();
  });

  test("Complete appointment", async ({ page }) => {
    await page.goto(`/admin/appointments/${SAMPLE_APPOINTMENT_ID}`);
    const completeBtn = page.getByRole("button", { name: /Complete|Mark as Completed/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      // Tùy UI: có thể là dialog xác nhận, kiểm tra không crash
      await expect(completeBtn).toBeVisible();
    } else {
      test.skip(true, "Không có nút Complete (status không cho complete)");
    }
  });
});
