import { DocumentNode, ExecutionResult } from "graphql";
import gql from "graphql-tag";
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends " $fragmentName" | "__typename" ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
  JSON: { input: any; output: any };
  TransportOptions: { input: any; output: any };
  _DirectiveExtensions: { input: any; output: any };
  join__FieldSet: { input: any; output: any };
  link__Import: { input: any; output: any };
};

export type AdminKvAsset = {
  __typename?: "AdminKvAsset";
  kv_key: Scalars["String"]["output"];
  kv_value?: Maybe<Scalars["JSON"]["output"]>;
};

export type AdminKvAssetInput = {
  kv_key: Scalars["String"]["input"];
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

export type ChangePasswordInput = {
  confirm_password: Scalars["String"]["input"];
  current_password: Scalars["String"]["input"];
  id: Scalars["ID"]["input"];
  new_password: Scalars["String"]["input"];
};

export enum ColumnName {
  Address = "address",
  City = "city",
  Country = "country",
  Email = "email",
  Id = "id",
  Name = "name",
  Phone = "phone",
  Role = "role",
  State = "state",
  Zipcode = "zipcode",
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

export type DeleteUserInput = {
  id: Scalars["ID"]["input"];
};

export type EditUserInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  city?: InputMaybe<Scalars["String"]["input"]>;
  country?: InputMaybe<Scalars["String"]["input"]>;
  email: Scalars["String"]["input"];
  id: Scalars["ID"]["input"];
  name: Scalars["String"]["input"];
  phone: Scalars["String"]["input"];
  role?: InputMaybe<Role>;
  state?: InputMaybe<Scalars["String"]["input"]>;
  zipcode?: InputMaybe<Scalars["String"]["input"]>;
};

export type EditUserResponse = {
  __typename?: "EditUserResponse";
  success: Scalars["Boolean"]["output"];
  user?: Maybe<UserSuccessResponse>;
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
  fynix_id: Scalars["ID"]["output"];
  id: Scalars["ID"]["output"];
  is_disabled: Scalars["Boolean"]["output"];
  item_details?: Maybe<Scalars["String"]["output"]>;
  mode: Category;
  mode_id: Scalars["ID"]["output"];
  status: ExpenseStatus;
  tag: Category;
  tag_id: Scalars["ID"]["output"];
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
  user: User;
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

export type LoginInput = {
  email: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
};

export type LoginResponse = {
  __typename?: "LoginResponse";
  success: Scalars["Boolean"]["output"];
  token?: Maybe<Scalars["String"]["output"]>;
  user?: Maybe<UserSuccessResponse>;
};

export type LogoutResponse = {
  __typename?: "LogoutResponse";
  success: Scalars["Boolean"]["output"];
};

export type Mutation = {
  __typename?: "Mutation";
  changePassword: Scalars["Boolean"]["output"];
  createCategory: CategoryResponse;
  createExpenseTracker: ExpenseTrackerResponse;
  deleteCategory: Scalars["Boolean"]["output"];
  deleteExpenseTracker: Scalars["Boolean"]["output"];
  deleteUser: Scalars["Boolean"]["output"];
  editUser: EditUserResponse;
  login: LoginResponse;
  logout: LogoutResponse;
  signUp: SignUpResponse;
  updateCategory: CategoryResponse;
  updateExpenseTracker: ExpenseTrackerResponse;
};

export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
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

export type MutationDeleteUserArgs = {
  input: DeleteUserInput;
};

export type MutationEditUserArgs = {
  input: EditUserInput;
};

export type MutationLoginArgs = {
  input: LoginInput;
};

export type MutationSignUpArgs = {
  input: SignUpInput;
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
  fynix_ids?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  max_amount?: InputMaybe<Scalars["Float"]["input"]>;
  min_amount?: InputMaybe<Scalars["Float"]["input"]>;
  mode_ids?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  sort?: InputMaybe<Sort>;
  sort_by?: InputMaybe<Sort_By>;
  statuses?: InputMaybe<Array<InputMaybe<ExpenseStatus>>>;
  tag_ids?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
  user_ids?: InputMaybe<Array<InputMaybe<Scalars["ID"]["input"]>>>;
};

export type PaginatedUsersInputs = {
  after?: InputMaybe<Scalars["String"]["input"]>;
  first?: InputMaybe<Scalars["Int"]["input"]>;
  sort?: InputMaybe<Sort>;
  sort_by?: InputMaybe<Sort_By>;
};

export type Query = {
  __typename?: "Query";
  adminKvAsset?: Maybe<AdminKvAsset>;
  expenseFynixes?: Maybe<Array<Maybe<Category>>>;
  expenseModes?: Maybe<Array<Maybe<Category>>>;
  expenseTags?: Maybe<Array<Maybe<Category>>>;
  expenseTrackerById?: Maybe<ExpenseTracker>;
  expenseTrackerByUserIds: Array<Maybe<ExpenseTracker>>;
  paginatedExpenseTrackers: ExpenseTrackerConnection;
  paginatedUsers?: Maybe<UsersConnection>;
  userByEmail?: Maybe<UserResponse>;
  userByfield?: Maybe<Array<Maybe<UserResponse>>>;
  users?: Maybe<Array<Maybe<UserResponse>>>;
};

export type QueryAdminKvAssetArgs = {
  input: AdminKvAssetInput;
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
  id: Scalars["ID"]["input"];
  session_id: Scalars["ID"]["input"];
};

export type QueryExpenseTrackerByUserIdsArgs = {
  session_id: Scalars["ID"]["input"];
  user_ids: Array<Scalars["ID"]["input"]>;
};

export type QueryPaginatedExpenseTrackersArgs = {
  input?: InputMaybe<PaginatedExpenseInputs>;
  session_id: Scalars["ID"]["input"];
};

export type QueryPaginatedUsersArgs = {
  ids?: InputMaybe<Array<Scalars["ID"]["input"]>>;
  input?: InputMaybe<PaginatedUsersInputs>;
};

export type QueryUserByEmailArgs = {
  input: UserByEmailInput;
};

export type QueryUserByfieldArgs = {
  input: UserByFieldInput;
};

export enum Role {
  Admin = "ADMIN",
  User = "USER",
}

export enum Sort_By {
  CreatedAt = "CREATED_AT",
  UpdatedAt = "UPDATED_AT",
}

export type SignUpInput = {
  address?: InputMaybe<Scalars["String"]["input"]>;
  city?: InputMaybe<Scalars["String"]["input"]>;
  country?: InputMaybe<Scalars["String"]["input"]>;
  email: Scalars["String"]["input"];
  name: Scalars["String"]["input"];
  password: Scalars["String"]["input"];
  phone: Scalars["String"]["input"];
  role?: InputMaybe<Role>;
  state?: InputMaybe<Scalars["String"]["input"]>;
  zipcode?: InputMaybe<Scalars["String"]["input"]>;
};

export type SignUpResponse = {
  __typename?: "SignUpResponse";
  success: Scalars["Boolean"]["output"];
  user?: Maybe<UserSuccessResponse>;
};

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

export type User = {
  __typename?: "User";
  address?: Maybe<Scalars["String"]["output"]>;
  city?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["DateTime"]["output"];
  created_by: Scalars["String"]["output"];
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  password: Scalars["String"]["output"];
  phone: Scalars["String"]["output"];
  role: Role;
  state?: Maybe<Scalars["String"]["output"]>;
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
  zipcode?: Maybe<Scalars["String"]["output"]>;
};

export type UserByEmailInput = {
  email: Scalars["String"]["input"];
};

export type UserByFieldInput = {
  field: ColumnName;
  value: Scalars["String"]["input"];
};

export type UserEdge = {
  __typename?: "UserEdge";
  cursor: Scalars["String"]["output"];
  node: UserResponse;
};

export type UserResponse = {
  __typename?: "UserResponse";
  address?: Maybe<Scalars["String"]["output"]>;
  city?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  created_at: Scalars["DateTime"]["output"];
  created_by: Scalars["String"]["output"];
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  phone: Scalars["String"]["output"];
  role: Role;
  state?: Maybe<Scalars["String"]["output"]>;
  updated_at: Scalars["DateTime"]["output"];
  updated_by: Scalars["String"]["output"];
  zipcode?: Maybe<Scalars["String"]["output"]>;
};

export type UserSuccessResponse = {
  __typename?: "UserSuccessResponse";
  address?: Maybe<Scalars["String"]["output"]>;
  city?: Maybe<Scalars["String"]["output"]>;
  country?: Maybe<Scalars["String"]["output"]>;
  email: Scalars["String"]["output"];
  id: Scalars["ID"]["output"];
  name: Scalars["String"]["output"];
  phone: Scalars["String"]["output"];
  role: Role;
  state?: Maybe<Scalars["String"]["output"]>;
  zipcode?: Maybe<Scalars["String"]["output"]>;
};

export type UsersConnection = {
  __typename?: "UsersConnection";
  edges: Array<UserEdge>;
  pageInfo: PageInfo;
};

export enum Join__Graph {
  ExpenseTracker = "EXPENSE_TRACKER",
  UserService = "USER_SERVICE",
}

export enum Link__Purpose {
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  Execution = "EXECUTION",
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  Security = "SECURITY",
}

export type Requester<C = {}, E = unknown> = <R, V>(
  doc: DocumentNode,
  vars?: V,
  options?: C,
) => Promise<ExecutionResult<R, E>> | AsyncIterable<ExecutionResult<R, E>>;
export function getSdk<C, E>(requester: Requester<C, E>) {
  return {};
}
export type Sdk = ReturnType<typeof getSdk>;
