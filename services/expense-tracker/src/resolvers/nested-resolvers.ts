import { APIs } from "@src/services";
import { CategoryType } from "generated";
import { GraphQLError } from "graphql";

// Separate nested resolvers into their own object
export const ExpenseTrackerNestedResolvers = {
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
};
