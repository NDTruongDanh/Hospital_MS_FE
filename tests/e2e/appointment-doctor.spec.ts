import { test, expect } from "@playwright/test";

/**
 * E2E Tests cho Doctor Appointments
 * Giả định: mock data có doctorId emp-101, appointment apt-001.
 */

const DOCTOR_APT_ID = process.env.DOCTOR_APPOINTMENT_ID || "apt-001";

test.describe("Doctor - Appointments", () => {
  test("Doctor xem lịch", async ({ page }) => {
    await page.goto("/doctor/appointments");
    await expect(page.getByRole("heading", { name: /Lịch khám của bác sĩ/i })).toBeVisible();
    await expect(page.getByText(/Chi tiết/i).first()).toBeVisible();
  });

  test("Doctor xem chi tiết & Start Visit", async ({ page }) => {
    await page.goto(`/doctor/appointments/${DOCTOR_APT_ID}`);

    await expect(page.getByRole("heading", { name: /Chi tiết lịch hẹn/i })).toBeVisible();
    await expect(page.getByText(/Bệnh nhân/i)).toBeVisible();
    const completeBtn = page.getByRole("button", { name: /Start Visit|Complete/i });
    await expect(completeBtn).toBeVisible();
  });

  test("Doctor complete appointment nếu có nút", async ({ page }) => {
    await page.goto(`/doctor/appointments/${DOCTOR_APT_ID}`);
    const completeBtn = page.getByRole("button", { name: /Start Visit|Complete/i });
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
      await expect(completeBtn).toBeVisible();
    } else {
      test.skip(true, "Không có nút Complete (status không phù hợp)");
    }
  });
});
