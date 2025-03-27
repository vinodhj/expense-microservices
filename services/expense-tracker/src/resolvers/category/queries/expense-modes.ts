import { APIs } from "@src/services";
import { Category, CategoryType, QueryExpenseModesArgs } from "generated";
import { GraphQLError } from "graphql";

export const expenseModes = async (
  _: unknown,
  { input = {} }: Partial<QueryExpenseModesArgs>,
  { apis: { categoryAPI } }: { apis: APIs },
): Promise<Array<Category>> => {
  try {
    const category_type = CategoryType.ExpenseMode;
    const filteredInput = input ?? {};
    return await categoryAPI.category(category_type, filteredInput);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to get users", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
