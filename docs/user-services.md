# User Service Technical Design Document

## Overview

The User Service is a microservice in our architecture that provides user management functionality through a GraphQL API. It's built as a Cloudflare Worker with D1 database integration and implements security mechanisms to ensure secure API access.

## Table of Contents

- [Technical Stack](#technical-stack)
- [Architecture Overview](#architecture-overview)
- [Development Setup](#development-setup)
- [API Endpoints](#api-endpoints)
- [Authentication & Security](#authentication--security)
- [Core Components](#core-components)
- [Request Flow](#request-flow)
- [Directory Structure](#directory-structure)
- [Error Handling](#error-handling)

## Technical Stack

- **Cloudflare Workers**: Serverless compute platform
- **Languages**: Typescript, GraphQL
- **Frameworks**: NodeJS, Graphql Yoga
- **D1 Database**: Cloudflare's SQL database
- **KV Namespace**: Cloudflare's KV namespaces(key-value database)
- **GraphQL (Yoga)**: API query language and runtime
- **Drizzle ORM**: Database toolkit for TypeScript
- **Upstash Redis**: Distributed Redis for auth token versioning and nonce tracking
- **Hosting**: Cloud-based hosting environment

### External Values

N/A

### Required Headers

- `X-Project-Token` , `X-Gateway-Nonce`, `X-Gateway-Signature`, `X-Gateway-Timestamp`, `X-User-Id`, `X-User-Role`, `X-User-Email`, `X-User-Name`

### Interfaces

- Graphql Mesh with hive gateway interface

**Purpose:** Server as primary interface to interact with user service.

- **API**: GraphQL
- **Protocols Used**: GraphQL over HTTPS
- **Other Interface**: Callable from other cloudflare workers by service binding.

## Architecture Overview

### System Architecture

```mermaid
flowchart TB
    Client[Client Applications] --> Gateway[API Gateway]
    Gateway --> UserService[User Service]
    Gateway --> OtherServices[Other Microservices]

    UserService --> DB[(D1 Database)]
    UserService --> Redis[(Upstash Redis)]
    UserService --> KV[(Cloudflare KV)]

    subgraph "User Service Components"
        Worker[Worker Entry Point] --> GraphQLHandler[GraphQL Handler]
        Worker --> KVSyncHandler[KV Sync Handler]
        Worker --> CORSHandler[CORS Handler]

        GraphQLHandler --> SecurityMiddleware[Security Middleware]
        GraphQLHandler --> GraphQLPlugins[GraphQL Plugins]
        GraphQLHandler --> Resolvers[Resolvers]

        Resolvers -->  Services[Service Layer]
        Services --> DataSources[Data Sources]
    end

    class UserService,Client,Gateway,DB,Redis,KV,Worker highlight
```

### Request Flow Diagram

```mermaid
sequenceDiagram
    Client->>+Gateway: Request with Auth Headers
    Gateway->>Gateway: Add Security Headers
    Gateway->>+UserService: Forward Request

    UserService->>UserService: Verify CORS
    UserService->>UserService: Route Request

    alt GraphQL Request
        UserService->>SecurityMiddleware: Validate Security Headers
        SecurityMiddleware->>UserService: Headers Valid

        UserService->>GraphQLPlugins: Execute Plugins
        GraphQLPlugins->>Redis: Check Nonce(If nonce is enabled)
        Redis->>GraphQLPlugins: Nonce Status

        UserService->>Resolvers: Execute GraphQL Operation
        Resolvers->>ServiceAPI: Call service API
        ServiceAPI->>DataSources: Fetch/Update Data
        DataSources->>DB: Database Operations
        DB->>DataSources: Data Results
        DataSources->>ServiceAPI: Return Data
        ServiceAPI-->>Resolvers: Return Data

        GraphQLPlugins->>Redis: Store Used Nonce(If nonce is enabled)
        UserService->>UserService: Apply CORS Headers
    else KV Sync
        UserService->>UserService: Validate KV Sync Token
        UserService->>KV: Update KV Store
        KV->>UserService: Confirmation
    end

    UserService->>-Gateway: Response
    Gateway->>-Client: Final Response
```

## Development Setup

### Prerequisites

- Wrangler CLI installed
- Access to Cloudflare account with appropriate permissions
- Node.js and npm/yarn

### Installation

1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables (see below)

### Environment Variables

Required environment variables:

- `ENVIRONMENT`: Environment mode (DEV, STAGING, PROD)
- `PROJECT_TOKEN`: API access token
- `JWT_SECRET`: Secret for JWT operations
- `GATEWAY_SECRET`: Secret for gateway signature validation
- `GATEWAY_SIGNATURE`: Signature for schema federation
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins
- `NONCE_ENABLED`: Enable/disable nonce validation ("true"/"false")
- `KV_SYNC_TOKEN`: Token for KV sync operations

### Available Scripts

```json
"scripts": {
  "migrate": "./migrate.sh",
  "generate": "graphql-codegen",
  "migration-list": "wrangler d1 migrations list DB",
  "migration-apply-production": "wrangler d1 migrations apply DB --remote",
  "deploy:staging": "wrangler deploy --env staging",
  "bundle-size": "wrangler build && wrangler deploy --dry-run",
  "deploy": "wrangler deploy",
  "dev": "(kill -9 $(lsof -t -i:8501) || true) && wrangler dev --name user-hub --port 8501 --inspector-port 8301 --persist-to=.db-local",
  "test": "vitest",
  "cf-typegen": "wrangler types",
  "prod:secrets": "./wrangler-secrets.sh"
}
```

### Local Development Workflow

```mermaid
flowchart LR
    A[Edit Code] --> B[Run Local Dev Server]
    B --> C[Test with Local DB]
    C --> D[Generate Types]
    D --> E[Write Tests]
    E --> F[Run Tests]
    F --> G{Tests Pass?}
    G -->|Yes| H[Deploy to Staging]
    G -->|No| A
    H --> I[Verify in Staging]
    I --> J{All Good?}
    J -->|Yes| K[Deploy to Production]
    J -->|No| A
```

## API Endpoints

### GraphQL Endpoint: `/graphql`

The main interface for interacting with user data. Provides queries and mutations for user management operations.

#### Example GraphQL Operations

```graphql
# Query user information
query AllUsers($id: ID!) {
  users(id: $id) {
    __typename
    id
    name
    email
    role
  }
}

# Create a new user
mutation signUp($input: SignUpInput!) {
  signUp(input: $input) {
    success
    user {
      __typename
      email
      id
      name
      role
    }
  }
}
```

### KV Sync Endpoint: `/kv-site-assets`

Reserved for internal use to synchronize KV storage. Requires authentication via `KV_SYNC_TOKEN`.

## Authentication & Security

The service implements several security mechanisms:

### Security Flow

```mermaid
flowchart TD
    A[Client Request] --> B{Has Project Token?}
    B -->|No| C[401 Unauthorized]
    B -->|Yes| D{Is Project Token Valid?}
    D -->|No| C
    D -->|Yes| E{Has Security Headers?}
    E -->|No| C
    E -->|Yes| F{Is Timestamp Recent?}
    F -->|No| G[408 Request Timeout]
    F -->|Yes| H{Is Signature Valid?}
    H -->|No| C
    H -->|Yes| I{Is Nonce is enabled in env and Unique?}
    I -->|No| J[401 Replay Attack]
    I -->|Yes| K[Process Request]
```

### 1. Project Token Validation

All requests must include a valid `X-Project-Token` header that matches the configured `PROJECT_TOKEN`.

### 2. Gateway Security Headers

The following headers are required for authenticated requests:

- `X-Gateway-Timestamp`: Current timestamp
- `X-Gateway-Nonce`: Unique request identifier
- `X-Gateway-Signature`: HMAC-SHA256 signature of payload
- `X-User-Id`, `X-User-Role`, `X-User-Email`, `X-User-Name`: User context headers

### 3. Nonce Validation

To prevent replay attacks, each nonce can only be used once within a 5-minute window.

```mermaid
sequenceDiagram
    participant Client
    participant Service
    participant Redis

    Client->>Service: Request with Nonce
    Service->>Redis: Check if Nonce exists

    alt Nonce exists
        Redis->>Service: Nonce found
        Service->>Client: 401 Replay Attack
    else Nonce not found
        Redis->>Service: Nonce not found
        Service->>Service: Process request
        Service->>Redis: Store Nonce (5 min TTL)
        Service->>Client: Valid Response
    end
```

### 4. Session User

The service extracts user context from headers to create a session:

```typescript
type SessionUserType = {
  id: string;
  role: Role; // ADMIN or USER
  email: string;
  name: string;
} | null;
```

### 5. CORS Protection

Implements strict CORS protection with origin validation against the `ALLOWED_ORIGINS` environment variable.

```mermaid
flowchart TD
    A[Request with Origin] --> B{OPTIONS Method?}
    B -->|Yes| C[Handle Preflight]
    B -->|No| D{Is Origin allowed?}

    C --> E[Return CORS Headers]

    D -->|No| F[Reject Request]
    D -->|Yes| G[Add CORS Headers to Response]

    subgraph "Origin Validation"
        H[Get Origin from Request] --> I{Match Exact Origin?}
        I -->|Yes| J[Allow Origin]
        I -->|No| K{Has Wildcard Pattern?}
        K -->|No| L[Reject Origin]
        K -->|Yes| M{Matches Pattern?}
        M -->|Yes| J
        M -->|No| L
    end
```

## Core Components

### Main Worker Handler

Entry point for all requests, routing to appropriate handlers based on URL paths.

```typescript
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Request routing logic
    // ...
  },
} as ExportedHandler<Env>;
```

### Component Interaction

```mermaid
classDiagram
    class Worker {
        +fetch(request, env)
    }

    class CORSHandler {
        +handleCorsPreflight(request, env)
        +addCORSHeaders(request, response, env)
        +getCorsOrigin(request, env)
    }

    class GraphQLHandler {
        +handleGraphQL(request, env)
    }

    class KVSyncHandler {
        +handleKVSync(request, env)
    }

    class SecurityMiddleware {
        +validateProjectToken(token, expected)
        +verifySecurityHeaders(headers, env)
        -constantTimeCompare(a, b)
        -getHeader(headers, key)
    }

    class GraphQLPlugins {
        +createNonceStoragePlugin(redis)
        +createMetricsPlugin
    }

    Worker --> CORSHandler
    Worker --> GraphQLHandler
    Worker --> KVSyncHandler
    GraphQLHandler --> SecurityMiddleware
    GraphQLHandler --> GraphQLPlugins
```

### GraphQL Handler (`handlers/graphql.ts`)

Manages GraphQL request processing, context setup, and security validation.

### KV Sync Handler (`handlers/kv-sync.ts`)

Handles KV storage synchronization for authentication configuration.

### Security Middleware (`security-middleware.ts`)

Implements security validation logic including:

- Project token validation
- Signature verification
- Timestamp validation
- Nonce management

### GraphQL Plugins (`graphql-plugins.ts`)

Custom plugins for GraphQL processing:

- `createNonceStoragePlugin`: Manages nonce validation and storage
- `createMetricsPlugin`: Tracks and logs execution metrics

### CORS Management (`cors-headers.ts`)

Handles Cross-Origin Resource Sharing (CORS) headers and preflight requests.

## Request Flow

1. **Request Received**: Worker receives HTTP request
2. **CORS Preflight Check**: If OPTIONS request, handle CORS preflight
3. **Route Determination**: Based on URL path
   - `/graphql` → GraphQL processing
   - `/kv-site-assets` → KV synchronization
   - Other paths → 404 response
4. **Security Validation**:
   - Project token verification
   - Gateway headers validation
   - Timestamp and signature checks
5. **Context Creation**: Build GraphQL context with:
   - User session information
   - Service APIs
   - Security context
6. **Request Processing**: Execute GraphQL operation or KV sync
7. **Response Generation**: Format response with appropriate CORS headers

## Directory Structure (src/directory)

```
├── handlers/
│   ├── graphql.ts             # GraphQL request handler
│   ├── kv-sync.ts             # KV synchronization handler
│   ├── security-middleware.ts # Security validation middleware
│   └── graphql-plugins.ts     # GraphQL plugins for nonce and metrics
├── services/
│   ├── helper                 # Helper file for jwt, validator
│   ├── index.ts               # Service exports
│   ├── auth-service.ts        # Authentication services
│   ├── user-service.ts        # User management services
│   └── kv-storage-service.ts  # KV storage services
├── schemas/
│   └── index.ts               # Schema exports
├── datasources/
│   ├── auth.ts                # Authentication data access
│   ├── user.ts                # User data access
│   ├── kv-storage.ts          # KV access
│   └── utils.ts
├── resolvers/
│   ├── index.ts               # Resolver exports
│   └── mutations              # User mutation
│        └──index.ts
│   └── queries                # User query
│        └──index.ts
├── types/
│   └── index.ts               # Type exports(graphql schema)
├── cors-headers.ts            # CORS handling utilities
├── index.ts                   # Main worker entry point
```

## DB Structure

**user**

| Field      | Types   | Constraint       | Format   |
| ---------- | ------- | ---------------- | -------- |
| id         | TEXT    | PK, NOT NULL     |          |
| name       | TEXT    | NOT NULL         |          |
| email      | TEXT    | UNIQUE, NOT NULL |          |
| password   | TEXT    | NOT NULL         |          |
| role       | TEXT    | NOT NULL         |          |
| phone      | TEXT    | UNIQUE, NOT NULL |          |
| address    | TEXT    | Nullable         |          |
| city       | TEXT    | Nullable         |          |
| state      | TEXT    | Nullable         |          |
| country    | TEXT    | Nullable         |          |
| zipcode    | TEXT    | Nullable         |          |
| created_at | INTEGER | NOT NULL         | DateTime |
| updated_at | INTEGER | NOT NULL         | DateTime |
| created_by | TEXT    | NOT NULL         |          |
| updated_by | TEXT    | NOT NULL         |          |

**Indexes**

- `idx_email` on **email**
- `idx_phone` on **phone**
- `composite_email_phone` (Unique) on **email** and **phone**

```mermaid
erDiagram
    USER {
        string id PK
        string name
        string email
        string password
        enum role
        string phone
        string address
        string city
        string state
        string country
        string zipcode
        integer created_at
        integer updated_at
        string created_by
        string updated_by
    }
```

## GraphQL Schema, Resolvers, Service API Interfaces and Data Sources

### GraphQL Schema (Types)

```GraphQL
directive @public on FIELD_DEFINITION

scalar DateTime
scalar JSON

# ADMIN, MODERATOR, USER
enum Role {
  ADMIN
  USER
}

enum Sort {
  ASC
  DESC
}

enum SORT_BY {
  CREATED_AT
  UPDATED_AT
}

type User {
  id: ID! # nano_id
  name: String!
  email: String!
  password: String! # hashed
  role: Role!
  phone: String!
  address: String
  city: String
  state: String
  country: String
  zipcode: String
  created_at: DateTime!
  updated_at: DateTime!
  created_by: String!
  updated_by: String!
}

input SignUpInput {
  name: String!
  email: String!
  password: String!
  phone: String!
  role: Role
  address: String
  city: String
  state: String
  country: String
  zipcode: String
}

type SignUpResponse {
  success: Boolean!
  user: UserSuccessResponse
}

input LoginInput {
  email: String!
  password: String!
}

type LoginResponse {
  success: Boolean!
  token: String
  user: UserSuccessResponse
}

type UserSuccessResponse {
  id: ID!
  name: String!
  email: String!
  phone: String!
  role: Role!
  address: String
  city: String
  state: String
  country: String
  zipcode: String
}

type UserResponse {
  id: ID!
  name: String!
  email: String!
  role: Role!
  phone: String!
  address: String
  city: String
  state: String
  country: String
  zipcode: String
  created_at: DateTime!
  updated_at: DateTime!
  created_by: String!
  updated_by: String!
}

input UserByEmailInput {
  email: String!
}

input UserByFieldInput {
  field: ColumnName!
  value: String!
}

input DeleteUserInput {
  id: ID!
}

input EditUserInput {
  id: ID!
  name: String!
  email: String!
  phone: String!
  role: Role
  address: String
  city: String
  state: String
  country: String
  zipcode: String
}

type EditUserResponse {
  success: Boolean!
  user: UserSuccessResponse
}

input ChangePasswordInput {
  id: ID!
  current_password: String!
  new_password: String!
  confirm_password: String!
}

enum ColumnName {
  id
  name
  email
  phone
  role
  address
  city
  state
  country
  zipcode
}

type LogoutResponse {
  success: Boolean!
}

type AdminKvAsset {
  kv_key: String!
  kv_value: JSON
}

input AdminKvAssetInput {
  kv_key: String!
}

input PaginatedUsersInputs {
  first: Int = 10
  after: String
  sort: Sort = DESC
  sort_by: SORT_BY = CREATED_AT
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  endCursor: String
  hasNextPage: Boolean!
}

type UsersConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type Query {
  userByEmail(input: UserByEmailInput!): UserResponse
  userByfield(input: UserByFieldInput!): [UserResponse]
  users: [UserResponse]
  paginatedUsers(ids: [ID!], input: PaginatedUsersInputs): UsersConnection
  adminKvAsset(input: AdminKvAssetInput!): AdminKvAsset
}

type Mutation {
  signUp(input: SignUpInput!): SignUpResponse! @public
  login(input: LoginInput!): LoginResponse! @public
  editUser(input: EditUserInput!): EditUserResponse!
  deleteUser(input: DeleteUserInput!): Boolean!
  changePassword(input: ChangePasswordInput!): Boolean!
  logout: LogoutResponse!
}
```

### Resolvers (Query/Mutation)

The resolvers implement the GraphQL schema operations, translating client requests into service layer method calls. They are responsible for:

- Validating input
- Calling appropriate service methods
- Formatting and returning responses
- Handling authorization and access control

### Service API Interfaces

The service layer provides business logic implementation between resolvers and data sources

- User Service API
- Auth Service API
- KV Storage Service API

### Data Sources

The data sources layer provides an abstraction over the database access, implementing repository patterns for each entity:

- User Data Source
- Auth Data Source
- KV Storage Data Source

**Implementation Notes**

1. All methods should implement thorough input validation
2. Use dependency injection for services and data sources
3. Implement consistent error handling across all layers
4. Use transactions for critical database operations
5. Implement logging for all significant events and errors

### User Service Component Interaction Flow

```mermaid
flowchart TB
    subgraph "Client Interaction"
        A[GraphQL Client] --> B[GraphQL Resolver]
    end

    subgraph "Backend Components"
        B --> C[Service API Layer]
        C --> D[Data Sources]
        D --> E[(Database D1)]
        D --> F[(Redis)]
        D --> G[(KV Storage)]
    end

    subgraph "Resolver Types"
        Q1[Query Resolvers]
        Q2[Mutation Resolvers]
    end

    subgraph "Service API Interfaces"
        S1[User Service]
        S2[Auth Service]
        S3[KV Storage Service]
    end

    subgraph "Data Source Types"
        DS1[User Data Source]
        DS2[Auth Data Source]
        DS3[KV Storage Data Source]
    end

    B --> Q1
    B --> Q2

    Q1 --> S1
    Q2 --> S1
    Q2 --> S2

    S1 --> DS1
    S2 --> DS2
    S3 --> DS3

    style A fill:#f9f,stroke:#333,stroke-width:4px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bfb,stroke:#333,stroke-width:2px
    style D fill:#ff9,stroke:#333,stroke-width:2px
    style E fill:#f99,stroke:#333,stroke-width:2px
    style F fill:#9f9,stroke:#333,stroke-width:2px
    style G fill:#99f,stroke:#333,stroke-width:2px
```

### User Service Detailed Interaction Sequence

```mermaid
sequenceDiagram
    participant Client as GraphQL Client
    participant Resolver as GraphQL Resolver
    participant ServiceAPI as Service API Layer
    participant DataSource as Data Source
    participant Database as Database (D1)
    participant Redis as Redis
    participant KV as KV Storage

    Client->>Resolver: GraphQL Request

    alt Authentication Required
        Resolver->>ServiceAPI: Validate User Session
        ServiceAPI->>Redis: Check Token Validity
    end

    Resolver->>ServiceAPI: Call Appropriate Service Method

    alt User Creation/Login
        ServiceAPI->>DataSource: Prepare User Data
        DataSource->>Database: Insert/Retrieve User
        Database-->>DataSource: Return User Data
        DataSource-->>ServiceAPI: Processed User Data
    end

    alt Complex Query
        ServiceAPI->>DataSource: Fetch Paginated/Filtered Data
        DataSource->>Database: Complex Query
        Database-->>DataSource: Query Results
        DataSource-->>ServiceAPI: Processed Results
    end

    alt KV Storage Operation
        ServiceAPI->>DataSource: KV Storage Request
        DataSource->>KV: Get/Set/Delete Asset
        KV-->>DataSource: Asset Operation Result
        DataSource-->>ServiceAPI: Operation Confirmation
    end

    ServiceAPI-->>Resolver: Return Processed Data
    Resolver-->>Client: GraphQL Response
```

### User Service Component Relationships

```mermaid
classDiagram
    class GraphQLResolver {
        +resolveQuery()
        +resolveMutation()
        -validateInput()
        -handleAuthorization()
    }

    class ServiceAPI {
        +createUser()
        +authenticateUser()
        +updateUser()
        +deleteUser()
        -validateBusinessLogic()
    }

    class DataSource {
        +insert()
        +findByEmail()
        +update()
        +delete()
        -mapToEntity()
        -mapToDTO()
    }

    class Database {
        +executeQuery()
        +beginTransaction()
        +commitTransaction()
    }

    class AuthMiddleware {
        +validateToken()
        +checkPermissions()
        +generateToken()
    }

    class ErrorHandler {
        +handleError()
        +logError()
        +formatGraphQLError()
    }

    GraphQLResolver --> ServiceAPI : uses
    ServiceAPI --> DataSource : uses
    DataSource --> Database : interacts
    GraphQLResolver ..> AuthMiddleware : security
    GraphQLResolver ..> ErrorHandler : error management
    ServiceAPI ..> ErrorHandler : error handling
    DataSource ..> ErrorHandler : error reporting
```

## Error Handling

The service implements structured error handling with GraphQL error extensions:

```typescript
throw new GraphQLError("Error message", {
  extensions: {
    code: "ERROR_CODE",
    status: 4xx, // HTTP status code
    // Additional metadata
  }
});
```

**General Principles**

1. **Explicit Error Types**: Define custom error types that clearly describe different error conditions. This helps clients understand the nature of the error and how to respond to it.
2. **Error Codes**: Assign unique error codes to different types of errors for easy identification and localization of error messages.
3. **Consistent Structure**: Ensure that all errors returned from the API have a consistent structure, making it easier for clients to parse and handle errors.
4. **Detailed Messages**: Provide detailed error messages that offer insights into why an operation failed. This can include validation failures, system errors, or execution issues.
5. **User-Friendly Language**: Error messages should be in user-friendly language, avoiding technicalities that may not be understandable to end users.

**Implementing Error Responses**

**GraphQL Error Object**: Utilize the GraphQL `errors` object to return errors. Each error can include:

1. **`message`**: A human-readable error message.
2. **`extensions`**: An optional field that can include additional details such as error codes, type of error, and other relevant information.

### Error Flow

```mermaid
flowchart TD
    A[Error Occurs] --> B{Error Type?}

    B -->|Security| C[GraphQLError with Security Code]
    B -->|Validation| D[GraphQLError with Validation Code]
    B -->|Database| E[GraphQLError with DB Code]
    B -->|Other| F[GraphQLError with Internal Code]

    C --> G[Add Status Code]
    D --> G
    E --> G
    F --> G

    G --> H[Add Metadata]
    H --> I[Log Error]
    I --> J[Return to Client]
```

### Common Error Codes

- `UNAUTHORIZED`: Invalid project token
- `GATEWAY_UNAUTHORIZED`: Missing security headers
- `INVALID_SIGNATURE`: Signature verification failed
- `REQUEST_TIMEOUT`: Request timestamp too old
- `REPLAY_ATTACK`: Nonce already used
- `VALIDATION_ERROR`: Input validation failed
- `NOT_FOUND`: Requested resource not found
- `FORBIDDEN`: Insufficient permissions
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Testing

- **Unit Tests**
  - Unit tests for resolver functions
- **End-to-End (E2E) Tests**
  - Complete user service workflows which includes CRUD operations should be tested.
  - Use Playwright or Selenium

## Deployment and CI/CD

```mermaid
flowchart TB
    A[Code Changes] --> B[Run Tests]
    B --> C{Tests Pass?}
    C -->|No| A
    C -->|Yes| D[Build Project]
    D --> E[Check Bundle Size]
    E --> F{Size Acceptable?}
    F -->|No| A
    F -->|Yes| G{Branch Type?}
    G -->|Feature| H[Deploy to Dev]
    G -->|Main| I[Deploy to Staging]
    I --> J[Run Integration Tests]
    J --> K{Tests Pass?}
    K -->|No| A
    K -->|Yes| L[Deploy to Production]
    L --> M[Monitor]
```

## Conclusion

The above schema and other information needs to be in alliance with the conventions present in the ADRs.
