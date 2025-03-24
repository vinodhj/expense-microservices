import { APIs } from "@src/services";
import { DeleteUserInput } from "generated";
import { GraphQLError } from "graphql";

export const deleteUser = async (
  _: unknown,
  { input }: { input: DeleteUserInput },
  {
    apis: { userAPI },
  }: {
    apis: APIs;
  },
): Promise<boolean> => {
  try {
    return await userAPI.deleteUser(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to delete user", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
