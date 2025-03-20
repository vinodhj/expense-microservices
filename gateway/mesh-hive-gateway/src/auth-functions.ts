import { ResolveUserFn, ValidateUserFn } from "@graphql-hive/gateway-runtime";
import { jwtVerifyToken } from "./jwt-verify-token";
import crypto from "crypto";
import { GraphQLError } from "graphql";
// import { GraphQLError, DocumentNode, GraphQLSchema, getOperationAST } from "graphql";

/**
 * Checks if an operation has the @public directive
 */
// function checkIfOperationHasPublicDirective(schema: GraphQLSchema, document: DocumentNode, operationName?: string): boolean {
//   // Get the operation from the document
//   const operation = getOperationAST(document, operationName);
//   if (!operation) return false;

//   // Get the operation type (query, mutation, subscription)
//   const operationType = operation.operation;

//   // Get the root operation name (the first selection in the operation)
//   if (!operation.selectionSet.selections.length) return false;

//   const selections = operation.selectionSet.selections;
//   let isPublic = false;

//   // Check each selection in the operation
//   for (const selection of selections) {
//     if (selection.kind === "Field") {
//       const fieldName = selection.name.value;

//       // Check if this field has @public directive
//       const rootType = getRootTypeFromSchema(schema, operationType);
//       if (!rootType) continue;

//       // Find the field definition in the schema
//       const field = rootType.getFields()[fieldName];
//       if (!field) continue;

//       // Check if the field has @public directive
//       const hasPublicDirective = field.astNode?.directives?.some((d) => d.name.value === "public");

//       if (hasPublicDirective) {
//         isPublic = true;
//         break;
//       }
//     }
//   }

//   return isPublic;
// }

/**
 * Gets the root type from schema based on operation type
 */
// function getRootTypeFromSchema(schema: GraphQLSchema, operationType: string) {
//   switch (operationType) {
//     case "query":
//       return schema.getQueryType();
//     case "mutation":
//       return schema.getMutationType();
//     case "subscription":
//       return schema.getSubscriptionType();
//     default:
//       return null;
//   }
// }

// Auth functions factory
export const createAuthFunctions = (env: Env) => {
  /**
   * Resolves the user session from the Authorization header and verifies the token using the JWT secret.
   * If the token is invalid, throws a GraphQLError with a 401 status code and the "UNAUTHORIZED" code.
   * If the token is valid, adds the user to the context and returns the user object.
   * If no token is provided, generates a signature based on the current timestamp and nonce
   * and adds it to the context, then returns null.
   */
  const resolveUserFn: ResolveUserFn<any> = async (context: any) => {
    // Get current timestamp
    const timestamp = Date.now().toString();
    context.gateway_timestamp = timestamp;

    // Generate a unique nonce
    const nonce = crypto.getRandomValues(new Uint8Array(16)).reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "");
    context.gateway_nonce = nonce;

    // Get auth header
    const accessToken = context.headers?.Authorization;
    if (!accessToken) {
      // TODO : Check if this is a public operation - `public:${operationName}:${timestamp}:${nonce}`;
      // Generate public operation signature including nonce
      const signaturePayload = `public:${timestamp}:${nonce}`;
      const signature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(signaturePayload).digest("hex");

      context.gateway_signature = signature;
      return null; // No auth token provided
    }
    try {
      const jwtToken = await jwtVerifyToken({ token: accessToken, secret: env.JWT_SECRET, kvStorage: env.EXPENSE_AUTH_EVENTS_KV });
      const user = {
        id: jwtToken.id,
        role: jwtToken.role,
        email: jwtToken.email,
        name: jwtToken.name,
      };
      // Explicitly add a string version to the context
      context.current_session_user = user;

      // Generate signature based on headers and shared secret
      const signaturePayload = `${jwtToken.id}:${jwtToken.role}:${timestamp}:${nonce}`;
      const signature = crypto.createHmac("sha256", env.GATEWAY_SECRET).update(signaturePayload).digest("hex");

      // Add signature and timestamp to context
      context.gateway_signature = signature;

      return user;
    } catch (error) {
      console.error("Token verification failed:", error);
      const isGraphQLError = error instanceof GraphQLError;
      throw new GraphQLError(isGraphQLError ? error.message : "Invalid token", {
        extensions: {
          status: 401,
          code: isGraphQLError ? error.extensions.code : "UNAUTHORIZED",
          error: isGraphQLError && error.extensions?.error ? error.extensions.error : error,
        },
      });
    }
  };
  /**
   * Validates the user session for a given GraphQL operation.
   * If the operation is public (e.g., "login" or "signUp"), the function allows it without requiring user authentication.
   * For non-public operations, it checks if the user is authenticated.
   * If the user is null, it throws a GraphQLError indicating authentication failure with a 401 status code.
   *
   * @param {object} params - The parameters object.
   * @param {any} params.user - The user object extracted from the session.
   * @param {any} params.executionArgs - The GraphQL execution arguments, including the operation name.
   * @throws {GraphQLError} If authentication fails for non-public operations.
   */

  const validateUser: ValidateUserFn<any> = ({ user, executionArgs }) => {
    // Check if this operation requires auth
    const publicOperations = ["login", "signUp"];
    const operationName = executionArgs.operationName ?? "";
    if (publicOperations.includes(operationName)) {
      return; // Allow public operations (returning void means valid)
    }

    // TODO
    // Get operation details from the executionArgs
    // const { schema, document, operationName } = executionArgs;

    // // Use the schema and AST to determine if the operation has @public directive
    // const isPublicOperation = checkIfOperationHasPublicDirective(schema, document, operationName ?? undefined);

    // if (isPublicOperation) {
    //   return; // Allow public operations
    // }

    // Validate auth token
    if (user === null) {
      throw new GraphQLError("Authentication failed", {
        extensions: {
          code: "UNAUTHORIZED",
          status: 401,
          error: { message: "Invalid token" },
        },
      });
    }
  };

  return { resolveUserFn, validateUser };
};
