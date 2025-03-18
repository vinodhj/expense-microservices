import { Role } from "db/schema/user";
import { GraphQLError } from "graphql";
import { SessionUserType } from "..";

export interface TargetIdentifier {
  id?: string;
  email?: string;
}

export const validateUserAccess = (accessToken: string | null, sessionUser: SessionUserType, target: TargetIdentifier): void => {
  if (!accessToken) {
    throw new GraphQLError("Unauthorized token", {
      extensions: {
        code: "UNAUTHORIZED",
      },
    });
  }

  if (!sessionUser?.role) {
    throw new GraphQLError("User role is required", {
      extensions: { code: "ROLE_REQUIRED" },
    });
  }

  // Check if the session user is modifying their own record by id or email
  const isSameUser = (target.id && sessionUser.id === target.id) || (target.email && sessionUser.email === target.email);

  // Allow if the user is editing their own record or is an admin.
  if (isSameUser || sessionUser.role === Role.Admin) {
    return;
  }

  throw new GraphQLError("Your Role not authorized to perform this action", {
    extensions: { code: "UNAUTHORIZED_ROLE" },
  });
};
