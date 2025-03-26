import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";

export const expenseTags = sqliteTable(
  "expense_tags",
  {
    id: text("id").primaryKey(),
    name: text("name").unique().notNull(),
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
  (table) => [index("idx_tags_name").on(table.name)],
);
