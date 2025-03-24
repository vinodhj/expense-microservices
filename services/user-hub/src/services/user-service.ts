import { UserDataSource } from "@src/datasources/user";
import { validateUserAccess } from "@src/services/helper/userAccessValidators";
import { Role } from "db/schema/user";
import {
  ColumnName,
  DeleteUserInput,
  EditUserInput,
  EditUserResponse,
  PaginatedUsersInputs,
  UserByEmailInput,
  UserByFieldInput,
  UserResponse,
  UsersConnection,
} from "generated";
import { GraphQLError } from "graphql";
import { SessionUserType } from ".";

export class UserServiceAPI {
  private readonly userDataSource: UserDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ userDataSource, sessionUser }: { userDataSource: UserDataSource; sessionUser?: SessionUserType }) {
    this.userDataSource = userDataSource;
    this.sessionUser = sessionUser ?? null;
  }

  async paginatedUsers(ids: Array<string>, input: PaginatedUsersInputs): Promise<UsersConnection> {
    // Validate access rights
    validateUserAccess(this.sessionUser, {});
    // If input params have ids, we will retrieve users using their ids, if not, we will retrieve users using pagination.
    if (ids && ids.length > 0) {
      return this.userDataSource.userByIds(ids);
    }
    return this.userDataSource.paginatedUsers(input);
  }

  async users(): Promise<Array<UserResponse>> {
    // Validate access rights
    validateUserAccess(this.sessionUser, {});
    return await this.userDataSource.users();
  }

  async userByEmail(input: UserByEmailInput): Promise<UserResponse> {
    validateUserAccess(this.sessionUser, { email: input.email });
    const result = await this.userDataSource.userByEmail(input);
    if (!result) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }
    return result;
  }

  async userByField(input: UserByFieldInput): Promise<Array<UserResponse>> {
    if (input.field === ColumnName.Id || input.field === ColumnName.Email) {
      validateUserAccess(this.sessionUser, { [input.field]: input.value });
    } else {
      validateUserAccess(this.sessionUser, {});
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

  async editUser(input: EditUserInput): Promise<EditUserResponse> {
    validateUserAccess(this.sessionUser, { id: input.id });
    return await this.userDataSource.editUser(input);
  }

  async deleteUser(input: DeleteUserInput): Promise<boolean> {
    validateUserAccess(this.sessionUser, { id: input.id });
    return await this.userDataSource.deleteUser(input);
  }
}
