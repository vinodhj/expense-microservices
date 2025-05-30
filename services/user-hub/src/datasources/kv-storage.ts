import { Redis } from "@upstash/redis/cloudflare";
import { AdminKvAsset, AdminKvAssetInput } from "generated";
import { GraphQLError } from "graphql";

export class KvStorageDataSource {
  private readonly kvAssets: KVNamespace;
  private readonly kvEvents: KVNamespace;
  private readonly redis: Redis;
  private readonly ENVIRONMENT: string;

  constructor(kvAssets: KVNamespace, kvEvents: KVNamespace, redis: Redis, ENVIRONMENT: string) {
    this.kvAssets = kvAssets;
    this.kvEvents = kvEvents;
    this.redis = redis;
    this.ENVIRONMENT = ENVIRONMENT;
  }

  async getTokenVersion(email: string): Promise<number> {
    try {
      // Fetch the current token version for this user (default to 0 if not set)
      const currentVersionStr = await this.redis.get(`user:${this.ENVIRONMENT}:${email}:tokenVersion`);
      return currentVersionStr ? parseInt(currentVersionStr as string) : 0;
    } catch (error) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to get token version", {
        extensions: {
          code: "TOKEN_VERSION_FETCH_ERROR",
          error,
          status: 500,
        },
      });
    }
  }

  async incrementTokenVersion(email: string): Promise<boolean> {
    try {
      // Retrieve the current token version from KV using the user's email as the key.
      const currentVersionStr = await this.redis.get(`user:${this.ENVIRONMENT}:${email}:tokenVersion`);
      let currentVersion = currentVersionStr ? parseInt(currentVersionStr as string) : 0;

      // Increment the version so that tokens with the old version are now invalid.
      currentVersion++;
      await this.redis.set(`user:${this.ENVIRONMENT}:${email}:tokenVersion`, currentVersion.toString());
      return true;
    } catch (error) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to increment token version", {
        extensions: {
          code: "TOKEN_VERSION_INCREMENT_ERROR",
          error,
          status: 500,
        },
      });
    }
  }

  async adminKvAsset(input: AdminKvAssetInput): Promise<AdminKvAsset> {
    try {
      // fetch the admin kv asset from kv store
      const result = await this.kvAssets.get(input.kv_key.toString());
      return {
        kv_key: input.kv_key,
        kv_value: result ? JSON.parse(result) : null,
      };
    } catch (error) {
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to get admin kv asset", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }
}
