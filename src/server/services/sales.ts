import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { categories, customers, products, saleLines, sales } from "@/db/schema";
import { computeSaleTotals } from "@/lib/money";
import type { SaleInput } from "@/lib/validation/sale";
import { notFoundError, validationError } from "@/server/error";

export interface SaleComputation {
  subtotalMinor: number;
  discountMinor: number;
  netMinor: number;
  taxBps: number;
  taxMinor: number;
  totalMinor: number;
}

export function computeSale(input: SaleInput): SaleComputation {
  return computeSaleTotals({
    lines: input.lines.map((line) => ({
      unitPriceMinor: line.unitPriceMinor,
      unitCostMinor: line.unitCostMinor ?? null,
      quantity: line.quantity,
    })),
    discountMinor: input.discountMinor,
    taxBps: input.taxBps,
  });
}

function newId(): string {
  return globalThis.crypto.randomUUID();
}

export function assertSaleInput(input: SaleInput): void {
  if (input.lines.length === 0) {
    throw validationError("A sale requires at least one line item.");
  }
}

export function createSale(input: SaleInput, orderRef: string): string {
  assertSaleInput(input);
  const totals = computeSale(input);
  const now = Date.now();
  const saleId = newId();
  const db = getDb();

  db.transaction((tx) => {
    let customerId: string | null = null;
    let customerNameSnapshot = "Walk-in customer";

    if (input.customer.mode === "existing") {
      if (!input.customer.id) {
        throw notFoundError("Customer not found.");
      }
      const existing = tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customer.id))
        .get();
      if (!existing) {
        throw notFoundError("Customer not found.");
      }
      customerId = existing.id;
      customerNameSnapshot = existing.name;
    } else if (input.customer.mode === "new") {
      const id = newId();
      customerNameSnapshot = input.customer.name ?? "New customer";
      tx.insert(customers)
        .values({
          id,
          name: customerNameSnapshot,
          email: input.customer.email ?? null,
          phone: input.customer.phone ?? null,
          createdAt: now,
          updatedAt: now,
        })
        .run();
      customerId = id;
    }

    tx.insert(sales)
      .values({
        id: saleId,
        orderRef,
        status: input.status,
        paymentMethod: input.paymentMethod,
        customerId,
        customerNameSnapshot,
        occurredAt: input.occurredAt,
        subtotalMinor: totals.subtotalMinor,
        discountMinor: totals.discountMinor,
        netMinor: totals.netMinor,
        taxBps: totals.taxBps,
        taxMinor: totals.taxMinor,
        totalMinor: totals.totalMinor,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    for (const line of input.lines) {
      let productId: string | null = null;
      let productNameSnapshot: string;
      let categoryNameSnapshot: string | null = null;

      if (line.mode === "catalog") {
        const catalog = tx
          .select()
          .from(products)
          .where(eq(products.id, line.productId))
          .get();
        if (!catalog) {
          throw notFoundError("Product not found.");
        }
        productId = catalog.id;
        productNameSnapshot = catalog.name;
        if (catalog.categoryId) {
          const category = tx
            .select()
            .from(categories)
            .where(eq(categories.id, catalog.categoryId))
            .get();
          categoryNameSnapshot = category?.name ?? null;
        }
      } else {
        let categoryId: string | null = null;
        if (line.categoryName) {
          const existingCategory = tx
            .select()
            .from(categories)
            .where(eq(categories.name, line.categoryName))
            .get();
          if (existingCategory) {
            categoryId = existingCategory.id;
          } else {
            categoryId = newId();
            tx.insert(categories)
              .values({
                id: categoryId,
                name: line.categoryName,
                createdAt: now,
                updatedAt: now,
              })
              .run();
          }
        }
        productId = newId();
        productNameSnapshot = line.name;
        categoryNameSnapshot = line.categoryName ?? null;
        tx.insert(products)
          .values({
            id: productId,
            name: line.name,
            sku: null,
            categoryId,
            defaultPriceMinor: line.unitPriceMinor,
            defaultCostMinor: line.unitCostMinor ?? null,
            archivedAt: null,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }

      tx.insert(saleLines)
        .values({
          id: newId(),
          saleId,
          productId,
          productNameSnapshot,
          categoryNameSnapshot,
          quantity: line.quantity,
          unitPriceMinor: line.unitPriceMinor,
          unitCostMinor: line.unitCostMinor ?? null,
          lineSubtotalMinor: line.unitPriceMinor * line.quantity,
          createdAt: now,
          updatedAt: now,
        })
        .run();
    }
  });

  return saleId;
}
