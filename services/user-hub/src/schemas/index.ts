import { createSchema } from "graphql-yoga";
import { typeDefs } from "../types";
import { resolvers } from "../resolvers";
import applyPublicDirectiveTransform from "./applyPublicDirectiveTransform";

export const schema = applyPublicDirectiveTransform(
  createSchema({
    typeDefs,
    resolvers,
  }),
);
