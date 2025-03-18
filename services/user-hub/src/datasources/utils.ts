import bcrypt from "bcryptjs";
import { GraphQLError } from "graphql";

export async function validateCurrentPassword(currentPassword: string, storedPassword: string) {
  const isPasswordMatch = await bcrypt.compare(currentPassword, storedPassword);
  if (!isPasswordMatch) {
    throw new GraphQLError("Invalid current password", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }
}

export async function handleError(error: unknown, message: string) {
  console.error("error", error);
  if (error instanceof GraphQLError || error instanceof Error) {
    throw new GraphQLError(`${message} ${error.message ? "- " + error.message : ""}`, {
      extensions: {
        code: error instanceof GraphQLError ? error.extensions.code : "INTERNAL_SERVER_ERROR",
        error: error.message,
      },
    });
  }
  throw new GraphQLError(`${message} due to an unexpected error`, {
    extensions: {
      code: "INTERNAL_SERVER_ERROR",
      error,
    },
  });
}
