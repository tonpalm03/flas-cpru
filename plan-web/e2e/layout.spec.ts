import { as, expect, test, unique } from "./support/session"
import { projectAt } from "./support/projects"

// โครงหน้าเว็บ: เมนูที่ใช้งานได้จริงเท่านั้น, ไม่มีข้อมูลจำลองปี 2569, ค้นหาจากแถบบน (เมนูบนมือถืออยู่ใน phone.spec.ts)

test("menus show only working pages and no 2569 reference data", async ({ page }) => {
  await as(page, "officer", "dashboard")
  await expect(page.getByTestId("sidebar")).toBeVisible()
  await expect(page.getByText("ตั้งค่าฟอร์ม")).toHaveCount(0)
  await expect(page.getByText(/PRJ-2569-/)).toHaveCount(0)
  await expect(page.getByTestId("kpi-requested")).toBeVisible()
  await as(page, "dean", "projects")
  await page.waitForTimeout(500)
  await expect(page.getByText(/PRJ-2569-/)).toHaveCount(0)
})

test("officers have no proposal or all-projects pages; old links open the dashboard", async ({ page }) => {
  const menu = page.getByTestId("sidebar")
  await as(page, "officer", "dashboard")
  await expect(menu.getByRole("button", { name: /งานของเจ้าหน้าที่/ })).toBeVisible()
  await expect(menu.getByRole("button", { name: "เสนอโครงการใหม่" })).toHaveCount(0)
  await expect(menu.getByRole("button", { name: "โครงการทั้งหมด" })).toHaveCount(0)
  await expect(page.getByRole("button", { name: "เสนอโครงการใหม่" })).toHaveCount(0)
  // ลิงก์เก่า (#proposal, #projects) ไม่เปิดฟอร์มที่สร้างโครงการซึ่งไม่มีใครส่งตรวจได้
  for (const hash of ["proposal", "projects"]) {
    await as(page, "officer", hash)
    await expect(page.getByTestId("kpi-requested")).toBeVisible()
    await expect(page.locator('input[name="title"]')).toHaveCount(0)
  }
  // อาจารย์และประธานสาขายังเสนอโครงการได้
  for (const user of ["teacher", "head"]) {
    await as(page, user, "dashboard")
    await expect(menu.getByRole("button", { name: "เสนอโครงการใหม่" })).toBeVisible()
  }
})

test("header search finds a project and opens it", async ({ page }) => {
  const title = `โครงการค้นหาได้ ${unique()}`
  const code = await projectAt("review", title)
  await as(page, "officer", "dashboard")
  await page.getByTestId("header-search").fill(code)
  await expect(page.getByTestId("search-result")).toHaveCount(1)
  await page.getByTestId("search-result").click()
  await expect(page.getByRole("heading", { name: title })).toBeVisible()

  await page.getByTestId("header-search").fill("ไม่มีโครงการนี้แน่นอน")
  await expect(page.getByText(/ไม่พบโครงการที่ตรงกับ/)).toBeVisible()
  await page.getByTestId("header-search").press("Escape")
  await expect(page.getByTestId("header-search")).toHaveValue("")
})

test("installs on a phone as an app: manifest, icons, offline page", async ({ page, request }) => {
  await page.goto("/")
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/manifest.webmanifest")
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/brand/apple-touch-icon.png")
  const manifest = await (await request.get("/manifest.webmanifest")).json()
  expect([manifest.short_name, manifest.display, manifest.start_url]).toEqual(["ระบบแผน", "standalone", "/"])
  expect(manifest.icons.map((icon: any) => icon.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]))
  for (const path of [...manifest.icons.map((icon: any) => icon.src), "/brand/apple-touch-icon.png", "/sw.js", "/offline.html"]) {
    expect((await request.get(path)).status(), path).toBe(200)
  }
})

test("the web calls the backend through its own address (one link works from any phone)", async ({ page }) => {
  const calls: string[] = []
  page.on("request", (r) => {
    if (r.url().includes("/api/v1/")) calls.push(new URL(r.url()).host)
  })
  await as(page, "officer", "dashboard")
  await expect(page.getByTestId("kpi-requested")).toBeVisible()
  const own = new URL(page.url()).host
  expect(calls.length).toBeGreaterThan(0)
  expect([...new Set(calls)]).toEqual([own])
})
