import { test, expect } from "@playwright/test";

/**
 * E2E Tests cho Patient Appointments
 * Giả định: mock data có appointment của patient p001, id apt-001.
 */

const PATIENT_APT_ID = process.env.PATIENT_APPOINTMENT_ID || "apt-001";

test.describe("Patient - Appointments", () => {
  test("Xem danh sách My Appointments", async ({ page }) => {
    await page.goto("/patient/appointments");
    await expect(page.getByRole("heading", { name: /Lịch hẹn của tôi/i })).toBeVisible();
    await expect(page.getByText(/Chi tiết/i).first()).toBeVisible();
  });

  test("Xem chi tiết appointment", async ({ page }) => {
    await page.goto(`/patient/appointments/${PATIENT_APT_ID}`);
    await expect(page.getByRole("heading", { name: /Chi tiết lịch hẹn/i })).toBeVisible();
    await expect(page.getByText(/Bệnh nhân/i)).toBeVisible();
    await expect(page.getByText(/Bác sĩ/i)).toBeVisible();
  });

  test("Đặt lịch mới (wizard 3 bước)", async ({ page }) => {
    await page.goto("/patient/appointments/new");
    await expect(page.getByText(/Bước 1: Chọn bác sĩ/i)).toBeVisible();

    // Step 1
    await page.getByText(/Chọn bác sĩ/).click();
    await page.getByRole("option", { name: /John Smith/i }).click();
    await page.getByRole("button", { name: /Chọn ngày/i }).click();
    await page.getByRole("gridcell").first().click();
    await page.getByRole("button", { name: /Tiếp tục/i }).click();

    // Step 2
    await expect(page.getByText(/Bước 2/i)).toBeVisible();
    const slotBtn = page.getByRole("button", { name: /\d{2}:\d{2}/i }).first();
    if (await slotBtn.isVisible()) await slotBtn.click();
    await page.getByLabel(/Lý do/i).fill("Đau đầu");
    await page.getByRole("button", { name: /Tiếp tục/i }).click();

    // Step 3
    await expect(page.getByText(/Xác nhận/i)).toBeVisible();
  });

  test("Hủy lịch hẹn", async ({ page }) => {
    await page.goto(`/patient/appointments/${PATIENT_APT_ID}`);
    const cancelBtn = page.getByRole("button", { name: /Hủy lịch/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      await expect(page).toHaveURL(/\/patient\/appointments$/);
    } else {
      test.skip(true, "Lịch không hủy được (status không phải SCHEDULED)");
    }
  });
});
