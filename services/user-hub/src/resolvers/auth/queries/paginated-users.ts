import { APIs } from "@src/services";
import { PaginatedUsersInputs } from "generated";
import { GraphQLError } from "graphql";

export const paginatedUsers = async (_: unknown, { input }: { input: PaginatedUsersInputs }, { apis: { userAPI } }: { apis: APIs }) => {
  try {
    return await userAPI.paginatedUsers(input);
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
