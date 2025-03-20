import { Role } from "db/schema/user";
import { GraphQLError } from "graphql";
import jwt, { SignOptions } from "jsonwebtoken";

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: Role;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

export const generateToken = (payload: TokenPayload, secret: jwt.Secret, expiresIn: SignOptions["expiresIn"]): string => {
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (error) {
    console.error("Error generating token:", error);
    throw new GraphQLError("Failed to generate token", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
