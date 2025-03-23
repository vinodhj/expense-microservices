import { GraphQLSchema, defaultFieldResolver } from "graphql";
import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";

function applyPublicDirectiveTransform(schema: GraphQLSchema): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.MUTATION_ROOT_FIELD]: (fieldConfig) => {
      const publicDirective = getDirective(schema, fieldConfig, "public")?.[0];
      console.log("Mutation directive", publicDirective);
      if (publicDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        console.log("Mutation fieldConfig", JSON.stringify(fieldConfig));
        return fieldConfig;
      }
    },
    [MapperKind.QUERY_ROOT_FIELD]: (fieldConfig) => {
      const publicDirective = getDirective(schema, fieldConfig, "public")?.[0];
      console.log("Query directive", publicDirective);
      if (publicDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        console.log("Query fieldConfig", JSON.stringify(fieldConfig));
        return fieldConfig;
      }
    },
  });
}

export default applyPublicDirectiveTransform;
