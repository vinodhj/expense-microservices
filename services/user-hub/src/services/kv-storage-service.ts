import { KvStorageDataSource } from "@src/datasources/kv-storage";
import { AdminKvAsset, AdminKvAssetInput } from "generated";
import { GraphQLError } from "graphql";

export class KvStorageServiceAPI {
  private readonly kvDataSource: KvStorageDataSource;

  constructor(kvDataSource: KvStorageDataSource) {
    this.kvDataSource = kvDataSource;
  }

  async adminKvAsset(input: AdminKvAssetInput, accessToken: string | null): Promise<AdminKvAsset> {
    if (!accessToken) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "UNAUTHORIZED" },
      });
    }
    return await this.kvDataSource.adminKvAsset(input);
  }

  async nonceExists(nonce_key: string): Promise<boolean> {
    return await this.kvDataSource.nonceExists(nonce_key);
  }

  async nonceStore(nonce_key: string, timestamp: string, expirationTtl: number): Promise<void> {
    await this.kvDataSource.nonceStore(nonce_key, timestamp, expirationTtl);
  }
}
