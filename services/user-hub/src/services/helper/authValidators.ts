import { GraphQLError } from "graphql";

export const validateEmailAndPassword = (email: string, password: string): void => {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new GraphQLError("Invalid email format", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  // Validate password length
  if (password.length < 6) {
    throw new GraphQLError("Password must be at least 6 characters long", {
      extensions: {
        code: "BAD_USER_INPUT",
      },
    });
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
  if (!passwordRegex.test(password)) {
    throw new GraphQLError(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      {
        extensions: { code: "BAD_USER_INPUT" },
      },
    );
  }
};
