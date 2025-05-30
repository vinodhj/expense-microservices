import { APIs } from "@src/services";
import { UserResponse } from "generated";
import { GraphQLError } from "graphql";

export const users = async (_: unknown, __: unknown, { apis: { userAPI } }: { apis: APIs }): Promise<Array<UserResponse>> => {
  try {
    return await userAPI.users();
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
