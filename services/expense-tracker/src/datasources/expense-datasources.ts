import { DrizzleD1Database } from "drizzle-orm/d1";
import { SessionUserType } from "@src/services";
import { GraphQLError } from "graphql";
import { nanoid } from "nanoid";
import { expenseStatusType, expenseTracker } from "db/schema/tracker";
import { CreateExpenseTrackerInput, ExpenseStatus, ExpenseTrackerResponse, UpdateExpenseTrackerInput } from "generated";
import { eq } from "drizzle-orm";

export class ExpenseDataSource {
  private readonly db: DrizzleD1Database;
  private readonly sessionUser: SessionUserType;

  // Constants for pagination and batching
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100; // Set maximum page size
  private readonly BATCH_SIZE = 50; // Maximum number of IDs to fetch in a single batch

  constructor({ db, sessionUser }: { db: DrizzleD1Database; sessionUser: SessionUserType }) {
    this.db = db;
    this.sessionUser = sessionUser;
  }

  // Mapping for status to reduce repetitive code
  private static readonly STATUS_MAP: Record<string, expenseStatusType> = {
    Paid: expenseStatusType.Paid,
    UnPaid: expenseStatusType.UnPaid,
    NextDue: expenseStatusType.NextDue,
  };

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
}
