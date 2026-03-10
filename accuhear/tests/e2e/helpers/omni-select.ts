import { expect, type Page } from "@playwright/test";

export async function selectOmniOption(page: Page, testId: string, optionLabel: string) {
  await page.getByTestId(testId).click();
  const option = page.getByRole("option", { name: optionLabel }).last();
  await expect(option).toBeVisible();
  await option.click();
}
