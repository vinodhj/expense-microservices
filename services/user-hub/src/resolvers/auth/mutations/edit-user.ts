import { EditUserInput } from "generated";
import { GraphQLError } from "graphql";
import { APIs } from "@src/services";

export const editUser = async (
  _: unknown,
  { input }: { input: EditUserInput },
  { apis: { userAPI }, accessToken }: { apis: APIs; accessToken: string | null },
) => {
  try {
    return await userAPI.editUser(input, accessToken);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to edit user", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
