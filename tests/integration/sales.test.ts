import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import type { SaleInput } from "@/lib/validation/sale";

const dbPath = join(mkdtempSync(join(tmpdir(), "ledgerline-")), "test.db");
process.env.LEDGERLINE_DB_PATH = dbPath;

let createSale!: (input: SaleInput, orderRef: string) => string;
let raw!: ReturnType<typeof import("@/db/client").getRawSqlite>;

beforeAll(async () => {
  const bootstrapModule = await import("@/db/bootstrap");
  bootstrapModule.bootstrap();
  const client = await import("@/db/client");
  raw = client.getRawSqlite();
  const salesModule = await import("@/server/services/sales");
  createSale = salesModule.createSale;
});

function base(overrides: Partial<SaleInput>): SaleInput {
  return {
    occurredAt: 0,
    status: "completed",
    paymentMethod: "card",
    customer: { mode: "walkIn" },
    discountMinor: 0,
    taxBps: 0,
    lines: [],
    ...overrides,
  } as SaleInput;
}

describe("createSale snapshots", () => {
  it("snapshots the catalog product name and category", () => {
    raw
      .prepare("INSERT INTO categories (id,name,created_at,updated_at) VALUES (?,?,?,?)")
      .run("c1", "Workshops", 0, 0);
    raw
      .prepare(
        "INSERT INTO products (id,name,sku,category_id,default_price_minor,default_cost_minor,archived_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)",
      )
      .run("p1", "Brand workshop", null, "c1", 42000, null, null, 0, 0);

    const saleId = createSale(
      base({
        lines: [{ mode: "catalog", productId: "p1", quantity: 1, unitPriceMinor: 42000 }],
      }),
      "ORD-1",
    );

    const line = raw
      .prepare(
        "SELECT product_name_snapshot, category_name_snapshot FROM sale_lines WHERE sale_id = ?",
      )
      .get(saleId) as { product_name_snapshot: string; category_name_snapshot: string | null };
    expect(line.product_name_snapshot).toBe("Brand workshop");
    expect(line.category_name_snapshot).toBe("Workshops");
  });

  it("creates an inline product and category in the same transaction", () => {
    const saleId = createSale(
      base({
        lines: [
          {
            mode: "new",
            name: "Consultation",
            categoryName: "Services",
            quantity: 2,
            unitPriceMinor: 5000,
          },
        ],
      }),
      "ORD-2",
    );

    const product = raw
      .prepare("SELECT name, default_price_minor FROM products WHERE name = ?")
      .get("Consultation") as { name: string; default_price_minor: number };
    expect(product.default_price_minor).toBe(5000);

    const category = raw.prepare("SELECT name FROM categories WHERE name = ?").get("Services");
    expect(category).toBeTruthy();

    const line = raw
      .prepare(
        "SELECT product_id, product_name_snapshot, category_name_snapshot FROM sale_lines WHERE sale_id = ?",
      )
      .get(saleId) as {
      product_id: string | null;
      product_name_snapshot: string;
      category_name_snapshot: string | null;
    };
    expect(line.product_id).toBeTruthy();
    expect(line.product_name_snapshot).toBe("Consultation");
    expect(line.category_name_snapshot).toBe("Services");
  });

  it("creates an inline customer record", () => {
    const saleId = createSale(
      base({
        customer: { mode: "new", name: "Maya Studio" },
        lines: [{ mode: "new", name: "Field notes set", quantity: 1, unitPriceMinor: 8600 }],
      }),
      "ORD-3",
    );
    const sale = raw
      .prepare("SELECT customer_id, customer_name_snapshot FROM sales WHERE id = ?")
      .get(saleId) as { customer_id: string | null; customer_name_snapshot: string };
    expect(sale.customer_id).toBeTruthy();
    expect(sale.customer_name_snapshot).toBe("Maya Studio");
  });
});
