import { GraphQLError } from "graphql";

export const changePasswordValidators = (current_password: string, new_password: string, confirm_password: string): void => {
  // Validate password length
  if (current_password.length < 6 || new_password.length < 6 || confirm_password.length < 6) {
    throw new GraphQLError("Password must be at least 6 characters long", {
      extensions: {
        code: "INPUT_INVALID_PASSWORDS",
      },
    });
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(current_password) || !passwordRegex.test(new_password) || !passwordRegex.test(confirm_password)) {
    throw new GraphQLError(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      {
        extensions: { code: "INPUT_INVALID_PASSWORDS" },
      },
    );
  }

  // Validate current password
  if (current_password === new_password) {
    throw new GraphQLError("New password cannot be the same as the current password", {
      extensions: {
        code: "INPUT_INVALID_PASSWORDS",
      },
    });
  }

  // Validate password confirmation
  if (confirm_password !== new_password) {
    throw new GraphQLError("Passwords do not match", {
      extensions: {
        code: "INPUT_INVALID_PASSWORDS",
      },
    });
  }
};
