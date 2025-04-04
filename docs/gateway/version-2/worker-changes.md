# Worker Changes in Gateway v2

## Overview

The Worker component in Gateway v2 handles the main request lifecycle, including CORS handling, rate limiting, gateway initialization, request processing, and error management. This document outlines the high-level improvements and architectural changes made to the Worker component.

## Key Enhancements

- **Environment-aware execution**: Different behavior in development vs. production
- **Redis integration**: Added distributed state management for better scalability
- **Rate limiting**: Implemented protection against API abuse
- **Performance metrics**: Added processing time tracking with response headers
- **Enhanced error handling**: Improved error reporting with environment-specific details

## Worker Request Flow

```mermaid
flowchart TD
    A[Client Request] --> B{OPTIONS Request?}
    B -->|Yes| C[Return CORS Preflight Response]
    B -->|No| D[Initialize Redis]
    D --> E{Check Rate Limit}
    E -->|Exceeded| F[Return 429 Response]
    E -->|OK| G[Initialize Gateway]
    G --> H[Process Request & Track Time]
    H --> I[Add Performance Headers]
    I --> J[Schedule Resource Disposal]
    J --> K[Return Response with CORS Headers]

    subgraph "Error Handling"
        L[Catch Exceptions]
        L --> M{GraphQL Error?}
        M -->|Yes| N[Return 400 with Error Details]
        M -->|No| O[Return 500 with Error Details]
    end
```

## Rate Limiting Implementation

The gateway now implements a sophisticated rate limiting system with Redis:

```mermaid
flowchart TD
    A[Request Arrives] --> B{Dev Environment?}
    B -->|Yes| C[Skip Rate Limiting]
    B -->|No| D{Client Already Blocked?}
    D -->|Yes| E[Return 429 Response]
    D -->|No| F[Increment Request Counter]
    F --> G{First Request in Window?}
    G -->|Yes| H[Set TTL on Counter]
    G -->|No| I{Limit Exceeded?}
    I -->|No| J[Allow Request]
    I -->|Yes| K[Set Block with Penalty]
    K --> L[Delete Counter]
    L --> M[Return 429 with Retry-After]
```

### Rate Limiting Configuration

- **Window**: 60 seconds tracking period
- **Request Limit**: 50 requests per window
- **Penalty**: Additional 40-second block when limit is exceeded
- **Client Identification**: Uses IP addresses and forwarding headers
- **Environment Awareness**: Disabled in development mode

## Request Processing Improvements

```mermaid
sequenceDiagram
    participant Client
    participant Worker
    participant Redis
    participant Gateway
    participant Resources

    Client->>Worker: GraphQL Request
    Worker->>Redis: Check Rate Limit
    Redis->>Worker: Request Allowed
    Worker->>Gateway: Initialize Gateway
    Gateway->>Resources: Allocate Resources

    Note over Worker,Resources: Processing Phase

    Worker->>Worker: Track Start Time
    Worker->>Gateway: Process Request
    Gateway->>Worker: Return Response
    Worker->>Worker: Calculate Processing Time
    Worker->>Worker: Add Performance Headers

    Note over Worker,Resources: Cleanup Phase

    Worker->>Client: Send Response
    Worker->>Gateway: Schedule Disposal (waitUntil)
    Gateway->>Resources: Release Resources
```

## Error Handling

Errors are now categorized and handled differently based on their type:

- **GraphQL Errors**: Returned with 400 status code and detailed information
- **System Errors**: Returned with 500 status code
- **Environment-Specific Details**: Stack traces only in development environment
- **Consistent Format**: All errors follow a standardized JSON structure

## Performance Metrics

The gateway now tracks and reports performance metrics:

- `X-Processing-Time` header shows request processing duration in milliseconds
- Detailed logs for performance tracking and troubleshooting

## Best Practices

1. **Early returns**: Fast paths for CORS and rate limiting
2. **Proper resource management**: Non-blocking disposal after request handling
3. **Graceful degradation**: Rate limiting failures don't block legitimate traffic
4. **Structured logging**: Consistent logging format with appropriate levels
