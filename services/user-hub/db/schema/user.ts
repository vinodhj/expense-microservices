import { text, integer, sqliteTable, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export enum Role {
  Admin = "ADMIN",
  User = "USER",
}

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(), // nano id
    name: text("name").notNull(),
    email: text("email").unique().notNull(),
    password: text("password").notNull(),
    role: text("role", { enum: ["ADMIN", "USER"] })
      .notNull()
      .$type<Role>(),
    phone: text("phone").unique().notNull(),
    address: text("address"),
    city: text("city"),
    state: text("state"),
    country: text("country"),
    zipcode: text("zipcode"),
    created_at: integer("created_at", { mode: "timestamp_ms" })
      .$default(() => new Date())
      .notNull(),
    updated_at: integer("updated_at", { mode: "timestamp_ms" })
      .$default(() => new Date())
      .notNull(),
    created_by: text("created_by").notNull(),
    updated_by: text("updated_by").notNull(),
  },
  (table) => [
    index("idx_email").on(table.email),
    index("idx_phone").on(table.phone),
    uniqueIndex("composite_email_phone").on(table.email, table.phone),
  ],
);
