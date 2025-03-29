# Cache Implementation - Expense Service API - Documentation (Expense Tracker)

## Overview

The Expense Service API provides a complete solution for managing expense trackers within the application. It implements a caching strategy to improve performance and reduce database load. This document outlines the service architecture, caching mechanisms, and key operations.

## Architecture

```mermaid
flowchart TD
    Client[Client] --> |GraphQL Requests| Resolver[GraphQL Resolvers]
    Resolver --> ExpenseService[Expense Service API]
    ExpenseService --> |Cache Hit| Cache[In-Memory Cache]
    ExpenseService --> |Cache Miss| DataSource[Expense Data Source]
    DataSource --> |Query| Database[(Database)]
    ExpenseService --> |Invalidate| Cache
    ExpenseService --> |Store| Cache
```

## Cache Implementation

The Expense Service uses an in-memory caching system to optimize data access patterns, reduce database load, and improve response times.

### Cache Structure

The cache implementation is based on the `InMemoryCache` class that provides:

- Key-value storage with TTL (Time-To-Live)
- Pattern-based cache invalidation
- Automatic expiration of stale entries

```mermaid
classDiagram
    class InMemoryCache {
        -cache Map
        -ttl number
        +constructor(ttlInSeconds number)
        +get(key string) T or null
        +set(key string, data T) void
        +delete(key string) void
        +clear() void
        +getKeysByPattern(pattern string) string[]
        +invalidateByPattern(pattern string) void
        +cleanupExpired() void
    }
```

### Cache Key Strategy

The service uses carefully constructed cache keys to ensure proper data isolation and efficient invalidation:

```mermaid
flowchart TD
    CK[Cache Keys] --> E["expense:{id}"]
    CK --> EU["expense_by_users:{user_ids}"]
    CK --> PE["paginated_expenses:{parameters}"]

    PE --> S["session:{sessionId}"]
    PE --> U["users:{userIds}"]
    PE --> P["period:{expensePeriod}"]
    PE --> T["tags:{tagIds}"]
    PE --> M["modes:{modeIds}"]
    PE --> FY["fynix:{fynixIds}"]
    PE --> MA["min:{minAmount}"]
    PE --> MX["max:{maxAmount}"]
    PE --> ST["status:{statuses}"]
    PE --> PA["pagination and sorting"]
```

## Caching Flow

### Read Operations

```mermaid
sequenceDiagram
    participant Client
    participant Service as Expense Service
    participant Cache
    participant DataSource as Data Source

    Client->>Service: Request data
    Service->>Service: Generate cache key
    Service->>Cache: Check for cached data

    alt Cache Hit
        Cache-->>Service: Return cached data
        Service-->>Client: Return data
    else Cache Miss
        Cache-->>Service: Return null
        Service->>DataSource: Fetch data
        DataSource-->>Service: Return data
        Service->>Cache: Store in cache
        Service-->>Client: Return data
    end
```

### Write Operations

```mermaid
sequenceDiagram
    participant Client
    participant Service as Expense Service
    participant Cache
    participant DataSource as Data Source

    Client->>Service: Create/Update/Delete expense
    Service->>DataSource: Perform operation
    DataSource-->>Service: Operation result

    Service->>Cache: Invalidate affected cache entries
    Service-->>Client: Return operation result
```

## Key Components

### Cache Invalidation Strategy

The service uses targeted invalidation strategies to maintain cache consistency:

```mermaid
flowchart TD
    WO[Write Operation] --> UI[User Invalidation]
    WO --> TMF[Tag/Mode/Fynix Invalidation]

    UI --> IP1["Invalidate paginated_expenses with user"]
    UI --> IP2["Invalidate expense_by_users with user"]

    TMF --> IT["Invalidate paginated_expenses with tag"]
    TMF --> IM["Invalidate paginated_expenses with mode"]
    TMF --> IF["Invalidate paginated_expenses with fynix"]
```

## API Methods

### Read Operations

| Method                     | Description                                     | Cache Key                           |
| -------------------------- | ----------------------------------------------- | ----------------------------------- |
| `paginatedExpenseTrackers` | Retrieves paginated expense data with filtering | Complex key based on all parameters |
| `expenseTrackerByUserIds`  | Gets expenses for specific users                | `expense_by_users:{sortedUserIds}`  |
| `expenseTrackerById`       | Gets a single expense by ID                     | `expense:{id}`                      |

### Write Operations

| Method                 | Description                 | Cache Invalidation                                      |
| ---------------------- | --------------------------- | ------------------------------------------------------- |
| `createExpenseTracker` | Creates a new expense       | User-related caches                                     |
| `updateExpenseTracker` | Updates an existing expense | Specific expense and related user/tag/mode/fynix caches |
| `deleteExpenseTracker` | Deletes an expense          | Specific expense and related user/tag/mode/fynix caches |

## Performance Considerations

1. **Cache TTL**: The default TTL for expense cache entries is 15 minutes to balance freshness with performance.

2. **Pattern-based Invalidation**: Uses regex patterns to efficiently invalidate related cache entries when data changes.

3. **Parallel Operations**: The delete operation fetches expense data and performs deletion in parallel for improved performance.

## Best Practices

1. **Cache Key Consistency**: Always use the helper methods to generate cache keys to ensure consistency.

2. **Comprehensive Invalidation**: When modifying data, ensure all relevant caches are invalidated to prevent stale data.

3. **Error Handling**: All operations should include proper error handling to manage both database and cache failures.

## Future Improvements

1. **Cache Size Limits**: Add maximum size constraints to prevent unbounded memory growth.

2. **Cache Metrics**: Implement monitoring for cache hit/miss rates and performance statistics.

3. **Type Safety**: Enhance type definitions for improved type checking of cached values.
