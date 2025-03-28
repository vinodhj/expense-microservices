import { ExpenseDataSource } from "@src/datasources/expense-datasources";
import { SessionUserType } from ".";
import { CreateExpenseTrackerInput, ExpenseTrackerResponse } from "generated";
import { trackerAccessValidators, trackerInputValidators } from "./helper/tracker-access-validators";
import { GraphQLError } from "graphql";

export class ExpenseServiceAPI {
  private readonly expenseDataSource: ExpenseDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ expenseDataSource, sessionUser }: { expenseDataSource: ExpenseDataSource; sessionUser: SessionUserType }) {
    this.expenseDataSource = expenseDataSource;
    this.sessionUser = sessionUser;
  }

  async createExpenseTracker(input: CreateExpenseTrackerInput): Promise<ExpenseTrackerResponse> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: input.user_id } });

      trackerInputValidators(input);

      return await this.expenseDataSource.createExpenseTracker(input);
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to create expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }
}
