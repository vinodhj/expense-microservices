import { CategoryType, Resolvers } from "generated";
import { CategoryMutation } from "./category/mutations";
import { CategoryQuery } from "./category/queries";
import { ExpenseMutation } from "./expense/mutations";
import { ExpenseQuery } from "./expense/queries";
import { GraphQLError } from "graphql";
import { APIs } from "@src/services";

const Query = {
  ...CategoryQuery,
  ...ExpenseQuery,
};
const Mutation = {
  ...CategoryMutation,
  ...ExpenseMutation,
};

export const resolvers: Resolvers = {
  Query,
  Mutation,
  ExpenseTracker: {
    tag: async ({ tag_id }: { tag_id: string }, _: unknown, { apis: { categoryAPI } }: { apis: APIs }) => {
      try {
        const category_type = CategoryType.ExpenseTag;
        const filteredInput = {
          id: tag_id,
        };
        const categories = await categoryAPI.category(category_type, filteredInput);
        return categories[0];
      } catch (error) {
        console.log(error);
        throw new GraphQLError("Failed to fetch tag", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error,
          },
        });
      }
    },
    mode: async ({ mode_id }: { mode_id: string }, _: unknown, { apis: { categoryAPI } }: { apis: APIs }) => {
      try {
        const category_type = CategoryType.ExpenseMode;
        const filteredInput = {
          id: mode_id,
        };
        const categories = await categoryAPI.category(category_type, filteredInput);
        return categories[0];
      } catch (error) {
        console.log(error);
        throw new GraphQLError("Failed to fetch mode", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error,
          },
        });
      }
    },
    fynix: async ({ fynix_id }: { fynix_id: string }, _: unknown, { apis: { categoryAPI } }: { apis: APIs }) => {
      try {
        const category_type = CategoryType.ExpenseFynix;
        const filteredInput = {
          id: fynix_id,
        };
        const categories = await categoryAPI.category(category_type, filteredInput);
        return categories[0];
      } catch (error) {
        console.log(error);
        throw new GraphQLError("Failed to fetch fynix", {
          extensions: {
            code: "INTERNAL_SERVER_ERROR",
            error,
          },
        });
      }
    },
  },
};
