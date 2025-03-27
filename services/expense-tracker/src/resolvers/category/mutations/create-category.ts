import { GraphQLError } from "graphql";
import { APIs } from "@src/services";
import { CategoryResponse, CreateCategoryInput } from "generated";

export const createCategory = async (
  _: unknown,
  { input }: { input: CreateCategoryInput },
  { apis: { categoryAPI } }: { apis: APIs },
): Promise<CategoryResponse> => {
  try {
    return await categoryAPI.createCategory(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to create category", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
