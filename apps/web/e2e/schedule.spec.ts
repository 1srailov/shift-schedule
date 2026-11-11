import { expect, test, type Page } from "@playwright/test";

/** A far-future week nobody else touches: Mon 7 – Sun 13 Jan 2030. */
const WEEK = "2030-01-07";
const days = ["07", "08", "09", "10", "11", "12", "13"].map((d) => `2030-01-${d}`);
const API = process.env.E2E_API_URL ?? "http://localhost:3001";

const cell = (page: Page, employeeId: number, date: string) => page.locator(`[data-cell="${employeeId}|${date}"]`);
const coverage = (page: Page, date: string) => page.locator(`[data-coverage="${date}"]`);

async function resetWeek() {
  const deletes = [1, 2, 3, 4, 5, 6, 7, 8, 9].flatMap((employeeId) => days.map((date) => ({ employeeId, date })));
  const res = await fetch(`${API}/api/shifts`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ upserts: [], deletes }),
  });
  expect(res.ok).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await resetWeek();
  await page.goto(`/?view=week&date=${WEEK}`);
  await expect(page.getByTestId("period-label")).toHaveText("7 – 13 января 2030");
});
test.afterAll(resetWeek);

test("select a block, apply template by hotkey, coverage updates, save persists", async ({ page }) => {
  await expect(coverage(page, days[0]!)).toHaveText("0");

  // rubber-band selection: 2 employees × 2 days
  const from = await cell(page, 1, days[0]!).boundingBox();
  const to = await cell(page, 2, days[1]!).boundingBox();
  await page.mouse.move(from!.x + 20, from!.y + 20);
  await page.mouse.down();
  await page.mouse.move(to!.x + 20, to!.y + 20, { steps: 5 });
  await page.mouse.up();
  await expect(page.getByTestId("selection-bar")).toContainText("4 ячейки");

  await page.keyboard.press("2"); // "День" 10:00–18:00
  await expect(cell(page, 1, days[0]!)).toContainText("10 - 18");
  await expect(coverage(page, days[0]!)).toHaveText("2");
  await expect(coverage(page, days[2]!)).toHaveText("0");

  await page.getByRole("button", { name: /^Сохранить/ }).click();
  await expect(page.getByText("Изменения сохранены")).toBeVisible();

  await page.reload();
  await expect(cell(page, 2, days[1]!)).toContainText("10 - 18");
  await expect(coverage(page, days[1]!)).toHaveText("2");
});

test("custom shift is applied to every selected cell", async ({ page }) => {
  await cell(page, 3, days[3]!).click();
  await cell(page, 4, days[4]!).click({ modifiers: ["ControlOrMeta"] });
  await page.getByLabel("Начало").fill("10");
  await page.getByLabel("Конец").fill("2300");
  await page.getByRole("button", { name: "Поставить в выделенные" }).click();

  for (const [emp, d] of [[3, days[3]!], [4, days[4]!]] as const) {
    await expect(cell(page, emp, d)).toContainText("10 - 23");
    await expect(cell(page, emp, d)).toContainText("13 ч");
  }
  await expect(page.getByTestId("selection-bar")).toBeHidden();
});

test("drag a template onto a cell, then move the shift", async ({ page }) => {
  const tpl = page.getByRole("button", { name: /Утро/ }).first();
  const target = cell(page, 5, days[5]!);
  await tpl.hover();
  await page.mouse.down();
  const box = await target.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(target).toContainText("07 - 15");
  await expect(coverage(page, days[5]!)).toHaveText("1");

  const dest = cell(page, 5, days[6]!);
  const src = await target.boundingBox();
  const dst = await dest.boundingBox();
  await page.mouse.move(src!.x + src!.width / 2, src!.y + src!.height / 2);
  await page.mouse.down();
  await page.mouse.move(dst!.x + dst!.width / 2, dst!.y + dst!.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(dest).toContainText("07 - 15");
  await expect(target).not.toContainText("07 - 15");
  await expect(coverage(page, days[5]!)).toHaveText("0");
  await expect(coverage(page, days[6]!)).toHaveText("1");

  // undo restores the previous state
  await page.keyboard.press("ControlOrMeta+z");
  await expect(target).toContainText("07 - 15");
});

test("search filters employees by name", async ({ page }) => {
  await page.getByPlaceholder("Поиск по ФИО").fill("артем");
  await expect(page.locator('[role="row"]').filter({ hasText: "Соколов Артём" })).toBeVisible();
  await expect(page.getByText("Кузнецова Алина")).toBeHidden();
});
