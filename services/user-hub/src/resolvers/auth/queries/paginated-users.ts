import { APIs } from "@src/services";
import { PaginatedUsersInputs, UsersConnection } from "generated";
import { GraphQLError } from "graphql";

export const paginatedUsers = async (
  _: unknown,
  { ids, input }: { ids: Array<string>; input: PaginatedUsersInputs },
  { apis: { userAPI } }: { apis: APIs },
): Promise<UsersConnection> => {
  try {
    return await userAPI.paginatedUsers(ids, input);
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
