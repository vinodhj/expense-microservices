import { UserDataSource } from "@src/datasources/user";
import { validateUserAccess } from "@src/services/helper/userAccessValidators";
import { Role } from "db/schema/user";
import { ColumnName, DeleteUserInput, EditUserInput, UserByEmailInput, UserByFieldInput } from "generated";
import { GraphQLError } from "graphql";
import { SessionUserType } from ".";

export class UserServiceAPI {
  private readonly userDataSource: UserDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ userDataSource, sessionUser }: { userDataSource: UserDataSource; sessionUser?: SessionUserType }) {
    this.userDataSource = userDataSource;
    this.sessionUser = sessionUser ?? null;
  }

  async users(accessToken: string | null) {
    // Validate access rights
    validateUserAccess(accessToken, this.sessionUser, {});
    return await this.userDataSource.users();
  }

  async userByEmail(input: UserByEmailInput, accessToken: string | null) {
    validateUserAccess(accessToken, this.sessionUser, { email: input.email });
    const result = await this.userDataSource.userByEmail(input);
    if (!result) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return result;
  }

  async userByField(input: UserByFieldInput, accessToken: string | null) {
    if (input.field === ColumnName.Id || input.field === ColumnName.Email) {
      validateUserAccess(accessToken, this.sessionUser, { [input.field]: input.value });
    } else {
      validateUserAccess(accessToken, this.sessionUser, {});
    }

    let value = input.value;
    if (input.field === ColumnName.Role) {
      const validRoles = ["ADMIN", "USER"];
      if (!validRoles.includes(input.value.toUpperCase())) {
        throw new GraphQLError("Invalid role value", {
          extensions: {
            code: "INPUT_INVALID_ROLE",
          },
        });
      }
      value = input.value.toUpperCase() === "ADMIN" ? Role.Admin : Role.User;
    } else if (input.field === ColumnName.Name) {
      // Concatenate a wildcard % with the user_id
      value = `${input.value}%`;
    }
    return await this.userDataSource.userByfield({
      field: input.field,
      value,
    });
  }

  async editUser(input: EditUserInput, accessToken: string | null) {
    validateUserAccess(accessToken, this.sessionUser, { id: input.id });
    return await this.userDataSource.editUser(input);
  }

  async deleteUser(input: DeleteUserInput, accessToken: string | null) {
    validateUserAccess(accessToken, this.sessionUser, { id: input.id });
    return await this.userDataSource.deleteUser(input);
  }
}
