import { createSchema } from "graphql-yoga";
import { typeDefs } from "../types";
import { resolvers } from "../resolvers";
import applyPublicDirectiveTransform from "./applyPublicDirectiveTransform";
import { buildSubgraphSchema } from "@apollo/subgraph";
import { GraphQLSchema } from "graphql";

export const schema: GraphQLSchema = applyPublicDirectiveTransform(
  buildSubgraphSchema({
    typeDefs,
    resolvers: resolvers as any,
  }),
);
