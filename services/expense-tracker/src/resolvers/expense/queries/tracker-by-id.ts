import { APIs } from "@src/services";
import { ExpenseTracker, QueryExpenseTrackerByIdArgs } from "generated";
import { GraphQLError } from "graphql";

export const expenseTrackerById = async (
  _: unknown,
  args: QueryExpenseTrackerByIdArgs,
  { apis: { expenseAPI } }: { apis: APIs },
): Promise<ExpenseTracker> => {
  try {
    return await expenseAPI.expenseTrackerById(args);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to get expense by id", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
