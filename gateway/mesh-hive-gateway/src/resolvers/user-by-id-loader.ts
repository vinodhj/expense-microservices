import DataLoader from "dataloader";
import { GraphQLResolveInfo } from "graphql";
import { HiveGatewayContext } from "./additional-resolvers";
import { UserEdge, UserResponse, UsersConnection } from "generates";

// Define the selection set for the paginatedUsers query
const USER_SELECTION_SET = `{
  edges {
    cursor
    node {
      id
      name
      email
      role
      phone
      address
      city
      state
      country
      zipcode
      created_at
      updated_at
      created_by
      updated_by
    }
  }
  pageInfo {
    endCursor
    hasNextPage
    totalCount
  }
}`;

export const createUsersLoader = (context: HiveGatewayContext, info: GraphQLResolveInfo): DataLoader<string, UserResponse | null> => {
  const userServiceQuery = context.UserService.query || context.UserService.Query;
  if (!userServiceQuery?.paginatedUsers) {
    throw new Error("UserService does not have a valid paginatedUsers query method");
  }

  return new DataLoader<string, UserResponse | null>(
    async (userIds: readonly string[]): Promise<Array<UserResponse | null>> => {
      try {
        const uniqueIds = [...new Set(userIds)]; // Remove duplicates for efficiency

        // Using the GraphQL Mesh SDK directly with the right parameter structure
        const result: UsersConnection = await userServiceQuery.paginatedUsers({
          root: {},
          args: { ids: uniqueIds },
          context,
          info,
          // The selectionSet is a required parameter for non-scalar fields in GraphQL Mesh.
          selectionSet: USER_SELECTION_SET,
        });

        // Create a map for O(1) lookups
        const userMap = new Map<string, UserResponse>();

        result?.edges?.forEach((edge: UserEdge) => {
          if (edge.node?.id) {
            userMap.set(edge.node.id, edge.node);
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
        console.error("Error batch loading users:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    {
      maxBatchSize: 20,
      /**
       * Groups more load requests together, reducing the number of database queries,
       * Particularly useful when resolving multiple related fields that each need user data
       * Can significantly reduce the "N+1 query problem" in GraphQL resolvers
       */
      batchScheduleFn: (callback) => setTimeout(callback, 0),
    },
  );
};
