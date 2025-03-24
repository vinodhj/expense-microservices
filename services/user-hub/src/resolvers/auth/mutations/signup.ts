import { SignUpInput, SignUpResponse } from "generated";
import { GraphQLError } from "graphql";
import { APIs } from "@src/services";

export const signUp = async (
  _: unknown,
  { input }: { input: SignUpInput },
  { apis: { authAPI } }: { apis: APIs },
): Promise<SignUpResponse> => {
  try {
    return await authAPI.signUp(input);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to sign up", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
