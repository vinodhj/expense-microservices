import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from "graphql";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  _Any: { input: any; output: any };
  _FieldSet: { input: any; output: any };
};

export type Category = {
  __typename?: "Category";
  created_at: Scalars["DateTime"]["output"];
  created_by: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
};

export type CategoryFilter = {
  id?: InputMaybe<Scalars["ID"]["input"]>;
  search?: InputMaybe<Scalars["String"]["input"]>;
};

export type CategoryResponse = {
  __typename?: "CategoryResponse";
  category?: Maybe<CategorySuccessResponse>;
  success: Scalars["Boolean"]["output"];
};

export type CategorySuccessResponse = {
  __typename?: "CategorySuccessResponse";
  category_type: CategoryType;
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
};

export enum CategoryType {
  ExpenseFynix = "EXPENSE_FYNIX",
  ExpenseMode = "EXPENSE_MODE",
  ExpenseTag = "EXPENSE_TAG",
}

export type CreateCategoryInput = {
  category_type: CategoryType;
  name: Scalars["String"]["input"];
};

export type CreateExpenseTrackerInput = {
  amount: Scalars["Float"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  expense_period: Scalars["String"]["input"];
  fynix_id: Scalars["ID"]["input"];
  item_details?: InputMaybe<Scalars["String"]["input"]>;
  mode_id: Scalars["ID"]["input"];
  status: ExpenseStatus;
  tag_id: Scalars["ID"]["input"];
  user_id: Scalars["ID"]["input"];
};

export type DeleteCategoryInput = {
  category_type: CategoryType;
  id: Scalars["ID"]["input"];
};

export type DeleteExpenseTrackerInput = {
  id: Scalars["ID"]["input"];
  user_id: Scalars["ID"]["input"];
};

export enum ExpenseStatus {
  NextDue = "NextDue",
  Paid = "Paid",
  UnPaid = "UnPaid",
}

export type ExpenseTracker = {
  __typename?: "ExpenseTracker";
  amount: Scalars["Float"]["output"];
  created_at: Scalars["DateTime"]["output"];
  created_by: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  expense_period: Scalars["String"]["output"];
  fynix: Category;
  id: Scalars["ID"]["output"];
  is_disabled: Scalars["Boolean"]["output"];
  item_details?: Maybe<Scalars["String"]["output"]>;
  mode: Category;
  status: ExpenseStatus;
  tag: Category;
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
  user_id: Scalars["String"]["output"];
};

export type ExpenseTrackerConnection = {
  __typename?: "ExpenseTrackerConnection";
  edges: Array<ExpenseTrackerEdge>;
  pageInfo: PageInfo;
};

export type ExpenseTrackerEdge = {
  __typename?: "ExpenseTrackerEdge";
  cursor: Scalars["String"]["output"];
  node: ExpenseTracker;
};

export type ExpenseTrackerResponse = {
  __typename?: "ExpenseTrackerResponse";
  expenseTracker?: Maybe<ExpenseTrackerSuccessResponse>;
  success: Scalars["Boolean"]["output"];
};

export type ExpenseTrackerSuccessResponse = {
  __typename?: "ExpenseTrackerSuccessResponse";
  amount: Scalars["Float"]["output"];
  created_at: Scalars["DateTime"]["output"];
  created_by: Scalars["String"]["output"];
  description?: Maybe<Scalars["String"]["output"]>;
  expense_period: Scalars["String"]["output"];
  fynix_id: Scalars["ID"]["output"];
  id: Scalars["ID"]["output"];
  item_details?: Maybe<Scalars["String"]["output"]>;
  mode_id: Scalars["ID"]["output"];
  status: ExpenseStatus;
  tag_id: Scalars["ID"]["output"];
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
  user_id: Scalars["String"]["output"];
};

export type GenericCategoryResponse = {
  __typename?: "GenericCategoryResponse";
  category_type: CategoryType;
  created_at: Scalars["DateTime"]["output"];
  created_by: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  is_disabled: Scalars["Boolean"]["output"];
  name: Scalars["String"]["output"];
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  createCategory: CategoryResponse;
  createExpenseTracker: ExpenseTrackerResponse;
  deleteCategory: Scalars["Boolean"]["output"];
  deleteExpenseTracker: Scalars["Boolean"]["output"];
  updateCategory: CategoryResponse;
  updateExpenseTracker: ExpenseTrackerResponse;
};

export type MutationCreateCategoryArgs = {
  input: CreateCategoryInput;
};

export type MutationCreateExpenseTrackerArgs = {
  input: CreateExpenseTrackerInput;
};

export type MutationDeleteCategoryArgs = {
  input: DeleteCategoryInput;
};

export type MutationDeleteExpenseTrackerArgs = {
  input: DeleteExpenseTrackerInput;
};

export type MutationUpdateCategoryArgs = {
  input: UpdateCategoryInput;
};

export type MutationUpdateExpenseTrackerArgs = {
  input: UpdateExpenseTrackerInput;
};

export type PageInfo = {
  __typename?: "PageInfo";
  endCursor?: Maybe<Scalars["String"]["output"]>;
  hasNextPage: Scalars["Boolean"]["output"];
};

export type PaginatedExpenseInputs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  expense_period?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  fynix_id?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  max_amount?: InputMaybe<Scalars["Float"]["input"]>;
  min_amount?: InputMaybe<Scalars["Float"]["input"]>;
  mode_id?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  sort?: InputMaybe<Sort>;
  sort_by?: InputMaybe<Sort_By>;
  statuses?: InputMaybe<Array<InputMaybe<ExpenseStatus>>>;
  tag_id?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user_ids?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
};

export type Query = {
  __typename?: "Query";
  _service: _Service;
  expenseFynixes?: Maybe<Array<Maybe<Category>>>;
  expenseModes?: Maybe<Array<Maybe<Category>>>;
  expenseTags?: Maybe<Array<Maybe<Category>>>;
  expenseTrackerById?: Maybe<ExpenseTracker>;
  expenseTrackerByUserIds: Array<Maybe<ExpenseTracker>>;
  paginatedExpenseTrackers: ExpenseTrackerConnection;
};

export type QueryExpenseFynixesArgs = {
  input?: InputMaybe<CategoryFilter>;
};

export type QueryExpenseModesArgs = {
  input?: InputMaybe<CategoryFilter>;
};

export type QueryExpenseTagsArgs = {
  input?: InputMaybe<CategoryFilter>;
};

export type QueryExpenseTrackerByIdArgs = {
  ids: Scalars["ID"]["input"];
};

export type QueryExpenseTrackerByUserIdsArgs = {
  user_id: Array<Scalars["ID"]["input"]>;
};

export type QueryPaginatedExpenseTrackersArgs = {
  input?: InputMaybe<PaginatedExpenseInputs>;
  session_id?: InputMaybe<Scalars["ID"]["input"]>;
};

export enum Sort_By {
  Amount = "AMOUNT",
  CreatedAt = "CREATED_AT",
  UpdatedAt = "UPDATED_AT",
}

export enum Sort {
  Asc = "ASC",
  Desc = "DESC",
}

export type UpdateCategoryInput = {
  category_type: CategoryType;
  id: Scalars["ID"]["input"];
  name: Scalars["String"]["input"];
};

export type UpdateExpenseTrackerInput = {
  amount: Scalars["Float"]["input"];
  description?: InputMaybe<Scalars["String"]["input"]>;
  expense_period: Scalars["String"]["input"];
  fynix_id: Scalars["ID"]["input"];
  id: Scalars["ID"]["input"];
  item_details?: InputMaybe<Scalars["String"]["input"]>;
  mode_id: Scalars["ID"]["input"];
  status: ExpenseStatus;
  tag_id: Scalars["ID"]["input"];
  user_id: Scalars["ID"]["input"];
};

export type _Service = {
  __typename?: "_Service";
  sdl?: Maybe<Scalars["String"]["output"]>;
};

export type ResolverTypeWrapper<T> = Promise<T> | T;

export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> =
  | ResolverFn<TResult, TParent, TContext, TArgs>
  | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo,
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo,
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  Category: ResolverTypeWrapper<Category>;
  CategoryFilter: CategoryFilter;
  CategoryResponse: ResolverTypeWrapper<CategoryResponse>;
  CategorySuccessResponse: ResolverTypeWrapper<CategorySuccessResponse>;
  CategoryType: CategoryType;
  CreateCategoryInput: CreateCategoryInput;
  CreateExpenseTrackerInput: CreateExpenseTrackerInput;
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]["output"]>;
  DeleteCategoryInput: DeleteCategoryInput;
  DeleteExpenseTrackerInput: DeleteExpenseTrackerInput;
  ExpenseStatus: ExpenseStatus;
  ExpenseTracker: ResolverTypeWrapper<ExpenseTracker>;
  ExpenseTrackerConnection: ResolverTypeWrapper<ExpenseTrackerConnection>;
  ExpenseTrackerEdge: ResolverTypeWrapper<ExpenseTrackerEdge>;
  ExpenseTrackerResponse: ResolverTypeWrapper<ExpenseTrackerResponse>;
  ExpenseTrackerSuccessResponse: ResolverTypeWrapper<ExpenseTrackerSuccessResponse>;
  Float: ResolverTypeWrapper<Scalars["Float"]["output"]>;
  GenericCategoryResponse: ResolverTypeWrapper<GenericCategoryResponse>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  Int: ResolverTypeWrapper<Scalars["Int"]["output"]>;
  Mutation: ResolverTypeWrapper<{}>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginatedExpenseInputs: PaginatedExpenseInputs;
  Query: ResolverTypeWrapper<{}>;
  SORT_BY: Sort_By;
  Sort: Sort;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  UpdateCategoryInput: UpdateCategoryInput;
  UpdateExpenseTrackerInput: UpdateExpenseTrackerInput;
  _Any: ResolverTypeWrapper<Scalars["_Any"]["output"]>;
  _FieldSet: ResolverTypeWrapper<Scalars["_FieldSet"]["output"]>;
  _Service: ResolverTypeWrapper<_Service>;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars["Boolean"]["output"];
  Category: Category;
  CategoryFilter: CategoryFilter;
  CategoryResponse: CategoryResponse;
  CategorySuccessResponse: CategorySuccessResponse;
  CreateCategoryInput: CreateCategoryInput;
  CreateExpenseTrackerInput: CreateExpenseTrackerInput;
  DateTime: Scalars["DateTime"]["output"];
  DeleteCategoryInput: DeleteCategoryInput;
  DeleteExpenseTrackerInput: DeleteExpenseTrackerInput;
  ExpenseTracker: ExpenseTracker;
  ExpenseTrackerConnection: ExpenseTrackerConnection;
  ExpenseTrackerEdge: ExpenseTrackerEdge;
  ExpenseTrackerResponse: ExpenseTrackerResponse;
  ExpenseTrackerSuccessResponse: ExpenseTrackerSuccessResponse;
  Float: Scalars["Float"]["output"];
  GenericCategoryResponse: GenericCategoryResponse;
  ID: Scalars["ID"]["output"];
  Int: Scalars["Int"]["output"];
  Mutation: {};
  PageInfo: PageInfo;
  PaginatedExpenseInputs: PaginatedExpenseInputs;
  Query: {};
  String: Scalars["String"]["output"];
  UpdateCategoryInput: UpdateCategoryInput;
  UpdateExpenseTrackerInput: UpdateExpenseTrackerInput;
  _Any: Scalars["_Any"]["output"];
  _FieldSet: Scalars["_FieldSet"]["output"];
  _Service: _Service;
};

export type ExtendsDirectiveArgs = {};

export type ExtendsDirectiveResolver<Result, Parent, ContextType = any, Args = ExtendsDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type ExternalDirectiveArgs = {
  reason?: Maybe<Scalars["String"]["input"]>;
};

export type ExternalDirectiveResolver<Result, Parent, ContextType = any, Args = ExternalDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type KeyDirectiveArgs = {
  fields: Scalars["_FieldSet"]["input"];
  resolvable?: Maybe<Scalars["Boolean"]["input"]>;
};

export type KeyDirectiveResolver<Result, Parent, ContextType = any, Args = KeyDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type ProvidesDirectiveArgs = {
  fields: Scalars["_FieldSet"]["input"];
};

export type ProvidesDirectiveResolver<Result, Parent, ContextType = any, Args = ProvidesDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type RequiresDirectiveArgs = {
  fields: Scalars["_FieldSet"]["input"];
};

export type RequiresDirectiveResolver<Result, Parent, ContextType = any, Args = RequiresDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type TagDirectiveArgs = {
  name: Scalars["String"]["input"];
};

export type TagDirectiveResolver<Result, Parent, ContextType = any, Args = TagDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type CategoryResolvers<ContextType = any, ParentType extends ResolversParentTypes["Category"] = ResolversParentTypes["Category"]> = {
  created_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  created_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updated_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategoryResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["CategoryResponse"] = ResolversParentTypes["CategoryResponse"],
> = {
  category?: Resolver<Maybe<ResolversTypes["CategorySuccessResponse"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategorySuccessResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["CategorySuccessResponse"] = ResolversParentTypes["CategorySuccessResponse"],
> = {
  category_type?: Resolver<ResolversTypes["CategoryType"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export type ExpenseTrackerResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["ExpenseTracker"] = ResolversParentTypes["ExpenseTracker"],
> = {
  amount?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  created_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  expense_period?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  fynix?: Resolver<ResolversTypes["Category"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  is_disabled?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  item_details?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  mode?: Resolver<ResolversTypes["Category"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["ExpenseStatus"], ParentType, ContextType>;
  tag?: Resolver<ResolversTypes["Category"], ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updated_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  user_id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExpenseTrackerConnectionResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["ExpenseTrackerConnection"] = ResolversParentTypes["ExpenseTrackerConnection"],
> = {
  edges?: Resolver<Array<ResolversTypes["ExpenseTrackerEdge"]>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes["PageInfo"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExpenseTrackerEdgeResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["ExpenseTrackerEdge"] = ResolversParentTypes["ExpenseTrackerEdge"],
> = {
  cursor?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  node?: Resolver<ResolversTypes["ExpenseTracker"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExpenseTrackerResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["ExpenseTrackerResponse"] = ResolversParentTypes["ExpenseTrackerResponse"],
> = {
  expenseTracker?: Resolver<Maybe<ResolversTypes["ExpenseTrackerSuccessResponse"]>, ParentType, ContextType>;
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExpenseTrackerSuccessResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["ExpenseTrackerSuccessResponse"] = ResolversParentTypes["ExpenseTrackerSuccessResponse"],
> = {
  amount?: Resolver<ResolversTypes["Float"], ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  created_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  expense_period?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  fynix_id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  item_details?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  mode_id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  status?: Resolver<ResolversTypes["ExpenseStatus"], ParentType, ContextType>;
  tag_id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updated_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  user_id?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GenericCategoryResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["GenericCategoryResponse"] = ResolversParentTypes["GenericCategoryResponse"],
> = {
  category_type?: Resolver<ResolversTypes["CategoryType"], ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  created_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  is_disabled?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updated_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]> = {
  createCategory?: Resolver<
    ResolversTypes["CategoryResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateCategoryArgs, "input">
  >;
  createExpenseTracker?: Resolver<
    ResolversTypes["ExpenseTrackerResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationCreateExpenseTrackerArgs, "input">
  >;
  deleteCategory?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType, RequireFields<MutationDeleteCategoryArgs, "input">>;
  deleteExpenseTracker?: Resolver<
    ResolversTypes["Boolean"],
    ParentType,
    ContextType,
    RequireFields<MutationDeleteExpenseTrackerArgs, "input">
  >;
  updateCategory?: Resolver<
    ResolversTypes["CategoryResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateCategoryArgs, "input">
  >;
  updateExpenseTracker?: Resolver<
    ResolversTypes["ExpenseTrackerResponse"],
    ParentType,
    ContextType,
    RequireFields<MutationUpdateExpenseTrackerArgs, "input">
  >;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes["PageInfo"] = ResolversParentTypes["PageInfo"]> = {
  endCursor?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]> = {
  _service?: Resolver<ResolversTypes["_Service"], ParentType, ContextType>;
  expenseFynixes?: Resolver<Maybe<Array<Maybe<ResolversTypes["Category"]>>>, ParentType, ContextType, Partial<QueryExpenseFynixesArgs>>;
  expenseModes?: Resolver<Maybe<Array<Maybe<ResolversTypes["Category"]>>>, ParentType, ContextType, Partial<QueryExpenseModesArgs>>;
  expenseTags?: Resolver<Maybe<Array<Maybe<ResolversTypes["Category"]>>>, ParentType, ContextType, Partial<QueryExpenseTagsArgs>>;
  expenseTrackerById?: Resolver<
    Maybe<ResolversTypes["ExpenseTracker"]>,
    ParentType,
    ContextType,
    RequireFields<QueryExpenseTrackerByIdArgs, "ids">
  >;
  expenseTrackerByUserIds?: Resolver<
    Array<Maybe<ResolversTypes["ExpenseTracker"]>>,
    ParentType,
    ContextType,
    RequireFields<QueryExpenseTrackerByUserIdsArgs, "user_id">
  >;
  paginatedExpenseTrackers?: Resolver<
    ResolversTypes["ExpenseTrackerConnection"],
    ParentType,
    ContextType,
    Partial<QueryPaginatedExpenseTrackersArgs>
  >;
};

export interface _AnyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["_Any"], any> {
  name: "_Any";
}

export interface _FieldSetScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["_FieldSet"], any> {
  name: "_FieldSet";
}

export type _ServiceResolvers<ContextType = any, ParentType extends ResolversParentTypes["_Service"] = ResolversParentTypes["_Service"]> = {
  sdl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Category?: CategoryResolvers<ContextType>;
  CategoryResponse?: CategoryResponseResolvers<ContextType>;
  CategorySuccessResponse?: CategorySuccessResponseResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  ExpenseTracker?: ExpenseTrackerResolvers<ContextType>;
  ExpenseTrackerConnection?: ExpenseTrackerConnectionResolvers<ContextType>;
  ExpenseTrackerEdge?: ExpenseTrackerEdgeResolvers<ContextType>;
  ExpenseTrackerResponse?: ExpenseTrackerResponseResolvers<ContextType>;
  ExpenseTrackerSuccessResponse?: ExpenseTrackerSuccessResponseResolvers<ContextType>;
  GenericCategoryResponse?: GenericCategoryResponseResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  _Any?: GraphQLScalarType;
  _FieldSet?: GraphQLScalarType;
  _Service?: _ServiceResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  extends?: ExtendsDirectiveResolver<any, any, ContextType>;
  external?: ExternalDirectiveResolver<any, any, ContextType>;
  key?: KeyDirectiveResolver<any, any, ContextType>;
  provides?: ProvidesDirectiveResolver<any, any, ContextType>;
  requires?: RequiresDirectiveResolver<any, any, ContextType>;
  tag?: TagDirectiveResolver<any, any, ContextType>;
};
