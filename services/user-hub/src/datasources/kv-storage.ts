import { AdminKvAsset, AdminKvAssetInput } from "generated";
import { GraphQLError } from "graphql";

export class KvStorageDataSource {
  private readonly kvAssets: KVNamespace;
  private readonly kvEvents: KVNamespace;

  constructor(kvAssets: KVNamespace, kvEvents: KVNamespace) {
    this.kvAssets = kvAssets;
    this.kvEvents = kvEvents;
  }

  async getTokenVersion(email: string): Promise<number> {
    // Fetch the current token version for this user (default to 0 if not set)
    const currentVersionStr = await this.kvEvents.get(`user:${email}:tokenVersion`);
    return currentVersionStr ? parseInt(currentVersionStr) : 0;
  }

  async incrementTokenVersion(email: string): Promise<boolean> {
    // Retrieve the current token version from KV using the user's email as the key.
    const currentVersionStr = await this.kvEvents.get(`user:${email}:tokenVersion`);
    let currentVersion = currentVersionStr ? parseInt(currentVersionStr) : 0;

    // Increment the version so that tokens with the old version are now invalid.
    currentVersion++;
    await this.kvEvents.put(`user:${email}:tokenVersion`, currentVersion.toString());
    return true;
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

  async nonceExists(nonce_key: string): Promise<boolean> {
    // Check if nonce exists in KV store
    const result = await this.kvEvents.get(nonce_key);
    return result !== null;
  }

  async nonceStore(nonce_key: string, timestamp: string, expirationTtl: number): Promise<void> {
    // Store nonce in KV store
    await this.kvEvents.put(nonce_key, timestamp, { expirationTtl });
  }
}
