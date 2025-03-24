import { APIs } from "@src/services";
import { UserByFieldInput, UserResponse } from "generated";
import { GraphQLError } from "graphql";

export const userByfield = async (
  _: unknown,
  { input }: { input: UserByFieldInput },
  { apis: { userAPI } }: { apis: APIs },
): Promise<Array<UserResponse>> => {
  try {
    return await userAPI.userByField(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to get user by field", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
