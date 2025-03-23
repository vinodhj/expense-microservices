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
  JSON: { input: any; output: any };
  _Any: { input: any; output: any };
  federation__FieldSet: { input: any; output: any };
  federation__Policy: { input: any; output: any };
  federation__Scope: { input: any; output: any };
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
  deleteUser: Scalars["Boolean"]["output"];
  editUser: EditUserResponse;
  login: LoginResponse;
  logout: LogoutResponse;
  signUp: SignUpResponse;
};

export type MutationChangePasswordArgs = {
  input: ChangePasswordInput;
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

export type Query = {
  __typename?: "Query";
  _service: _Service;
  adminKvAsset?: Maybe<AdminKvAsset>;
  userByEmail?: Maybe<UserResponse>;
  userByfield?: Maybe<Array<Maybe<UserResponse>>>;
  users?: Maybe<Array<Maybe<UserResponse>>>;
};

export type QueryAdminKvAssetArgs = {
  input: AdminKvAssetInput;
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

export type _Service = {
  __typename?: "_Service";
  sdl?: Maybe<Scalars["String"]["output"]>;
};

export enum Link__Purpose {
  /** `EXECUTION` features provide metadata necessary for operation execution. */
  Execution = "EXECUTION",
  /** `SECURITY` features provide metadata necessary to securely resolve fields. */
  Security = "SECURITY",
}

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
  AdminKvAsset: ResolverTypeWrapper<AdminKvAsset>;
  AdminKvAssetInput: AdminKvAssetInput;
  Boolean: ResolverTypeWrapper<Scalars["Boolean"]["output"]>;
  ChangePasswordInput: ChangePasswordInput;
  ColumnName: ColumnName;
  DateTime: ResolverTypeWrapper<Scalars["DateTime"]["output"]>;
  DeleteUserInput: DeleteUserInput;
  EditUserInput: EditUserInput;
  EditUserResponse: ResolverTypeWrapper<EditUserResponse>;
  ID: ResolverTypeWrapper<Scalars["ID"]["output"]>;
  JSON: ResolverTypeWrapper<Scalars["JSON"]["output"]>;
  LoginInput: LoginInput;
  LoginResponse: ResolverTypeWrapper<LoginResponse>;
  LogoutResponse: ResolverTypeWrapper<LogoutResponse>;
  Mutation: ResolverTypeWrapper<{}>;
  Query: ResolverTypeWrapper<{}>;
  Role: Role;
  SignUpInput: SignUpInput;
  SignUpResponse: ResolverTypeWrapper<SignUpResponse>;
  String: ResolverTypeWrapper<Scalars["String"]["output"]>;
  User: ResolverTypeWrapper<User>;
  UserByEmailInput: UserByEmailInput;
  UserByFieldInput: UserByFieldInput;
  UserResponse: ResolverTypeWrapper<UserResponse>;
  UserSuccessResponse: ResolverTypeWrapper<UserSuccessResponse>;
  _Any: ResolverTypeWrapper<Scalars["_Any"]["output"]>;
  _Service: ResolverTypeWrapper<_Service>;
  federation__FieldSet: ResolverTypeWrapper<Scalars["federation__FieldSet"]["output"]>;
  federation__Policy: ResolverTypeWrapper<Scalars["federation__Policy"]["output"]>;
  federation__Scope: ResolverTypeWrapper<Scalars["federation__Scope"]["output"]>;
  link__Import: ResolverTypeWrapper<Scalars["link__Import"]["output"]>;
  link__Purpose: Link__Purpose;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AdminKvAsset: AdminKvAsset;
  AdminKvAssetInput: AdminKvAssetInput;
  Boolean: Scalars["Boolean"]["output"];
  ChangePasswordInput: ChangePasswordInput;
  DateTime: Scalars["DateTime"]["output"];
  DeleteUserInput: DeleteUserInput;
  EditUserInput: EditUserInput;
  EditUserResponse: EditUserResponse;
  ID: Scalars["ID"]["output"];
  JSON: Scalars["JSON"]["output"];
  LoginInput: LoginInput;
  LoginResponse: LoginResponse;
  LogoutResponse: LogoutResponse;
  Mutation: {};
  Query: {};
  SignUpInput: SignUpInput;
  SignUpResponse: SignUpResponse;
  String: Scalars["String"]["output"];
  User: User;
  UserByEmailInput: UserByEmailInput;
  UserByFieldInput: UserByFieldInput;
  UserResponse: UserResponse;
  UserSuccessResponse: UserSuccessResponse;
  _Any: Scalars["_Any"]["output"];
  _Service: _Service;
  federation__FieldSet: Scalars["federation__FieldSet"]["output"];
  federation__Policy: Scalars["federation__Policy"]["output"];
  federation__Scope: Scalars["federation__Scope"]["output"];
  link__Import: Scalars["link__Import"]["output"];
};

export type ComposeDirectiveDirectiveArgs = {
  name?: Maybe<Scalars["String"]["input"]>;
};

export type ComposeDirectiveDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = ComposeDirectiveDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__AuthenticatedDirectiveArgs = {};

export type Federation__AuthenticatedDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__AuthenticatedDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__ExtendsDirectiveArgs = {};

export type Federation__ExtendsDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__ExtendsDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__ExternalDirectiveArgs = {
  reason?: Maybe<Scalars["String"]["input"]>;
};

export type Federation__ExternalDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__ExternalDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__InaccessibleDirectiveArgs = {};

export type Federation__InaccessibleDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__InaccessibleDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__InterfaceObjectDirectiveArgs = {};

export type Federation__InterfaceObjectDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__InterfaceObjectDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__KeyDirectiveArgs = {
  fields: Scalars["federation__FieldSet"]["input"];
  resolvable?: Maybe<Scalars["Boolean"]["input"]>;
};

export type Federation__KeyDirectiveResolver<Result, Parent, ContextType = any, Args = Federation__KeyDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type Federation__OverrideDirectiveArgs = {
  from: Scalars["String"]["input"];
};

export type Federation__OverrideDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__OverrideDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__PolicyDirectiveArgs = {
  policies: Array<Array<Scalars["federation__Policy"]["input"]>>;
};

export type Federation__PolicyDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__PolicyDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__ProvidesDirectiveArgs = {
  fields: Scalars["federation__FieldSet"]["input"];
};

export type Federation__ProvidesDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__ProvidesDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__RequiresDirectiveArgs = {
  fields: Scalars["federation__FieldSet"]["input"];
};

export type Federation__RequiresDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__RequiresDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__RequiresScopesDirectiveArgs = {
  scopes: Array<Array<Scalars["federation__Scope"]["input"]>>;
};

export type Federation__RequiresScopesDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__RequiresScopesDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__ShareableDirectiveArgs = {};

export type Federation__ShareableDirectiveResolver<
  Result,
  Parent,
  ContextType = any,
  Args = Federation__ShareableDirectiveArgs,
> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type Federation__TagDirectiveArgs = {
  name: Scalars["String"]["input"];
};

export type Federation__TagDirectiveResolver<Result, Parent, ContextType = any, Args = Federation__TagDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type LinkDirectiveArgs = {
  as?: Maybe<Scalars["String"]["input"]>;
  for?: Maybe<Link__Purpose>;
  import?: Maybe<Array<Maybe<Scalars["link__Import"]["input"]>>>;
  url?: Maybe<Scalars["String"]["input"]>;
};

export type LinkDirectiveResolver<Result, Parent, ContextType = any, Args = LinkDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type PublicDirectiveArgs = {};

export type PublicDirectiveResolver<Result, Parent, ContextType = any, Args = PublicDirectiveArgs> = DirectiveResolverFn<
  Result,
  Parent,
  ContextType,
  Args
>;

export type AdminKvAssetResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["AdminKvAsset"] = ResolversParentTypes["AdminKvAsset"],
> = {
  kv_key?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  kv_value?: Resolver<Maybe<ResolversTypes["JSON"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["DateTime"], any> {
  name: "DateTime";
}

export type EditUserResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["EditUserResponse"] = ResolversParentTypes["EditUserResponse"],
> = {
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes["UserSuccessResponse"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["JSON"], any> {
  name: "JSON";
}

export type LoginResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["LoginResponse"] = ResolversParentTypes["LoginResponse"],
> = {
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  token?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes["UserSuccessResponse"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LogoutResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["LogoutResponse"] = ResolversParentTypes["LogoutResponse"],
> = {
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes["Mutation"] = ResolversParentTypes["Mutation"]> = {
  changePassword?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType, RequireFields<MutationChangePasswordArgs, "input">>;
  deleteUser?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, "input">>;
  editUser?: Resolver<ResolversTypes["EditUserResponse"], ParentType, ContextType, RequireFields<MutationEditUserArgs, "input">>;
  login?: Resolver<ResolversTypes["LoginResponse"], ParentType, ContextType, RequireFields<MutationLoginArgs, "input">>;
  logout?: Resolver<ResolversTypes["LogoutResponse"], ParentType, ContextType>;
  signUp?: Resolver<ResolversTypes["SignUpResponse"], ParentType, ContextType, RequireFields<MutationSignUpArgs, "input">>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes["Query"] = ResolversParentTypes["Query"]> = {
  _service?: Resolver<ResolversTypes["_Service"], ParentType, ContextType>;
  adminKvAsset?: Resolver<Maybe<ResolversTypes["AdminKvAsset"]>, ParentType, ContextType, RequireFields<QueryAdminKvAssetArgs, "input">>;
  userByEmail?: Resolver<Maybe<ResolversTypes["UserResponse"]>, ParentType, ContextType, RequireFields<QueryUserByEmailArgs, "input">>;
  userByfield?: Resolver<
    Maybe<Array<Maybe<ResolversTypes["UserResponse"]>>>,
    ParentType,
    ContextType,
    RequireFields<QueryUserByfieldArgs, "input">
  >;
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes["UserResponse"]>>>, ParentType, ContextType>;
};

export type SignUpResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["SignUpResponse"] = ResolversParentTypes["SignUpResponse"],
> = {
  success?: Resolver<ResolversTypes["Boolean"], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes["UserSuccessResponse"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes["User"] = ResolversParentTypes["User"]> = {
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  created_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  password?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  role?: Resolver<ResolversTypes["Role"], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updated_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  zipcode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["UserResponse"] = ResolversParentTypes["UserResponse"],
> = {
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  created_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  created_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  role?: Resolver<ResolversTypes["Role"], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  updated_at?: Resolver<ResolversTypes["DateTime"], ParentType, ContextType>;
  updated_by?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  zipcode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserSuccessResponseResolvers<
  ContextType = any,
  ParentType extends ResolversParentTypes["UserSuccessResponse"] = ResolversParentTypes["UserSuccessResponse"],
> = {
  address?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  city?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  id?: Resolver<ResolversTypes["ID"], ParentType, ContextType>;
  name?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes["String"], ParentType, ContextType>;
  role?: Resolver<ResolversTypes["Role"], ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  zipcode?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface _AnyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["_Any"], any> {
  name: "_Any";
}

export type _ServiceResolvers<ContextType = any, ParentType extends ResolversParentTypes["_Service"] = ResolversParentTypes["_Service"]> = {
  sdl?: Resolver<Maybe<ResolversTypes["String"]>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface Federation__FieldSetScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["federation__FieldSet"], any> {
  name: "federation__FieldSet";
}

export interface Federation__PolicyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["federation__Policy"], any> {
  name: "federation__Policy";
}

export interface Federation__ScopeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["federation__Scope"], any> {
  name: "federation__Scope";
}

export interface Link__ImportScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes["link__Import"], any> {
  name: "link__Import";
}

export type Resolvers<ContextType = any> = {
  AdminKvAsset?: AdminKvAssetResolvers<ContextType>;
  DateTime?: GraphQLScalarType;
  EditUserResponse?: EditUserResponseResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  LoginResponse?: LoginResponseResolvers<ContextType>;
  LogoutResponse?: LogoutResponseResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  SignUpResponse?: SignUpResponseResolvers<ContextType>;
  User?: UserResolvers<ContextType>;
  UserResponse?: UserResponseResolvers<ContextType>;
  UserSuccessResponse?: UserSuccessResponseResolvers<ContextType>;
  _Any?: GraphQLScalarType;
  _Service?: _ServiceResolvers<ContextType>;
  federation__FieldSet?: GraphQLScalarType;
  federation__Policy?: GraphQLScalarType;
  federation__Scope?: GraphQLScalarType;
  link__Import?: GraphQLScalarType;
};

export type DirectiveResolvers<ContextType = any> = {
  composeDirective?: ComposeDirectiveDirectiveResolver<any, any, ContextType>;
  federation__authenticated?: Federation__AuthenticatedDirectiveResolver<any, any, ContextType>;
  federation__extends?: Federation__ExtendsDirectiveResolver<any, any, ContextType>;
  federation__external?: Federation__ExternalDirectiveResolver<any, any, ContextType>;
  federation__inaccessible?: Federation__InaccessibleDirectiveResolver<any, any, ContextType>;
  federation__interfaceObject?: Federation__InterfaceObjectDirectiveResolver<any, any, ContextType>;
  federation__key?: Federation__KeyDirectiveResolver<any, any, ContextType>;
  federation__override?: Federation__OverrideDirectiveResolver<any, any, ContextType>;
  federation__policy?: Federation__PolicyDirectiveResolver<any, any, ContextType>;
  federation__provides?: Federation__ProvidesDirectiveResolver<any, any, ContextType>;
  federation__requires?: Federation__RequiresDirectiveResolver<any, any, ContextType>;
  federation__requiresScopes?: Federation__RequiresScopesDirectiveResolver<any, any, ContextType>;
  federation__shareable?: Federation__ShareableDirectiveResolver<any, any, ContextType>;
  federation__tag?: Federation__TagDirectiveResolver<any, any, ContextType>;
  link?: LinkDirectiveResolver<any, any, ContextType>;
  public?: PublicDirectiveResolver<any, any, ContextType>;
};
