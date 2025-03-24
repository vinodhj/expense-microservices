import { GraphQLError } from "graphql";
import { APIs } from "@src/services";

export const logout = async (_: unknown, __: unknown, { apis: { authAPI }, accessToken }: { apis: APIs; accessToken: string }) => {
  try {
    return await authAPI.logout(accessToken);
  } catch (error) {
    if (error instanceof GraphQLError || error instanceof Error) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to logout", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
