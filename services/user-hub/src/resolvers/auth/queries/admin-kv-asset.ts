import { APIs } from "@src/services";
import { QueryAdminKvAssetArgs } from "generated";
import { GraphQLError } from "graphql";

export const adminKvAsset = async (
  _: unknown,
  { input }: QueryAdminKvAssetArgs,
  { apis: { kvStorageAPI }, accessToken }: { apis: APIs; accessToken: string | null },
) => {
  try {
    return await kvStorageAPI.adminKvAsset(input, accessToken);
  } catch (error) {
    if (error instanceof GraphQLError) {
      // Re-throw GraphQL-specific errors
      throw error;
    }
    console.error("Unexpected error:", error);
    throw new GraphQLError("Failed to get admin kv asset", {
      extensions: {
        code: "INTERNAL_SERVER_ERROR",
        error,
      },
    });
  }
};
