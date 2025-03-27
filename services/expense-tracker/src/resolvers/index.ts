import { Resolvers } from "generated";
import { CategoryMutation } from "./category/mutations";
import { CategoryQuery } from "./category/queries";
import { ExpenseMutation } from "./expense/mutations";
import { ExpenseQuery } from "./expense/queries";

const Query = {
  ...CategoryQuery,
  ...ExpenseQuery,
};
const Mutation = {
  ...CategoryMutation,
  ...ExpenseMutation,
};

export const resolvers: Resolvers = { Query, Mutation };
