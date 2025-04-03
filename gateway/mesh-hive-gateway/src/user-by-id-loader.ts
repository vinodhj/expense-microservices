import DataLoader from "dataloader";
import { GraphQLResolveInfo } from "graphql";
import { HiveGatewayContext } from "./additional-resolvers";
import { User } from "generates";

export const createUsersLoader = (context: HiveGatewayContext, info: GraphQLResolveInfo): DataLoader<string, User | null> => {
  const userServiceQuery = context.UserService.query || context.UserService.Query;
  if (!userServiceQuery?.paginatedUsers) {
    throw new Error("UserService does not have a valid paginatedUsers query method");
  }

  return new DataLoader<string, User | null>(
    async (userIds: readonly string[]) => {
      try {
        // Using the GraphQL Mesh SDK directly with the right parameter structure
        const result = await userServiceQuery.paginatedUsers({
          root: {},
          args: { ids: userIds },
          context,
          info,
          selectionSet: `{
              edges {
                node {
                  id
                  name
                  email
                  role
                  created_at
                  updated_at
                }
              }
            }`,
        });

        // Process the connection structure to extract users
        const users = result?.edges?.map((edge: any) => edge.node) || [];

        // Create a map for faster lookups
        const userMap = new Map();
        users.forEach((user: any) => {
          if (user?.id) {
            userMap.set(user.id, user);
          }
        });

        // Return users in the same order they were requested
        return userIds.map((id) => {
          const user = userMap.get(id);
          if (!user) {
            console.log(`No user found for ID: ${id}`);
          }
          return user || null;
        });
      } catch (error: unknown) {
        console.error("Error batch loading users:", error);

        // For debugging purposes, we'll still return mock data if the real query fails
        console.warn("Returning mock users for debugging");
        return userIds.map(() => null);
      }
    },
    {
      maxBatchSize: 20,
    },
  );
};
