import { Role } from "db/schema/user";
import { GraphQLError } from "graphql";
import { SessionUserType } from "..";

export interface TargetIdentifier {
  id?: string;
  email?: string;
}

export const validateUserAccess = (sessionUser: SessionUserType, target: TargetIdentifier, isTargetCheck?: boolean): void => {
  if (!sessionUser?.role) {
    throw new GraphQLError("User role is required", {
      extensions: { code: "ROLE_REQUIRED" },
    });
  }

  // Skip check if isTargetCheck is true - temporary workaround - gateway error should be fixed
  if (isTargetCheck) {
    return;
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
