import { ExpenseDataSource } from "@src/datasources/expense-datasources";
import { SessionUserType } from ".";
import {
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
import { expenseCache } from "@src/cache/in-memory-cache";

export class ExpenseServiceAPI {
  private readonly expenseDataSource: ExpenseDataSource;
  private readonly sessionUser: SessionUserType;

  constructor({ expenseDataSource, sessionUser }: { expenseDataSource: ExpenseDataSource; sessionUser: SessionUserType }) {
    this.expenseDataSource = expenseDataSource;
    this.sessionUser = sessionUser;
  }

  // Generate a robust cache key for paginated expenses with various filters
  private generatePaginatedExpenseCacheKey(sessionId: string, input: PaginatedExpenseInputs): string {
    // Extract all filter components
    const userIds = input.user_ids?.sort().join(",") || "";
    const expensePeriod = input.expense_period || "";
    const tagIds = input.tag_ids?.sort().join(",") || "";
    const modeIds = input.mode_ids?.sort().join(",") || "";
    const fynixIds = input.fynix_ids?.sort().join(",") || "";
    const minAmount = input.min_amount?.toString() || "";
    const maxAmount = input.max_amount?.toString() || "";
    const statuses = input.statuses?.sort().join(",") || "";
    const first = input.first?.toString() || "10";
    const after = input.after || "";
    const sort = input.sort || "DESC";
    const sortBy = input.sort_by || "CREATED_AT";

    // Build cache key parts, only including non-empty values
    const parts = [];
    parts.push(`session:${sessionId}`);
    if (userIds) parts.push(`users:${userIds}`);
    if (expensePeriod) parts.push(`period:${expensePeriod}`);
    if (tagIds) parts.push(`tags:${tagIds}`);
    if (modeIds) parts.push(`modes:${modeIds}`);
    if (fynixIds) parts.push(`fynix:${fynixIds}`);
    if (minAmount) parts.push(`min:${minAmount}`);
    if (maxAmount) parts.push(`max:${maxAmount}`);
    if (statuses) parts.push(`status:${statuses}`);
    parts.push(`first:${first}`);
    if (after) parts.push(`after:${after}`);
    parts.push(`sort:${sort}`);
    parts.push(`sortBy:${sortBy}`);

    return `paginated_expenses:${parts.join("|")}`;
  }

  async paginatedExpenseTrackers(args: QueryPaginatedExpenseTrackersArgs): Promise<ExpenseTrackerConnection> {
    try {
      trackerAccessValidators({ sessionUser: this.sessionUser, target: { user_id: args.session_id } });

      const processedInput: PaginatedExpenseInputs = args.input ?? {
        first: 10,
        sort: Sort.Desc,
        sort_by: Sort_By.CreatedAt,
      };

      // Generate robust cache key from session ID and all filters
      const cacheKey = this.generatePaginatedExpenseCacheKey(args.session_id, processedInput);

      // Check cache first
      const cachedData = expenseCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // If not in cache, fetch from data source
      const expenseTrackers = await this.expenseDataSource.paginatedExpenseTrackers(args.session_id, processedInput);
      /**
       * The type assertion tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      const result = {
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

      // Set the data in cache
      expenseCache.set(cacheKey, result);

      return result;
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

      // Generate cache key from user IDs
      const cacheKey = `expense_by_users:${args.user_ids.sort().join(",")}`;

      // Check cache first
      const cachedData = expenseCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      // Fetch expense data if not cached
      const expenses = await this.expenseDataSource.expenseByUserIds(args.user_ids);

      /**
       * The type assertion as ExpenseTracker tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      const result = expenses.map((expense) => ({
        ...expense,
        // These will be resolved by nested resolvers
        tag: null as any,
        mode: null as any,
        fynix: null as any,
        status: expense.status as unknown as ExpenseStatus,
      })) as Array<ExpenseTracker>;

      // Store in cache
      expenseCache.set(cacheKey, result);

      return result;
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

      // Generate cache key from expense ID
      const cacheKey = `expense:${args.id}`;

      // Check cache first
      const cachedData = expenseCache.get(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      // Fetch the expense tracker
      const expenseTracker = await this.expenseDataSource.expenseTrackerById(args.id);

      /**
       * The type assertion as ExpenseTracker tells TypeScript to treat the object as the correct type,
       * while the nested resolvers will actually populate these fields(tags, modes & fynix) in the returned object.
       */
      const result = {
        ...expenseTracker,
        // These will be resolved by nested resolvers
        tag: null as any,
        mode: null as any,
        fynix: null as any,
      } as ExpenseTracker;

      // Store in cache
      expenseCache.set(cacheKey, result);

      return result;
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

      const result = await this.expenseDataSource.createExpenseTracker(input);

      // Invalidate relevant caches when creating a new expense
      this.invalidateUserExpenseCaches(input.user_id);
      return result;
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

      const result = await this.expenseDataSource.updateExpenseTracker(input);

      // Invalidate specific expense and user expense caches
      expenseCache.delete(`expense:${input.id}`);
      this.invalidateUserExpenseCaches(input.user_id);
      this.invalidateTagModeFynixCaches(input.tag_id, input.mode_id, input.fynix_id);

      return result;
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

      // For caching - expenseTrackerById : Get the expense before deleting to know which tags/modes/fynixes to invalidate

      // Run both operations in parallel
      const [expense, result] = await Promise.all([
        this.expenseDataSource.expenseTrackerById(input.id),
        this.expenseDataSource.deleteExpenseTracker(input),
      ]);

      // Invalidate specific expense and user expense caches
      expenseCache.delete(`expense:${input.id}`);
      this.invalidateUserExpenseCaches(input.user_id);

      // If we have the expense data, invalidate related caches
      if (expense) {
        this.invalidateTagModeFynixCaches(expense.tag_id, expense.mode_id, expense.fynix_id);
      }

      return result;
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
  // Helper method to invalidate all caches related to a specific user
  private invalidateUserExpenseCaches(userId: string): void {
    // Invalidate any paginated queries for this user
    expenseCache.invalidateByPattern(`paginated_expenses:.*session:${userId}|.*`);
    expenseCache.invalidateByPattern(`paginated_expenses:.*users:${userId}.*`);

    // Invalidate any user-specific expense lists
    expenseCache.invalidateByPattern(`expense_by_users:.*${userId}.*`);
  }

  // Helper method to invalidate caches related to specific tags, modes, or fynixes
  private invalidateTagModeFynixCaches(tagId?: string, modeId?: string, fynixId?: string): void {
    if (tagId) {
      expenseCache.invalidateByPattern(`paginated_expenses:.*tags:${tagId}.*`);
    }

    if (modeId) {
      expenseCache.invalidateByPattern(`paginated_expenses:.*modes:${modeId}.*`);
    }

    if (fynixId) {
      expenseCache.invalidateByPattern(`paginated_expenses:.*fynix:${fynixId}.*`);
    }
  }
}
