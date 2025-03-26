import { text, real, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";
import { expenseTags } from "./tags";
import { expenseModes } from "./modes";
import { expenseFynix } from "./fynix";

export enum expenseStatusType {
  PAID = "PAID",
  UNPAID = "UNPAID",
  NEXTDUE = "NEXTDUE",
}

export const expenseTracker = sqliteTable(
  "expense_tracker",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    expensePeriod: text("expense_period").notNull(),
    amount: real("amount").notNull().$type<number>(),
    description: text("description"),
    itemDetails: text("item_details"),
    tagId: text("tag_id")
      .notNull()
      .references(() => expenseTags.id, { onUpdate: "restrict", onDelete: "restrict" }),
    modeId: text("mode_id")
      .notNull()
      .references(() => expenseModes.id, { onUpdate: "restrict", onDelete: "restrict" }),
    fynixId: text("fynix_id")
      .notNull()
      .references(() => expenseFynix.id, { onUpdate: "restrict", onDelete: "restrict" }),
    status: text("status", { enum: ["PAID", "UNPAID", "NEXTDUE"] })
      .notNull()
      .$type<expenseStatusType>(),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .$default(() => new Date())
      .notNull(),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .$default(() => new Date())
      .notNull(),
    created_by: text("created_by").notNull(),
    updated_by: text("updated_by").notNull(),
    isDisabled: integer("is_disabled", { mode: "boolean" }).default(false),
  },
  (table) => [
    index("idx_expense_tracker_user_id").on(table.userId),
    index("idx_user_expense_period").on(table.userId, table.expensePeriod),
    index("idx_foreign_keys").on(table.tagId, table.modeId, table.fynixId),
    index("composite_tag_amount").on(table.tagId, table.amount),
    index("composite_mode_amount").on(table.modeId, table.amount),
    index("composite_fynix_amount").on(table.fynixId, table.amount),
  ],
);
