import { APIs } from "@src/services";
import { ExpenseTrackerConnection, QueryPaginatedExpenseTrackersArgs } from "generated";
import { GraphQLError } from "graphql";

export const paginatedExpenseTrackers = async (
  _: unknown,
  args: QueryPaginatedExpenseTrackersArgs,
  { apis: { expenseAPI } }: { apis: APIs },
): Promise<ExpenseTrackerConnection> => {
  try {
    return await expenseAPI.paginatedExpenseTrackers(args);
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
