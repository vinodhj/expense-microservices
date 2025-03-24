import { KvStorageDataSource } from "@src/datasources/kv-storage";
import { AdminKvAsset, AdminKvAssetInput } from "generated";
import { GraphQLError } from "graphql";

export class KvStorageServiceAPI {
  private readonly kvDataSource: KvStorageDataSource;

  constructor(kvDataSource: KvStorageDataSource) {
    this.kvDataSource = kvDataSource;
  }

  async adminKvAsset(input: AdminKvAssetInput): Promise<AdminKvAsset> {
    try {
      return await this.kvDataSource.adminKvAsset(input);
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
