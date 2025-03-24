import { APIs } from "@src/services";
import { UserByEmailInput } from "generated";
import { GraphQLError } from "graphql";

export const userByEmail = async (_: unknown, { input }: { input: UserByEmailInput }, { apis: { userAPI } }: { apis: APIs }) => {
  try {
    return await userAPI.userByEmail(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to get user", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
