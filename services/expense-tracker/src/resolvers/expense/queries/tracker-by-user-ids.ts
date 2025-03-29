import { APIs } from "@src/services";
import { ExpenseTracker, QueryExpenseTrackerByUserIdsArgs } from "generated";
import { GraphQLError } from "graphql";

export const expenseTrackerByUserIds = async (
  _: unknown,
  args: QueryExpenseTrackerByUserIdsArgs,
  { apis: { expenseAPI } }: { apis: APIs },
): Promise<Array<ExpenseTracker>> => {
  try {
    return await expenseAPI.expenseTrackerByUserIds(args);
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
