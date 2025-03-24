import { APIs } from "@src/services";
import { ChangePasswordInput } from "generated";
import { GraphQLError } from "graphql";

export const changePassword = async (
  _: unknown,
  { input }: { input: ChangePasswordInput },
  { apis: { authAPI } }: { apis: APIs },
): Promise<boolean> => {
  try {
    return await authAPI.changePassword(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to change password", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
