import { EditUserInput, EditUserResponse } from "generated";
import { GraphQLError } from "graphql";
import { APIs } from "@src/services";

export const editUser = async (
  _: unknown,
  { input }: { input: EditUserInput },
  { apis: { userAPI } }: { apis: APIs },
): Promise<EditUserResponse> => {
  try {
    return await userAPI.editUser(input);
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
