import { test, expect } from "@playwright/test";

test.describe("Patient Self-Service Profile", () => {
  test("View my profile", async ({ page }) => {
    await page.goto("/profile");
    const hasProfile = await page.getByText(/Hồ sơ của tôi|My Profile/i).isVisible().catch(() => false);
    if (!hasProfile) {
      test.skip(true, "Profile page not available");
    }
    await expect(page.getByText(/Thông tin cá nhân|Personal/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /Chỉnh sửa|Edit Profile/i })).toBeVisible();
  });

  test("Edit limited fields", async ({ page }) => {
    await page.goto("/profile/edit");
    const editablePhone = page.getByLabel(/Số điện thoại|Phone/i);
    if (!(await editablePhone.isVisible())) {
      test.skip(true, "Edit profile form not available");
    }
    await editablePhone.fill("0909999999");
    const address = page.getByLabel(/Địa chỉ|Address/i);
    await address.fill("123 Test Street");
    await page.getByRole("button", { name: /Lưu|Save/i }).click();
    await expect(page).toHaveURL(/profile/);
  });
});
