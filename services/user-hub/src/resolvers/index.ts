import { Resolvers } from "generated";
import { AuthMutation } from "./auth/mutations";
import { AuthQuery } from "./auth/queries";

const Query = {
  ...AuthQuery,
};
const Mutation = {
  ...AuthMutation,
};

export const resolvers: Resolvers = { Query, Mutation };
