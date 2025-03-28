import { GraphQLError } from "graphql";
import { APIs } from "@src/services";
import { CreateExpenseTrackerInput, ExpenseTrackerResponse } from "generated";

export const createExpenseTracker = async (
  _: unknown,
  { input }: { input: CreateExpenseTrackerInput },
  { apis: { expenseAPI } }: { apis: APIs },
): Promise<ExpenseTrackerResponse> => {
  try {
    return await expenseAPI.createExpenseTracker(input);
  } catch (error) {
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
};
