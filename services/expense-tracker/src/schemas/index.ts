import { typeDefs } from "@src/types";
import { resolvers as originalResolvers } from "@src/resolvers";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { GraphQLResolverMap } from "@apollo/subgraph/dist/schema-helper";
import { GraphQLSchema } from "graphql";

// Create a type-safe version of the resolvers that preserves federation fields
const sanitizeResolvers = (resolvers: any): GraphQLResolverMap<any> => {
  const result: GraphQLResolverMap<any> = {};

  // List of special federation fields we want to keep
  const federationFields = ["__resolveReference", "__resolveType"];

  for (const typeName in resolvers) {
    result[typeName] = {};

    for (const fieldName in resolvers[typeName]) {
      const shouldKeepField =
        federationFields.includes(fieldName) || // Keep federation fields
        !fieldName.startsWith("__"); // Keep regular fields

      if (shouldKeepField) {
        result[typeName][fieldName] = resolvers[typeName][fieldName];
      }
      // Fields not matching either condition are skipped
    }
  }

  return result;
};

// Use the sanitized resolvers with federation fields preserved
const sanitizedResolvers = sanitizeResolvers(originalResolvers);

export const schema: GraphQLSchema = buildSubgraphSchema({
  typeDefs,
  resolvers: sanitizedResolvers,
});
