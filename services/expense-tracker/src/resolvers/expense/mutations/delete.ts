import { GraphQLError } from "graphql";
import { APIs } from "@src/services";
import { DeleteExpenseTrackerInput } from "generated";

export const deleteExpenseTracker = async (
  _: unknown,
  { input }: { input: DeleteExpenseTrackerInput },
  { apis: { expenseAPI } }: { apis: APIs },
): Promise<boolean> => {
  try {
    return await expenseAPI.deleteExpenseTracker(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to delete expense", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
