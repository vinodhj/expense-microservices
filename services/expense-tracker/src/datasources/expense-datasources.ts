import { DrizzleD1Database } from "drizzle-orm/d1";
import { SessionUserType } from "@src/services";
import { GraphQLError } from "graphql";
import { nanoid } from "nanoid";
import { expenseStatusType, expenseTracker } from "db/schema/tracker";
import {
  CreateExpenseTrackerInput,
  DeleteExpenseTrackerInput,
  ExpenseStatus,
  ExpenseTrackerResponse,
  PaginatedExpenseInputs,
  Sort,
  Sort_By,
  UpdateExpenseTrackerInput,
} from "generated";
import { eq, inArray, asc, desc, SQLWrapper, gt, lt } from "drizzle-orm";
import DataLoader from "dataloader";

export class ExpenseDataSource {
  private readonly db: DrizzleD1Database;
  private readonly sessionUser: SessionUserType;
  private readonly expenseLoader: DataLoader<string, typeof expenseTracker.$inferSelect | Error>;

  // Constants for pagination and batching
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100; // Set maximum page size
  private readonly BATCH_SIZE = 50; // Maximum number of IDs to fetch in a single batch

  constructor({ db, sessionUser }: { db: DrizzleD1Database; sessionUser: SessionUserType }) {
    this.db = db;
    this.sessionUser = sessionUser;
    this.expenseLoader = new DataLoader(
      async (ids: readonly string[]) => {
        // batch fetch
        return this.expenseByUserBatchIds(ids as string[]);
      },
      {
        maxBatchSize: this.BATCH_SIZE, // Set maximum batch size
      },
    );
  }

  async expenseByUserBatchIds(ids: string[]) {
    try {
      const result = await this.db.select().from(expenseTracker).where(inArray(expenseTracker.user_id, ids)).execute();
      if (!result) {
        return [];
      }

      // Map results to ensure order matches the requested user IDs
      const expenseMap = new Map(result.map((e) => [e.user_id, e]));
      return ids.map((id) => expenseMap.get(id) || new Error(`User with ID ${id} not found`));
    } catch (error) {
      console.log(error);
      throw new GraphQLError("Failed to fetch expense user by batch ids", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async expenseByUserIds(ids: string[]) {
    try {
      const results = await this.expenseLoader.loadMany(ids);
      // Filter out errors and handle them
      const expenses: (typeof expenseTracker.$inferSelect)[] = [];
      const errors: Error[] = [];

      results.forEach((result) => {
        if (result instanceof Error) {
          errors.push(result);
        } else {
          expenses.push(result);
        }
      });

      if (errors.length > 0) {
        console.error("Errors loading some expenses:", errors);
      }

      return expenses;
    } catch (error) {
      console.error("Failed to load expense by user ids:", error);
      throw new GraphQLError("Failed to fetch users", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async paginatedExpenseTrackers(input: PaginatedExpenseInputs) {
    const { after, sort_by = Sort_By.UpdatedAt } = input;
    const sort = input.sort === Sort.Asc ? Sort.Asc : Sort.Desc;

    // Apply default and maximum page size limits from class constants
    const requestedLimit = input.first ?? this.DEFAULT_PAGE_SIZE;
    const first = Math.min(requestedLimit, this.MAX_PAGE_SIZE);
    const sortField = sort_by === Sort_By.CreatedAt ? expenseTracker.created_at : expenseTracker.updated_at;

    try {
      // Use the helper function to parse the cursor date safely
      const afterDate = this.parseCursorDate(after);

      // Fetch all the user with pagination
      const result = await this.db
        .select()
        .from(expenseTracker)
        .orderBy(this.sorter(sortField, sort))
        .where(sort === Sort.Asc ? gt(sortField, afterDate || new Date(0)) : lt(sortField, afterDate || new Date()))
        .limit(first + 1) // Fetch one extra to determine if there are more pages
        .execute();

      // Check if there's a next page and trim the extra result
      const hasNextPage = result.length > first;
      const items = hasNextPage ? result.slice(0, first) : result;

      // Convert services to edges
      const edges = items.map((item) => ({
        cursor: (sort_by === Sort_By.CreatedAt ? item.created_at : item.updated_at).toISOString(),
        node: item as typeof expenseTracker.$inferSelect,
      }));

      return {
        edges,
        pageInfo: {
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          hasNextPage,
        },
      };
    } catch (error: any) {
      console.error("Error in paginatedUsers:", error);
      throw new GraphQLError("Failed to get paginated users", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  // Mapping for status to reduce repetitive code
  private static readonly STATUS_MAP: Record<string, expenseStatusType> = {
    Paid: expenseStatusType.Paid,
    UnPaid: expenseStatusType.UnPaid,
    NextDue: expenseStatusType.NextDue,
  };

  async expenseTrackerById(id: string) {
    try {
      const result = await this.db.select().from(expenseTracker).where(eq(expenseTracker.id, id)).get();

      if (!result) {
        throw new GraphQLError(`Expense with id ${id} not found`, {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }
      const transformedResult = {
        ...result,
        status: ExpenseDataSource.getExpenseStatusFromType(result.status),
      };
      return transformedResult;
    } catch (error: any) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to get expense by id", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  async createExpenseTracker(input: CreateExpenseTrackerInput): Promise<ExpenseTrackerResponse> {
    try {
      // Validate and map status
      const input_status = ExpenseDataSource.STATUS_MAP[input.status];
      if (!input_status) {
        throw new GraphQLError("Invalid status. Please Provide valid status", {
          extensions: { code: "INVALID_INPUT" },
        });
      }

      // Validate expense period
      if (!this.isValidExpensePeriod(input.expense_period)) {
        throw new GraphQLError("Invalid expense period format", {
          extensions: { code: "INVALID_EXPENSE_PERIOD" },
        });
      }

      const insert_values = {
        id: nanoid(),
        ...input,
        status: input_status,
        expense_period: input.expense_period,
        amount: Number(input.amount),
        description: input.description ?? null,
        item_details: input.item_details ?? null,
        created_by: this.sessionUser.name,
        updated_by: this.sessionUser.name,
      };
      const result = await this.db.insert(expenseTracker).values(insert_values).returning().get();
      return {
        success: true,
        expenseTracker: {
          ...result,
          status: ExpenseDataSource.getExpenseStatusFromType(result.status),
        },
      };
    } catch (error) {
      console.log("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to create expense: ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to create expense due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async updateExpenseTracker(input: UpdateExpenseTrackerInput): Promise<ExpenseTrackerResponse> {
    try {
      const { id, user_id, ...updateValues } = input;
      // Validate and map status
      const input_status = ExpenseDataSource.STATUS_MAP[input.status];
      if (!input_status) {
        throw new GraphQLError("Invalid status. Please Provide valid status", {
          extensions: { code: "INVALID_INPUT" },
        });
      }

      // Validate expense period
      if (!this.isValidExpensePeriod(input.expense_period)) {
        throw new GraphQLError("Invalid expense period format", {
          extensions: { code: "INVALID_EXPENSE_PERIOD" },
        });
      }

      const updateData = {
        ...updateValues,
        status: input_status,
        expense_period: input.expense_period,
        amount: Number(input.amount),
        description: input.description ?? null,
        item_details: input.item_details ?? null,
        created_by: this.sessionUser.name,
        updated_by: this.sessionUser.name,
      };

      const result = await this.db.update(expenseTracker).set(updateData).where(eq(expenseTracker.id, id)).returning().get();

      if (!result) {
        throw new GraphQLError(`Expense with id ${id} not found`, {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }
      return {
        success: true,
        expenseTracker: {
          ...result,
          status: ExpenseDataSource.getExpenseStatusFromType(result.status),
        },
      };
    } catch (error) {
      console.log("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to update expense: ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to update expense due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async deleteExpenseTracker(input: DeleteExpenseTrackerInput): Promise<boolean> {
    try {
      const { id } = input;

      const updateData = {
        is_disabled: true,
        created_by: this.sessionUser.name,
        updated_by: this.sessionUser.name,
      };

      const result = await this.db.update(expenseTracker).set(updateData).where(eq(expenseTracker.id, id)).returning().get();

      if (!result) {
        throw new GraphQLError(`Expense with id ${id} not found`, {
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
        throw new GraphQLError(`Failed to delete expense: ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to delete expense due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  private static getExpenseStatusFromType(status: expenseStatusType): ExpenseStatus {
    switch (status) {
      case expenseStatusType.Paid:
        return ExpenseStatus.Paid;
      case expenseStatusType.UnPaid:
        return ExpenseStatus.UnPaid;
      case expenseStatusType.NextDue:
        return ExpenseStatus.NextDue;
    }
  }

  private isValidExpensePeriod(period: string): period is `${number}-${number}` {
    const regex = /^\d{4}-\d{2}$/;
    return regex.test(period);
  }

  private sorter(field: SQLWrapper, sort: Sort) {
    if (sort === Sort.Asc) {
      return asc(field);
    }
    return desc(field);
  }
  private parseCursorDate(cursor: string | null | undefined): Date | undefined {
    if (!cursor) return undefined;

    try {
      const date = new Date(cursor);
      if (isNaN(date.getTime())) {
        throw new GraphQLError("Invalid cursor date", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }
      return date;
    } catch (error) {
      throw new GraphQLError("Invalid cursor format", {
        extensions: {
          code: "BAD_USER_INPUT",
          error,
        },
      });
    }
  }
}
