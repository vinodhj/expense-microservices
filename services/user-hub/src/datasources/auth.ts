import { DrizzleD1Database } from "drizzle-orm/d1";
import { ChangePasswordInput, LoginInput, SignUpInput } from "generated";
import { and, eq } from "drizzle-orm";
import { GraphQLError } from "graphql";
import { nanoid } from "nanoid";
import { Role, user } from "db/schema/user";
import bcrypt from "bcryptjs";
import { handleError, validateCurrentPassword } from "./utils";
import { SessionUserType } from "@src/services";
import { KvStorageDataSource } from "./kv-storage";

export class AuthDataSource {
  private readonly db: DrizzleD1Database;
  private readonly kvStorageDataSource: KvStorageDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({
    db,
    kvStorageDataSource,
    sessionUser,
  }: {
    db: DrizzleD1Database;
    kvStorageDataSource: KvStorageDataSource;
    sessionUser?: SessionUserType;
  }) {
    this.db = db;
    this.kvStorageDataSource = kvStorageDataSource;
    this.sessionUser = sessionUser ?? null;
  }

  async signUp(input: SignUpInput) {
    try {
      const hashedPassword = await bcrypt.hash(input.password, 10);

      const result = await this.db
        .insert(user)
        .values({
          id: nanoid(),
          name: input.name,
          email: input.email,
          phone: input.phone,
          password: hashedPassword,
          role: input.role === "ADMIN" ? Role.Admin : Role.User,
          address: input.address ? input.address : null,
          city: input.city ? input.city : null,
          state: input.state ? input.state : null,
          country: input.country ? input.country : null,
          zipcode: input.zipcode ? input.zipcode : null,
          created_by: this.sessionUser?.name ?? "ADMIN", // currently admin only able to create user
          updated_by: this.sessionUser?.name ?? "ADMIN", // currently admin only able to update user
        })
        .returning()
        .get();
      const { password, ...userWithoutPassword } = result;
      return {
        success: true,
        user: {
          ...userWithoutPassword,
        },
      };
    } catch (error) {
      console.log("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to sign up ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to sign up due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async login(input: LoginInput) {
    try {
      const result = await this.db.select().from(user).where(eq(user.email, input.email)).get();
      if (!result) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }
      const isPasswordMatch = await bcrypt.compare(input.password, result.password);
      if (!isPasswordMatch) {
        throw new GraphQLError("Invalid password", {
          extensions: {
            code: "BAD_USER_INPUT",
          },
        });
      }

      // Retrieve token version via the dedicated KV storage datasource
      const currentVersion = await this.kvStorageDataSource.getTokenVersion(input.email);

      const { password, ...userWithoutPassword } = result;

      return {
        success: true,
        user: {
          ...userWithoutPassword,
        },
        token_version: currentVersion,
      };
    } catch (error) {
      console.error("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to login ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: error instanceof GraphQLError ? error.extensions.code : "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to login due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async changePassword(input: ChangePasswordInput) {
    try {
      const result_user = await this.getUserById(input.id);
      await validateCurrentPassword(input.current_password, result_user.password);
      return await this.updatePassword(input.id, input.new_password);
    } catch (error) {
      handleError(error, "Failed to change password");
    }
  }

  async incrementTokenVersion(email: string): Promise<void> {
    try {
      await this.kvStorageDataSource.incrementTokenVersion(email);
    } catch (error) {
      handleError(error, "Failed to increment token version");
    }
  }

  // need to call from another service
  private async getUserById(id: string) {
    try {
      const result_user = await this.db.select().from(user).where(eq(user.id, id)).get();
      if (!result_user) {
        throw new GraphQLError("User not found", {
          extensions: {
            code: "NOT_FOUND",
          },
        });
      }
      return result_user;
    } catch (error) {
      console.error("error", error);
      if (error instanceof GraphQLError || error instanceof Error) {
        //to throw GraphQLError/original error
        throw new GraphQLError(`Failed to get user ${error.message ? "- " + error.message : ""}`, {
          extensions: {
            code: error instanceof GraphQLError ? error.extensions.code : "INTERNAL_SERVER_ERROR",
            error: error.message,
          },
        });
      }
      throw new GraphQLError("Failed to get user due to an unexpected error", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  private async updatePassword(id: string, newPassword: string) {
    try {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      const result = await this.db
        .update(user)
        .set({
          password: hashedNewPassword,
          updated_at: new Date(),
        })
        .where(and(eq(user.id, id)))
        .returning()
        .get();

      if (result) return true;
      console.warn("Password update failed - no rows affected");
      return false;
    } catch (error) {
      console.error(`Error updating password for user ${id}:`, error);
      return false;
    }
  }
}
