import { DocumentNode, OperationDefinitionNode, SelectionNode, GraphQLObjectType, GraphQLSchema, DirectiveNode } from "graphql";

type ExecutionArgs = {
  document: DocumentNode;
  schema: GraphQLSchema;
  operationName?: string | null;
};

export const publicOperationMap = new Map<string, boolean>();

// Create a new function for the expensive check:
const checkPublicDirective = (executionArgs: ExecutionArgs): boolean => {
  try {
    const { document, schema, operationName } = executionArgs;

    if (!document || !schema) {
      return false;
    }

    // Find the operation definition
    const operation = findOperationDefinition(document, operationName);
    if (!operation?.selectionSet?.selections) {
      return false;
    }

    // Get root type based on operation type
    const rootType = getRootType(schema, operation);
    if (!rootType) {
      return false;
    }

    // Check if any field has the @public directive
    return hasPublicField(operation.selectionSet.selections, rootType);
  } catch (error) {
    console.error("Error checking for @public directive:", error);
    return false;
  }
};

/**
 * Checks if the current operation accesses only fields with @public directive
 */
export const isPublicOperation = (executionArgs: ExecutionArgs): boolean => {
  const { operationName } = executionArgs;

  // Fast path: check cache first
  if (operationName && publicOperationMap.has(operationName)) {
    console.log("Using cached result for operation:", operationName);
    // Use non-null assertion operator (!) or provide a fallback value
    return publicOperationMap.get(operationName) ?? false;
  }

  // Only do expensive check if not in cache
  const result = checkPublicDirective(executionArgs);

  // Cache the result
  if (operationName) {
    publicOperationMap.set(operationName, result);
  }

  return result;
};

/**
 * Finds the operation definition in the document
 */
const findOperationDefinition = (document: DocumentNode, operationName: string | null | undefined): OperationDefinitionNode | undefined => {
  return document.definitions.find(
    (def): def is OperationDefinitionNode => def.kind === "OperationDefinition" && (!operationName || def.name?.value === operationName),
  );
};

/**
 * Gets the root type (Query or Mutation) based on operation
 */
const getRootType = (schema: GraphQLSchema, operation: OperationDefinitionNode): GraphQLObjectType | null => {
  if (operation.operation === "query") {
    return schema.getQueryType() || null;
  }

  if (operation.operation === "mutation") {
    return schema.getMutationType() || null;
  }

  return null;
};

/**
 * Checks if any of the selected fields has the @public directive
 */
const hasPublicField = (selections: readonly SelectionNode[], rootType: GraphQLObjectType): boolean => {
  for (const selection of selections) {
    if (selection.kind === "Field") {
      const fieldName = selection.name.value;
      const field = rootType.getFields()[fieldName];

      if (checkDirectiveOnField(field, "public")) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Checks if a field has the specified directive
 */
const checkDirectiveOnField = (
  field: any, // Still using any as the field structure is not fully defined
  directiveName: string,
): boolean => {
  const directives = field?.astNode?.directives as readonly DirectiveNode[] | undefined;

  if (!directives) {
    return false;
  }

  return directives.some((dir: DirectiveNode) => dir.name.value === directiveName);
};
