import { GraphQLError } from "graphql";
import { APIs } from "@src/services";
import { ExpenseTrackerResponse, UpdateExpenseTrackerInput } from "generated";

export const updateExpenseTracker = async (
  _: unknown,
  { input }: { input: UpdateExpenseTrackerInput },
  { apis: { expenseAPI } }: { apis: APIs },
): Promise<ExpenseTrackerResponse> => {
  try {
    return await expenseAPI.updateExpenseTracker(input);
  } catch (error) {
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
};
