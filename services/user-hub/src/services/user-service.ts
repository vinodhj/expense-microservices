import { UserDataSource } from "@src/datasources/user";
import { validateUserAccess } from "@src/services/helper/userAccessValidators";
import { Role } from "db/schema/user";
import {
  ColumnName,
  DeleteUserInput,
  EditUserInput,
  EditUserResponse,
  InputMaybe,
  PaginatedUsersInputs,
  Sort,
  Sort_By,
  UserByEmailInput,
  UserByFieldInput,
  UserResponse,
  UsersConnection,
} from "generated";
import { GraphQLError } from "graphql";
import { SessionUserType } from ".";
import { userCache } from "@src/cache/in-memory-cache";

export class UserServiceAPI {
  private readonly userDataSource: UserDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ userDataSource, sessionUser }: { userDataSource: UserDataSource; sessionUser?: SessionUserType }) {
    this.userDataSource = userDataSource;
    this.sessionUser = sessionUser ?? null;
  }

  async paginatedUsers(
    ids: InputMaybe<string[]> | undefined,
    input: InputMaybe<PaginatedUsersInputs> | undefined,
  ): Promise<UsersConnection> {
    // Validate access rights
    validateUserAccess(this.sessionUser, {});

    const processedInput = input ?? {
      first: 10,
      sort: Sort.Desc,
      sort_by: Sort_By.CreatedAt,
    };

    // Create a unique cache key for the request
    const cacheKey = ids && ids.length > 0 ? `users:ids:${ids.join(",")}` : `users:paginated:${JSON.stringify(input)}`;

    // Check cache first
    const cachedResult = userCache.get(cacheKey);
    if (cachedResult) {
      console.log("hit cache: paginatedUsers");
      return cachedResult;
    }

    // If input params have ids, we will retrieve users using their ids, if not, we will retrieve users using pagination.
    let result: UsersConnection;
    if (ids && ids.length > 0) {
      result = await this.userDataSource.userByIds(ids);
    }
    result = await this.userDataSource.paginatedUsers(processedInput);

    // Cache the result
    userCache.set(cacheKey, result);

    return result;
  }

  async users(): Promise<Array<UserResponse>> {
    // Validate access rights
    validateUserAccess(this.sessionUser, {});

    // Check cache first
    const cacheKey = "users:all";
    const cachedUsers = userCache.get(cacheKey);
    if (cachedUsers) {
      console.log("hit cache: users");
      return cachedUsers;
    }

    const users = await this.userDataSource.users();

    // Cache the users
    userCache.set(cacheKey, users);

    return users;
  }

  async userByEmail(input: UserByEmailInput): Promise<UserResponse> {
    validateUserAccess(this.sessionUser, { email: input.email });

    // Create cache key
    const cacheKey = `user:email:${input.email}`;

    // Check cache first
    const cachedUser = userCache.get(cacheKey);
    if (cachedUser) {
      console.log("hit cache: userByEmail");
      return cachedUser;
    }

    const result = await this.userDataSource.userByEmail(input);
    if (!result) {
      throw new GraphQLError("User not found", {
        extensions: { code: "NOT_FOUND" },
      });
    }

    // Cache the user
    userCache.set(cacheKey, result);
    // Also cache by ID for flexibility
    userCache.set(`user:id:${result.id}`, result);

    return result;
  }

  async userByField(input: UserByFieldInput): Promise<Array<UserResponse>> {
    if (input.field === ColumnName.Id || input.field === ColumnName.Email) {
      validateUserAccess(this.sessionUser, { [input.field]: input.value });
    } else {
      validateUserAccess(this.sessionUser, {});
    }

    // Create cache key
    const cacheKey = `users:field:${input.field}:${input.value}`;

    // Check cache first
    const cachedUsers = userCache.get(cacheKey);
    if (cachedUsers) {
      console.log("hit cache: userByField");
      return cachedUsers;
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
    const users = await this.userDataSource.userByfield({
      field: input.field,
      value,
    });

    // Cache the users
    userCache.set(cacheKey, users);

    // cache individual users by ID
    users.forEach((u) => {
      userCache.set(`user:id:${u.id}`, u);
    });

    return users;
  }

  async editUser(input: EditUserInput): Promise<EditUserResponse> {
    validateUserAccess(this.sessionUser, { id: input.id });
    const result = await this.userDataSource.editUser(input);

    // Invalidate relevant cache entries
    userCache.delete(`user:id:${input.id}`);
    userCache.delete(`user:email:${result.user.email}`);
    userCache.invalidateByPattern("users:.*");

    return result;
  }

  async deleteUser(input: DeleteUserInput): Promise<boolean> {
    validateUserAccess(this.sessionUser, { id: input.id });
    const deleteResult = await this.userDataSource.deleteUser(input);
    if (deleteResult) {
      // Invalidate cache entries
      userCache.delete(`user:id:${input.id}`);
      userCache.invalidateByPattern("users:.*");
    }
    return deleteResult;
  }
}
