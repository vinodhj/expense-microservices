import { GraphQLError } from "graphql";
import { APIs } from "@src/services";
import { DeleteCategoryInput } from "generated";

export const deleteCategory = async (
  _: unknown,
  { input }: { input: DeleteCategoryInput },
  { apis: { categoryAPI } }: { apis: APIs },
): Promise<boolean> => {
  try {
    return await categoryAPI.deleteCategory(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to update category", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
