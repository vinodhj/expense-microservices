import { APIs } from "@src/services";
import { GraphQLError } from "graphql";

export const users = async (_: unknown, __: unknown, { apis: { userAPI }, accessToken }: { accessToken: string | null; apis: APIs }) => {
  try {
    return await userAPI.users(accessToken);
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
