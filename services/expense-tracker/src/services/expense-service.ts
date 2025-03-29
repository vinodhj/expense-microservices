import { ExpenseDataSource } from "@src/datasources/expense-datasources";
import { SessionUserType } from ".";
import {
  CreateExpenseTrackerInput,
  DeleteExpenseTrackerInput,
  ExpenseTracker,
  ExpenseTrackerResponse,
  QueryExpenseTrackerByIdArgs,
  UpdateExpenseTrackerInput,
} from "generated";
import { trackerAccessValidators, trackerInputValidators } from "./helper/tracker-access-validators";
import { GraphQLError } from "graphql";

export class ExpenseServiceAPI {
  private readonly expenseDataSource: ExpenseDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ expenseDataSource, sessionUser }: { expenseDataSource: ExpenseDataSource; sessionUser: SessionUserType }) {
    this.expenseDataSource = expenseDataSource;
    this.sessionUser = sessionUser;
  }

  async expenseTrackerById(args: QueryExpenseTrackerByIdArgs): Promise<ExpenseTracker> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: args.session_id } });
      /**
       * The type assertion as ExpenseTracker tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      return (await this.expenseDataSource.expenseTrackerById(args.id)) as ExpenseTracker;
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

  async updateExpenseTracker(input: UpdateExpenseTrackerInput): Promise<ExpenseTrackerResponse> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: input.user_id } });

      trackerInputValidators(input);

      return await this.expenseDataSource.updateExpenseTracker(input);
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to update expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async deleteExpenseTracker(input: DeleteExpenseTrackerInput): Promise<boolean> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: input.user_id } });

      return await this.expenseDataSource.deleteExpenseTracker(input);
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to update expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }
}
