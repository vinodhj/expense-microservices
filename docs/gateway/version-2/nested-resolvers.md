# Nested Resolvers in Gateway

## Overview

Nested resolvers allow you to efficiently resolve related entities across your GraphQL subgraphs. This document explains how to implement optimized nested resolvers using DataLoader pattern to prevent the N+1 query problem in GraphQL Gateway.

## Implementation

### Step 1: Define Schema Extensions

Add type extensions to your mesh configuration to establish relationships between types from different subgraphs:

```typescript
// mesh.config.ts
export const composeConfig = defineComposeConfig({
  subgraphs: [...],
  additionalTypeDefs: `
    extend type ExpenseTracker {
      user: User!
    }
  `,
})

export const gatewayConfig = defineGatewayConfig({
  additionalResolvers: [additionalResolvers],
  // other gateway configuration
});
```

### Step 2: Create Data Loaders

Implement DataLoader to batch and cache related entity requests:

```typescript
// user-by-id-loader.ts
import DataLoader from "dataloader";
import { GraphQLResolveInfo } from "graphql";
import { HiveGatewayContext } from "./additional-resolvers";
import { User, UserEdge, UsersConnection } from "generates";

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
  }
}`;

export const createUsersLoader = (context: HiveGatewayContext, info: GraphQLResolveInfo): DataLoader => {
  const userServiceQuery = context.UserService.query || context.UserService.Query;
  if (!userServiceQuery?.paginatedUsers) {
    throw new Error("UserService does not have a valid paginatedUsers query method");
  }

  return new DataLoader(
    async (userIds: readonly string[]): Promise<(User | null)[]> => {
      try {
        const uniqueIds = [...new Set(userIds)]; // Remove duplicates for efficiency

        const result: UsersConnection = await userServiceQuery.paginatedUsers({
          root: {},
          args: { ids: uniqueIds },
          context,
          info,
          selectionSet: USER_SELECTION_SET,
        });

        // Create a map for O(1) lookups
        const userMap = new Map();
        result?.edges?.forEach((edge: UserEdge) => {
          if (edge.node?.id) {
            userMap.set(edge.node.id, edge.node);
          }
        });

        // Return users in the same order they were requested
        return userIds.map((id) => userMap.get(id) || null);
      } catch (error: unknown) {
        console.error("Error batch loading users:", error instanceof Error ? error.message : String(error));
        throw error;
      }
    },
    {
      maxBatchSize: 20,
      batchScheduleFn: (callback) => setTimeout(callback, 0),
    },
  );
};
```

### Step 3: Implement Nested Resolvers

Create resolvers that use the DataLoader to efficiently resolve related entities:

```typescript
// additional-resolvers.ts
import DataLoader from "dataloader";
import { ExpenseTracker, User } from "generates";
import { GraphQLResolveInfo } from "graphql";
import { createUsersLoader } from "./user-by-id-loader";

// Define the context for Gateway
export interface HiveGatewayContext {
  UserService: any;
  ExpenseTracker: any;
  usersLoader?: DataLoader<string, User | null>;
  [key: string]: any;
}

export default {
  ExpenseTracker: {
    user: {
      resolve: async (root: ExpenseTracker, _args: {}, context: HiveGatewayContext, info: GraphQLResolveInfo): Promise<User> => {
        const userId = root.user_id;
        if (!userId) {
          console.error(`Missing userId for expense: ${root.id || "unknown expense"}`);
          throw new Error(`User not found for expense`);
        }

        // Lazily initialize the loader
        context.usersLoader ??= createUsersLoader(context, info);

        try {
          const user = await context.usersLoader.load(userId);
          if (!user) {
            throw new Error(`User not found for userId: ${userId}`);
          }
          return user;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
          throw error;
        }
      },
    },
  },
};
```

## Key Benefits

- **Solves N+1 Query Problem**: Efficiently batches multiple individual requests into a single query
- **Caching**: DataLoader caches results during the request lifecycle
- **Load Deduplication**: Prevents duplicate requests for the same entity
- **Lazy Initialization**: Loaders are created only when needed
- **Error Handling**: Robust error handling with meaningful error messages

## Common Patterns

### Extending Multiple Types

**Example to add new extend types**

You can extend multiple types with nested resolvers:

```typescript
// additionalTypeDefs
`
  extend type ExpenseTracker {
    user: User!
  }
  
  extend type User {
    expenses: [ExpenseTracker!]!
  }
`;
```

### Custom Selection Sets

Define specific selection sets to optimize performance:

```typescript
const MINIMAL_USER_SELECTION_SET = `{
  edges {
    node {
      id
      name
      email
    }
  }
}`;
```

### Multiple Loaders

Use different loaders for different entity relationships:

```typescript
context.usersLoader ??= createUsersLoader(context, info);
context.expenseLoader ??= createExpenseLoader(context, info);
```

## Best Practices

1. **Batch Size Management**: Set appropriate `maxBatchSize` based on your service capabilities
2. **Error Handling**: Always include comprehensive error handling
3. **Loader Reuse**: Store loaders in context to reuse within the same request
4. **Selection Set Optimization**: Only request fields you need in the selection set
5. **Caching Strategy**: Consider implementing custom cache mechanisms for frequently accessed entities
