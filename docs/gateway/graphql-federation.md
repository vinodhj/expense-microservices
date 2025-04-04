# GraphQL Federation Documentation - Mesh v1 & hive gateway

## Overview

This documentation covers a GraphQL federation setup using GraphQL Mesh and Hive Gateway. The system connects multiple microservices (UserService and ExpenseTracker) into a unified GraphQL API with proper data loading patterns to avoid N+1 query problems.

## Architecture

```mermaid
flowchart TD
    Client[Client Application] --> Gateway[Mesh Hive Gateway]
    Gateway --> US[UserService]
    Gateway --> ET[ExpenseTracker]

    subgraph DataLoaders
      UL[UsersLoader]
    end

    Gateway --> DataLoaders
    DataLoaders --> US

    subgraph Resolvers
      AR[AdditionalResolvers]
    end

    Gateway --> Resolvers
    Resolvers --> DataLoaders
```

## Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Gateway as Mesh Hive Gateway
    participant Resolvers
    participant DataLoader
    participant UserService
    participant ExpenseTracker

    Client->>Gateway: GraphQL Query
    Gateway->>ExpenseTracker: Fetch ExpenseTracker data
    ExpenseTracker-->>Gateway: Return ExpenseTracker data

    Gateway->>Resolvers: Resolve ExpenseTracker.user field
    Resolvers->>DataLoader: Load User by ID

    Note over DataLoader: Batches multiple user requests

    DataLoader->>UserService: paginatedUsers query with IDs
    Note over DataLoader,UserService: Uses selectionSet to specify fields
    UserService-->>DataLoader: Return User data
    DataLoader-->>Resolvers: Return cached User objects
    Resolvers-->>Gateway: Combine data
    Gateway-->>Client: Complete response
```

## DataLoader Operation

```mermaid
flowchart TD
    R1[Resolver 1] -->|Load user 1| DL[DataLoader]
    R2[Resolver 2] -->|Load user 2| DL
    R3[Resolver 3] -->|Load user 3| DL
    R4[Resolver 4] -->|Load user 1 again| DL

    subgraph BatchProcess[Batch Process]
        B1[Combine IDs]
        B2[Remove duplicates]
        B3[Single query to UserService]
        B4[Map responses]
        B5[Return in same order]
    end

    DL -->|After all loaded in same tick| BatchProcess
    BatchProcess -->|Single API call| API[UserService API]
    API -->|Return all users| BatchProcess

    BatchProcess --> C1[Cache]
    C1 -->|Return user 1| R1
    C1 -->|Return user 2| R2
    C1 -->|Return user 3| R3
    C1 -->|Return cached user 1| R4
```

## Key Components

### 1. Mesh Configuration (`mesh.config.ts`)

The configuration defines:

- Subgraph connections to microservices (UserService and ExpenseTracker)
- Authentication and security headers
- Environment-specific configurations
- Type extension for federation

### 2. Additional Resolvers (`additional-resolvers.ts`)

Resolvers that extend the federated schema, particularly:

- Connecting an ExpenseTracker to its associated User

### 3. DataLoader Implementation (`user-by-id-loader.ts`)

A batched data loading pattern to efficiently fetch user data and prevent N+1 query problems.

## The `selectionSet` Parameter

### Important Note

The `selectionSet` parameter is **required** when working with non-scalar fields in GraphQL Mesh. This is a critical implementation detail that may not be immediately obvious.

### What is `selectionSet`?

The `selectionSet` defines which fields should be selected when querying a GraphQL service. In our implementation, it specifies:

```graphql
{
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
}
```

### Why is it required?

1. **Explicit Field Selection**: GraphQL Mesh needs to know exactly which fields to request from the underlying service.
2. **Non-Scalar Resolution**: For complex types (like User objects), you must specify the complete field structure.
3. **Predictable Performance**: Explicit selection sets prevent over/under-fetching of data.

```mermaid
flowchart LR
    subgraph WithoutSelectionSet[Without selectionSet]
        WS1[Resolver calls UserService]
        WS2[GraphQL Mesh doesn't know which fields to select]
        WS3[Error or incomplete data returned]
    end

    subgraph WithSelectionSet[With selectionSet]
        SS1[Resolver calls UserService]
        SS2[GraphQL Mesh uses selectionSet to specify fields]
        SS3[Complete data returned]
    end

    WS1 --> WS2 --> WS3
    SS1 --> SS2 --> SS3
```

### Common Pitfalls

1. **Missing `selectionSet`**: Will result in errors when resolving non-scalar fields
2. **Incomplete fields**: If your selection set doesn't include fields that your resolvers need, you'll get null values or errors
3. **Performance issues**: Over-selecting fields can cause unnecessary data transfer

## DataLoader Implementation

The `createUsersLoader` function implements efficient batch loading:

```typescript
export const createUsersLoader = (context: HiveGatewayContext, info: GraphQLResolveInfo): DataLoader => {
  // Implementation details...

  return new DataLoader(
    async (userIds: readonly string[]): Promise> => {
      // Batch loading implementation...
    },
    {
      maxBatchSize: 20,
      batchScheduleFn: (callback) => setTimeout(callback, 0),
    }
  );
};
```

### Key Features:

1. **Batch Loading**: Combines multiple individual requests into a single query
2. **Caching**: Automatically caches results to prevent duplicate requests
3. **Consistent Ordering**: Returns results in the same order as the requested IDs
4. **Error Handling**: Properly propagates and logs errors

## N+1 Problem Solved

```mermaid
flowchart TD
    subgraph WithoutDataLoader[Without DataLoader - N+1 Problem]
        direction TB
        Q[Query: Get 5 ExpenseTrackers]
        Q --> E1[Get Expense 1]
        Q --> E2[Get Expense 2]
        Q --> E3[Get Expense 3]
        Q --> E4[Get Expense 4]
        Q --> E5[Get Expense 5]

        E1 --> U1[Separate API call for User 1]
        E2 --> U2[Separate API call for User 2]
        E3 --> U3[Separate API call for User 3]
        E4 --> U4[Separate API call for User 4]
        E5 --> U5[Separate API call for User 5]
    end

    subgraph WithDataLoader[With DataLoader - Single API Call]
        direction TB
        QD[Query: Get 5 ExpenseTrackers]
        QD --> ED1[Get Expense 1]
        QD --> ED2[Get Expense 2]
        QD --> ED3[Get Expense 3]
        QD --> ED4[Get Expense 4]
        QD --> ED5[Get Expense 5]

        ED1 --> DL[DataLoader]
        ED2 --> DL
        ED3 --> DL
        ED4 --> DL
        ED5 --> DL

        DL --> UB[Single API call for all Users]
    end
```

## Environment Configuration

The system supports different environments through environment variables:

- `LOCAL_*` URLs for development
- `PROD_*` URLs for production
- Security tokens and signatures for authentication

## Configuration Flow

```mermaid
flowchart TD
    ENV[Environment Variables] --> CFG[mesh.config.ts]
    CFG --> US[UserService Configuration]
    CFG --> ET[ExpenseTracker Configuration]
    CFG --> AR[Additional Type Definitions]
    CFG --> GW[Gateway Configuration]

    US --> H1[Headers]
    ET --> H2[Headers]

    subgraph Headers
        H1
        H2
    end

    Headers --> Auth[Authentication]
    Headers --> Tracing[Request Tracing]
    Headers --> Fed[Federation]
```

## Best Practices

1. **Always specify `selectionSet`** when working with non-scalar fields
2. **Use DataLoader pattern** to avoid N+1 query problems
3. **Implement proper error handling** at each resolver level
4. **Set appropriate timeout and retry values** for network resilience
5. **Keep security headers consistent** across services

## Troubleshooting

### Common Errors

1. **"Cannot read properties of undefined (reading 'load')"**

   - Check if the DataLoader is properly initialized in the context

2. **"UserService does not have a valid paginatedUsers query method"**

   - Verify that the UserService schema includes the paginatedUsers query

3. **Missing fields in returned data**

   - Verify that your `selectionSet` includes all needed fields

4. **Authentication failures**
   - Check that all required headers are being properly propagated

## Debugging Tips

```mermaid
flowchart TD
    Issue[Issue Detected] --> Check1{Check DataLoader}
    Check1 -->|Not working| Fix1[Verify initialization in context]
    Check1 -->|Working| Check2{Check selectionSet}

    Check2 -->|Incorrect| Fix2[Update field selection]
    Check2 -->|Correct| Check3{Check Auth Headers}

    Check3 -->|Missing| Fix3[Add required headers]
    Check3 -->|Present| Check4{Check Service URLs}

    Check4 -->|Incorrect| Fix4[Update environment variables]
    Check4 -->|Correct| Fix5[Check logs for detailed errors]
```
