import { DrizzleD1Database } from "drizzle-orm/d1";
import { DeleteUserInput, EditUserInput, PaginatedUsersInputs, Sort, Sort_By, UserByEmailInput, UserByFieldInput } from "generated";
import { asc, desc, eq, inArray, like, SQLWrapper, gt, lt } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { Role, user } from "db/schema/user";
import { SessionUserType } from "@src/services";
import DataLoader from "dataloader";

export class UserDataSource {
  private readonly db: DrizzleD1Database;
  private readonly sessionUser: SessionUserType;
  private readonly userLoader: DataLoader<string, typeof user.$inferSelect | Error>;

  // Constants for pagination and batching
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100; // Set maximum page size
  private readonly BATCH_SIZE = 50; // Maximum number of IDs to fetch in a single batch

  constructor({ db, sessionUser }: { db: DrizzleD1Database; sessionUser?: SessionUserType }) {
    this.db = db;
    this.sessionUser = sessionUser ?? null;
    this.userLoader = new DataLoader(
      async (ids: readonly string[]) => {
        // batch fetch
        return this.userByBatchIds(ids as string[]);
      },
      {
        maxBatchSize: this.BATCH_SIZE, // Set maximum batch size
      },
    );
  }

  async userByIds(ids: string[]) {
    try {
      const results = await this.userLoader.loadMany(ids);
      // Filter out errors and handle them
      const users: (typeof user.$inferSelect)[] = [];
      const errors: Error[] = [];

      results.forEach((result) => {
        if (result instanceof Error) {
          errors.push(result);
        } else {
          users.push(result);
        }
      });

      if (errors.length > 0) {
        console.error("Errors loading some users:", errors);
      }

      // Convert services to edges
      const edges = users.map((item) => ({
        cursor: item.created_at.toISOString(),
        node: item,
      }));
      return {
        edges,
        pageInfo: {
          endCursor: null,
          hasNextPage: false,
        },
      };
    } catch (error) {
      console.error("Failed to load users by ids:", error);
      throw new GraphQLError("Failed to fetch users", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async userByBatchIds(ids: string[]) {
    try {
      const result = await this.db.select().from(user).where(inArray(user.id, ids)).execute();
      if (!result) {
        return [];
      }

      // Map results to ensure order matches the requested IDs
      const userMap = new Map(result.map((u) => [u.id, u]));
      return ids.map((id) => userMap.get(id) || new Error(`User with ID ${id} not found`));
    } catch (error) {
      console.log(error);
      throw new GraphQLError("Failed to fetch user by batch ids", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async paginatedUsers(input: PaginatedUsersInputs) {
    const { after, sort_by = Sort_By.UpdatedAt } = input;
    const sort = input.sort === Sort.Asc ? Sort.Asc : Sort.Desc;

    // Apply default and maximum page size limits from class constants
    const requestedLimit = input.first ?? this.DEFAULT_PAGE_SIZE;
    const first = Math.min(requestedLimit, this.MAX_PAGE_SIZE);
    const sortField = sort_by === Sort_By.CreatedAt ? user.created_at : user.updated_at;

    try {
      // Use the helper function to parse the cursor date safely
      const afterDate = this.parseCursorDate(after);

      // Fetch all the user with pagination
      const result = await this.db
        .select()
        .from(user)
        .orderBy(this.sorter(sortField, sort))
        .where(sort === Sort.Asc ? gt(sortField, afterDate || new Date(0)) : lt(sortField, afterDate || new Date()))
        .limit(first + 1) // Fetch one extra to determine if there are more pages
        .execute();

      // Check if there's a next page and trim the extra result
      const hasNextPage = result.length > first;
      const items = hasNextPage ? result.slice(0, first) : result;

      // Convert services to edges
      const edges = items.map((item) => ({
        cursor: (sort_by === Sort_By.CreatedAt ? item.created_at : item.updated_at).toISOString(),
        node: item as typeof user.$inferSelect,
      }));

      return {
        edges,
        pageInfo: {
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
          hasNextPage,
        },
      };
    } catch (error: any) {
      console.error("Error in paginatedUsers:", error);
      throw new GraphQLError("Failed to get paginated users", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  async users() {
    try {
      return this.db.select().from(user).execute();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to get users", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  async userByEmail(input: UserByEmailInput) {
    try {
      return this.db.select().from(user).where(eq(user.email, input.email)).get();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to get user", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  async userByfield(input: UserByFieldInput) {
    try {
      const condition = input.field === "name" ? like(user[input.field], input.value) : eq(user[input.field], input.value);
      return this.db.select().from(user).where(condition).execute();
    } catch (error: any) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to get user", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  async editUser(input: EditUserInput) {
    try {
      const updateData = {
        name: input.name,
        email: input.email,
        phone: input.phone,
        ...(input.role && { role: input.role === "ADMIN" ? Role.Admin : Role.User }),
        ...(input.address && { address: input.address }),
        ...(input.city && { city: input.city }),
        ...(input.state && { state: input.state }),
        ...(input.country && { country: input.country }),
        ...(input.zipcode && { zipcode: input.zipcode }),
        updated_at: new Date(),
        updated_by: this.sessionUser?.name ?? "ADMIN",
      };
      const result = await this.db.update(user).set(updateData).where(eq(user.id, input.id)).returning().get();

      const { password, ...userWithoutPassword } = result;
      return {
        success: true,
        user: {
          ...userWithoutPassword,
        },
      };
    } catch (error: any) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to edit user", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  async deleteUser(input: DeleteUserInput) {
    try {
      const deleted = await this.db.delete(user).where(eq(user.id, input.id)).execute();
      if (deleted && deleted.success) {
        if (deleted.meta.changed_db) {
          return true;
        } else {
          console.warn(`User not deleted. Changes: ${deleted.meta.changes}`);
          return false;
        }
      } else {
        console.error("Delete operation failed:", deleted);
        return false;
      }
    } catch (error: any) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to delete user", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error: error.message ? error.message : error,
        },
      });
    }
  }

  private sorter(field: SQLWrapper, sort: Sort) {
    if (sort === Sort.Asc) {
      return asc(field);
    }
    return desc(field);
  }
  private parseCursorDate(cursor: string | null | undefined): Date | undefined {
    if (!cursor) return undefined;

    try {
      const date = new Date(cursor);
      if (isNaN(date.getTime())) {
        throw new GraphQLError("Invalid cursor date", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }
      return date;
    } catch (error) {
      throw new GraphQLError("Invalid cursor format", {
        extensions: {
          code: "BAD_USER_INPUT",
          error,
        },
      });
    }
  }
}
