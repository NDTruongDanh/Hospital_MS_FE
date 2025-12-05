import { test, expect } from "@playwright/test";

const PATIENT_ID = process.env.PATIENT_ID || "p001";

test.describe("Patients - Admin flow", () => {
  test("List shows filters and table", async ({ page }) => {
    await page.goto("/admin/patients");
    await expect(page.getByRole("heading", { name: /Patients/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Search/i)).toBeVisible();
    await expect(page.getByText(/Gender/i)).toBeVisible();
    await expect(page.getByText(/Blood Type/i)).toBeVisible();
    await expect(page.locator("table")).toBeVisible();
  });

  test("Create patient validation and submit", async ({ page }) => {
    await page.goto("/admin/patients/new");
    await page.getByRole("button", { name: /Register|Save/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();

    await page.getByLabel(/Full Name/i).fill("Test Patient");
    await page.getByLabel(/Phone/i).fill("0900000000");
    await page.getByLabel(/Date of Birth/i).fill("1990-01-01");
    await page.getByRole("button", { name: /Register|Save/i }).click();
    await expect(page).toHaveURL(/patients/);
  });

  test("View patient detail", async ({ page }) => {
    await page.goto(`/admin/patients/${PATIENT_ID}`);
    await expect(page.getByText(/Patient/i)).toBeVisible();
    await expect(page.getByText(/Appointments|Lịch hẹn/i)).toBeVisible();
  });

  test("Edit patient shows form", async ({ page }) => {
    await page.goto(`/admin/patients/${PATIENT_ID}/edit`);
    await expect(page.getByRole("heading", { name: /Edit/i })).toBeVisible();
    await page.getByRole("button", { name: /Save/i }).click();
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test("Delete patient dialog", async ({ page }) => {
    await page.goto("/admin/patients");
    const deleteBtn = page.getByRole("button", { name: /Delete/i }).first();
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible();
    } else {
      test.skip(true, "No delete button visible in current dataset");
    }
  });
});
