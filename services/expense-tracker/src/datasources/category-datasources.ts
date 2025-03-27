import { DrizzleD1Database } from "drizzle-orm/d1";
import { SessionUserType } from "@src/services";
import { GraphQLError } from "graphql";
import { CategoryType } from "generated";
import { nanoid } from "nanoid";
import { expenseTags } from "db/schema/tags";
import { expenseModes } from "db/schema/modes";
import { expenseFynix } from "db/schema/fynix";
import { eq, Table } from "drizzle-orm";
import { SQLiteColumn } from "drizzle-orm/sqlite-core";

// Define an interface to extend the Table type with column
interface CategoryTable extends Table {
  id: SQLiteColumn;
  name: SQLiteColumn;
  is_disabled?: SQLiteColumn;
  created_at?: SQLiteColumn;
  updated_at?: SQLiteColumn;
  created_by?: SQLiteColumn;
  updated_by?: SQLiteColumn;
}

export class CategoryDataSource {
  private readonly db: DrizzleD1Database;
  private readonly sessionUser: SessionUserType;

  // Constants for pagination and batching
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100; // Set maximum page size
  private readonly BATCH_SIZE = 50; // Maximum number of IDs to fetch in a single batch
  private readonly tables: { [key in CategoryType]: CategoryTable };

  constructor({ db, sessionUser }: { db: DrizzleD1Database; sessionUser: SessionUserType }) {
    this.db = db;
    this.sessionUser = sessionUser;
    this.tables = {
      [CategoryType.ExpenseTag]: expenseTags,
      [CategoryType.ExpenseMode]: expenseModes,
      [CategoryType.ExpenseFynix]: expenseFynix,
    };
  }

  async createCategory(category_type: CategoryType, name: string) {
    try {
      const tableName = this.tables[category_type];
      const result = await this.db
        .insert(tableName)
        .values({
          id: nanoid(),
          name,
          created_by: this.sessionUser.name,
          updated_by: this.sessionUser.name,
        })
        .returning()
        .get();
      const { id, name: category_name } = result;
      return {
        success: true,
        category: {
          id,
          name: category_name,
          category_type,
        },
      };
    } catch (error) {
      console.log("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to create category: ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to create category due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async updateCategory({ category_type, name, id }: { category_type: CategoryType; name: string; id: string }) {
    try {
      const tableName = this.tables[category_type];
      const updateData = {
        name,
        updated_at: new Date(),
        updated_by: this.sessionUser.name,
      };
      const result = await this.db.update(tableName).set(updateData).where(eq(tableName.id, id)).returning().get();

      if (!result) {
        throw new GraphQLError(`Category with id ${id} not found`, {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      const { id: category_id, name: category_name } = result;
      return {
        success: true,
        category: {
          id: category_id,
          name: category_name,
          category_type,
        },
      };
    } catch (error) {
      console.log("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to update category: ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to update category due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async deleteCategory(category_type: CategoryType, id: string) {
    try {
      const tableName = this.tables[category_type];
      const updateData = {
        is_disabled: true,
        updated_at: new Date(),
        updated_by: this.sessionUser.name,
      };
      const result = await this.db.update(tableName).set(updateData).where(eq(tableName.id, id)).returning().get();

      if (!result) {
        throw new GraphQLError(`Delete Category with id ${id} not found`, {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }

      return true;
    } catch (error) {
      console.log("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to delete category: ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to delete category due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }
}
