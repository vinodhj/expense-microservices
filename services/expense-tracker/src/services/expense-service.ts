import { ExpenseDataSource } from "@src/datasources/expense-datasources";
import { SessionUserType } from ".";
import {
  Category,
  CreateExpenseTrackerInput,
  DeleteExpenseTrackerInput,
  ExpenseStatus,
  ExpenseTracker,
  ExpenseTrackerConnection,
  ExpenseTrackerResponse,
  PaginatedExpenseInputs,
  QueryExpenseTrackerByIdArgs,
  QueryExpenseTrackerByUserIdsArgs,
  QueryPaginatedExpenseTrackersArgs,
  Sort,
  Sort_By,
  UpdateExpenseTrackerInput,
} from "generated";
import { trackerAccessValidators, trackerInputValidators } from "./helper/tracker-access-validators";
import { GraphQLError } from "graphql";

export class ExpenseServiceAPI {
  private readonly expenseDataSource: ExpenseDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ expenseDataSource, sessionUser }: { expenseDataSource: ExpenseDataSource; sessionUser: SessionUserType }) {
    this.expenseDataSource = expenseDataSource;
    this.sessionUser = sessionUser;
  }

  async paginatedExpenseTrackers(args: QueryPaginatedExpenseTrackersArgs): Promise<ExpenseTrackerConnection> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: args.session_id } });

      const processedInput: PaginatedExpenseInputs = args.input ?? {
        first: 10,
        sort: Sort.Desc,
        sort_by: Sort_By.CreatedAt,
      };

      const expenseTrackers = await this.expenseDataSource.paginatedExpenseTrackers(processedInput);
      /**
       * The type assertion tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      return {
        ...expenseTrackers,
        edges: expenseTrackers.edges.map((edge) => ({
          ...edge,
          node: {
            ...edge.node,
            // These will be resolved by nested resolvers
            is_disabled: edge.node.is_disabled ?? false,
            tag: null as any,
            mode: null as any,
            fynix: null as any,
            status: edge.node.status as unknown as ExpenseStatus,
          },
        })),
      };
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to create expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async expenseTrackerByUserIds(args: QueryExpenseTrackerByUserIdsArgs): Promise<Array<ExpenseTracker>> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: args.session_id } });
      //return (await this.expenseDataSource.expenseByUserIds(args.user_ids)) as unknown as Array<ExpenseTracker>;

      // Fetch expense data
      const expenses = await this.expenseDataSource.expenseByUserIds(args.user_ids);

      /**
       * The type assertion as ExpenseTracker tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      return expenses.map((expense) => ({
        ...expense,
        // These will be resolved by nested resolvers
        tag: null as any,
        mode: null as any,
        fynix: null as any,
        status: expense.status as unknown as ExpenseStatus,
      })) as Array<ExpenseTracker>;
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to create expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }
  async expenseTrackerById(args: QueryExpenseTrackerByIdArgs): Promise<ExpenseTracker> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: args.session_id } });
      // Fetch the expense tracker
      const expenseTracker = await this.expenseDataSource.expenseTrackerById(args.id);

      /**
       * The type assertion as ExpenseTracker tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      return {
        ...expenseTracker,
        // These will be resolved by nested resolvers
        tag: null as any,
        mode: null as any,
        fynix: null as any,
      } as ExpenseTracker;
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to create expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async createExpenseTracker(input: CreateExpenseTrackerInput): Promise<ExpenseTrackerResponse> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: input.user_id } });

      trackerInputValidators(input);

      return await this.expenseDataSource.createExpenseTracker(input);
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to create expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async updateExpenseTracker(input: UpdateExpenseTrackerInput): Promise<ExpenseTrackerResponse> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: input.user_id } });

      trackerInputValidators(input);

      return await this.expenseDataSource.updateExpenseTracker(input);
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to update expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }

  async deleteExpenseTracker(input: DeleteExpenseTrackerInput): Promise<boolean> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: input.user_id } });

      return await this.expenseDataSource.deleteExpenseTracker(input);
    } catch (error) {
      // Handle errors here
      if (error instanceof GraphQLError) {
        // Re-throw GraphQL-specific errors
        throw error;
      }
      console.error("Unexpected error:", error);
      throw new GraphQLError("Failed to update expense", {
        extensions: {
          code: "INTERNAL_SERVER_ERROR",
          error,
        },
      });
    }
  }
}
