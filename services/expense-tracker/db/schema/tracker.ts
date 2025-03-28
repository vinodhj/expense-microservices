import { text, real, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";
import { expenseTags } from "./tags";
import { expenseModes } from "./modes";
import { expenseFynix } from "./fynix";

export enum expenseStatusType {
  Paid = "Paid",
  UnPaid = "UnPaid",
  NextDue = "NextDue",
}

export const expenseTracker = sqliteTable(
  "expense_tracker",
  {
    id: text("id").primaryKey(),
    user_id: text("user_id").notNull(),
    expense_period: text("expense_period").notNull().$type<`${number}-${number}`>(),
    amount: real("amount").notNull().$type<number>(),
    description: text("description"),
    item_details: text("item_details"),
    tag_id: text("tag_id")
      .notNull()
      .references(() => expenseTags.id, { onUpdate: "restrict", onDelete: "restrict" }),
    mode_id: text("mode_id")
      .notNull()
      .references(() => expenseModes.id, { onUpdate: "restrict", onDelete: "restrict" }),
    fynix_id: text("fynix_id")
      .notNull()
      .references(() => expenseFynix.id, { onUpdate: "restrict", onDelete: "restrict" }),
    status: text("status", { enum: ["Paid", "UnPaid", "NextDue"] })
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
    is_disabled: integer("is_disabled", { mode: "boolean" }).default(false),
  },
  (table) => [
    index("idx_expense_tracker_user_id").on(table.user_id),
    index("idx_user_expense_period").on(table.user_id, table.expense_period),
    index("idx_foreign_keys").on(table.tag_id, table.mode_id, table.fynix_id),
    index("composite_tag_amount").on(table.tag_id, table.amount),
    index("composite_mode_amount").on(table.mode_id, table.amount),
    index("composite_fynix_amount").on(table.fynix_id, table.amount),
  ],
);
