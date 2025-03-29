export const supergraphSdl = /* GraphQL */ `
  schema
    @link(url: "https://specs.apollo.dev/link/v1.0")
    @link(url: "https://specs.apollo.dev/join/v0.3", for: EXECUTION)
    @link(
      url: "https://the-guild.dev/graphql/mesh/spec/v1.0"
      import: ["@transport", "@merge", "@extraSchemaDefinitionDirective", "@public"]
    ) {
    query: Query
    mutation: Mutation
  }

  directive @join__enumValue(graph: join__Graph!) repeatable on ENUM_VALUE

  directive @join__field(
    graph: join__Graph
    requires: join__FieldSet
    provides: join__FieldSet
    type: String
    external: Boolean
    override: String
    usedOverridden: Boolean
  ) repeatable on FIELD_DEFINITION | INPUT_FIELD_DEFINITION

  directive @join__graph(name: String!, url: String!) on ENUM_VALUE

  directive @join__implements(graph: join__Graph!, interface: String!) repeatable on OBJECT | INTERFACE

  directive @join__type(
    graph: join__Graph!
    key: join__FieldSet
    extension: Boolean! = false
    resolvable: Boolean! = true
    isInterfaceObject: Boolean! = false
  ) repeatable on OBJECT | INTERFACE | UNION | ENUM | INPUT_OBJECT | SCALAR

  directive @join__unionMember(graph: join__Graph!, member: String!) repeatable on UNION

  scalar join__FieldSet

  directive @link(url: String, as: String, for: link__Purpose, import: [link__Import]) repeatable on SCHEMA

  scalar link__Import

  enum link__Purpose {
    # \`SECURITY\` features provide metadata necessary to securely resolve fields.
    # \`EXECUTION\` features provide metadata necessary for operation execution.
    SECURITY
    EXECUTION
  }

  enum join__Graph {
    EXPENSE_TRACKER @join__graph(name: "ExpenseTracker", url: "http://localhost:8502/graphql")
    USER_SERVICE @join__graph(name: "UserService", url: "http://localhost:8501/graphql")
  }

  directive @transport(
    kind: String!
    subgraph: String!
    location: String!
    headers: [[String]]
    options: TransportOptions
  ) repeatable on SCHEMA

  directive @merge(
    subgraph: String
    argsExpr: String
    keyArg: String
    keyField: String
    key: [String!]
    additionalArgs: String
  ) repeatable on FIELD_DEFINITION

  directive @extraSchemaDefinitionDirective(directives: _DirectiveExtensions) repeatable on OBJECT

  directive @public on FIELD_DEFINITION

  scalar DateTime @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE)

  scalar TransportOptions @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE)

  scalar _DirectiveExtensions @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE)

  scalar JSON @join__type(graph: USER_SERVICE)

  type GenericCategoryResponse @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    name: String!
    category_type: CategoryType!
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
    is_disabled: Boolean!
  }

  type Category @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    name: String!
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
  }

  type CategorySuccessResponse @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    name: String!
    category_type: CategoryType!
  }

  type CategoryResponse @join__type(graph: EXPENSE_TRACKER) {
    success: Boolean!
    category: CategorySuccessResponse
  }

  type ExpenseTracker @join__type(graph: EXPENSE_TRACKER, key: "id") {
    id: ID!
    user_id: String!
    expense_period: String!
    amount: Float!
    description: String
    item_details: String
    tag_id: ID!
    mode_id: ID!
    fynix_id: ID!
    tag: Category!
    mode: Category!
    fynix: Category!
    status: ExpenseStatus!
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
    is_disabled: Boolean!
  }

  type ExpenseTrackerSuccessResponse @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    user_id: String!
    expense_period: String!
    amount: Float!
    description: String
    item_details: String
    status: ExpenseStatus!
    tag_id: ID!
    mode_id: ID!
    fynix_id: ID!
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
  }

  type ExpenseTrackerEdge @join__type(graph: EXPENSE_TRACKER) {
    node: ExpenseTracker!
    cursor: String!
  }

  type PageInfo @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE) {
    endCursor: String
    hasNextPage: Boolean!
  }

  type ExpenseTrackerConnection @join__type(graph: EXPENSE_TRACKER) {
    edges: [ExpenseTrackerEdge!]!
    pageInfo: PageInfo!
  }

  type ExpenseTrackerResponse @join__type(graph: EXPENSE_TRACKER) {
    success: Boolean!
    expenseTracker: ExpenseTrackerSuccessResponse
  }

  type Query
    @extraSchemaDefinitionDirective(
      directives: {
        transport: [
          {
            kind: "http"
            subgraph: "ExpenseTracker"
            location: "http://localhost:8502/graphql"
            headers: [
              ["Authorization", "{context.headers.Authorization}"]
              ["X-Project-Token", "{context.headers.X-Project-Token}"]
              ["X-Gateway-Nonce", "{context.gateway_nonce}"]
              ["X-Gateway-Signature", "{context.gateway_signature}"]
              ["X-Gateway-Timestamp", "{context.gateway_timestamp}"]
              ["X-User-Id", "{context.current_session_user.id}"]
              ["X-User-Role", "{context.current_session_user.role}"]
              ["X-User-Email", "{context.current_session_user.email}"]
              ["X-User-Name", "{context.current_session_user.name}"]
            ]
            options: { method: "POST", credentials: "include", retry: 3, timeout: 10000 }
          }
        ]
      }
    )
    @extraSchemaDefinitionDirective(
      directives: {
        transport: [
          {
            kind: "http"
            subgraph: "UserService"
            location: "http://localhost:8501/graphql"
            headers: [
              ["Authorization", "{context.headers.Authorization}"]
              ["X-Project-Token", "{context.headers.X-Project-Token}"]
              ["X-Gateway-Nonce", "{context.gateway_nonce}"]
              ["X-Gateway-Signature", "{context.gateway_signature}"]
              ["X-Gateway-Timestamp", "{context.gateway_timestamp}"]
              ["X-User-Id", "{context.current_session_user.id}"]
              ["X-User-Role", "{context.current_session_user.role}"]
              ["X-User-Email", "{context.current_session_user.email}"]
              ["X-User-Name", "{context.current_session_user.name}"]
            ]
            options: { method: "POST", credentials: "include", retry: 3, timeout: 10000 }
          }
        ]
      }
    )
    @join__type(graph: EXPENSE_TRACKER)
    @join__type(graph: USER_SERVICE) {
    expenseTags(input: CategoryFilter): [Category] @join__field(graph: EXPENSE_TRACKER)
    expenseModes(input: CategoryFilter): [Category] @join__field(graph: EXPENSE_TRACKER)
    expenseFynixes(input: CategoryFilter): [Category] @join__field(graph: EXPENSE_TRACKER)
    expenseTrackerById(session_id: ID!, id: ID!): ExpenseTracker
      @merge(subgraph: "ExpenseTracker", keyField: "id", keyArg: "id")
      @join__field(graph: EXPENSE_TRACKER)
    expenseTrackerByUserIds(session_id: ID!, user_ids: [ID!]!): [ExpenseTracker]! @join__field(graph: EXPENSE_TRACKER)
    paginatedExpenseTrackers(session_id: ID!, input: PaginatedExpenseInputs): ExpenseTrackerConnection! @join__field(graph: EXPENSE_TRACKER)
    userByEmail(input: UserByEmailInput!): UserResponse @join__field(graph: USER_SERVICE)
    userByfield(input: UserByFieldInput!): [UserResponse] @join__field(graph: USER_SERVICE)
    users: [UserResponse] @join__field(graph: USER_SERVICE)
    paginatedUsers(ids: [ID!], input: PaginatedUsersInputs): UsersConnection @join__field(graph: USER_SERVICE)
    adminKvAsset(input: AdminKvAssetInput!): AdminKvAsset @join__field(graph: USER_SERVICE)
  }

  type Mutation @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE) {
    createCategory(input: CreateCategoryInput!): CategoryResponse! @join__field(graph: EXPENSE_TRACKER)
    updateCategory(input: UpdateCategoryInput!): CategoryResponse! @join__field(graph: EXPENSE_TRACKER)
    deleteCategory(input: DeleteCategoryInput!): Boolean! @join__field(graph: EXPENSE_TRACKER)
    createExpenseTracker(input: CreateExpenseTrackerInput!): ExpenseTrackerResponse! @join__field(graph: EXPENSE_TRACKER)
    updateExpenseTracker(input: UpdateExpenseTrackerInput!): ExpenseTrackerResponse! @join__field(graph: EXPENSE_TRACKER)
    deleteExpenseTracker(input: DeleteExpenseTrackerInput!): Boolean! @join__field(graph: EXPENSE_TRACKER)
    signUp(input: SignUpInput!): SignUpResponse! @public @join__field(graph: USER_SERVICE)
    login(input: LoginInput!): LoginResponse! @public @join__field(graph: USER_SERVICE)
    editUser(input: EditUserInput!): EditUserResponse! @join__field(graph: USER_SERVICE)
    deleteUser(input: DeleteUserInput!): Boolean! @join__field(graph: USER_SERVICE)
    changePassword(input: ChangePasswordInput!): Boolean! @join__field(graph: USER_SERVICE)
    logout: LogoutResponse! @join__field(graph: USER_SERVICE)
  }

  type User @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    password: String!
    role: Role!
    phone: String!
    address: String
    city: String
    state: String
    country: String
    zipcode: String
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
  }

  type SignUpResponse @join__type(graph: USER_SERVICE) {
    success: Boolean!
    user: UserSuccessResponse
  }

  type LoginResponse @join__type(graph: USER_SERVICE) {
    success: Boolean!
    token: String
    user: UserSuccessResponse
  }

  type UserSuccessResponse @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: Role!
    address: String
    city: String
    state: String
    country: String
    zipcode: String
  }

  type UserResponse @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    role: Role!
    phone: String!
    address: String
    city: String
    state: String
    country: String
    zipcode: String
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
  }

  type EditUserResponse @join__type(graph: USER_SERVICE) {
    success: Boolean!
    user: UserSuccessResponse
  }

  type LogoutResponse @join__type(graph: USER_SERVICE) {
    success: Boolean!
  }

  type AdminKvAsset @join__type(graph: USER_SERVICE) {
    kv_key: String!
    kv_value: JSON
  }

  type UserEdge @join__type(graph: USER_SERVICE) {
    node: User!
    cursor: String!
  }

  type UsersConnection @join__type(graph: USER_SERVICE) {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }

  enum ExpenseStatus @join__type(graph: EXPENSE_TRACKER) {
    Paid @join__enumValue(graph: EXPENSE_TRACKER)
    UnPaid @join__enumValue(graph: EXPENSE_TRACKER)
    NextDue @join__enumValue(graph: EXPENSE_TRACKER)
  }

  enum Sort @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE) {
    ASC @join__enumValue(graph: EXPENSE_TRACKER) @join__enumValue(graph: USER_SERVICE)
    DESC @join__enumValue(graph: EXPENSE_TRACKER) @join__enumValue(graph: USER_SERVICE)
  }

  enum SORT_BY @join__type(graph: EXPENSE_TRACKER) @join__type(graph: USER_SERVICE) {
    CREATED_AT @join__enumValue(graph: EXPENSE_TRACKER) @join__enumValue(graph: USER_SERVICE)
    UPDATED_AT @join__enumValue(graph: EXPENSE_TRACKER) @join__enumValue(graph: USER_SERVICE)
  }

  enum CategoryType @join__type(graph: EXPENSE_TRACKER) {
    EXPENSE_TAG @join__enumValue(graph: EXPENSE_TRACKER)
    EXPENSE_MODE @join__enumValue(graph: EXPENSE_TRACKER)
    EXPENSE_FYNIX @join__enumValue(graph: EXPENSE_TRACKER)
  }

  enum Role @join__type(graph: USER_SERVICE) {
    ADMIN @join__enumValue(graph: USER_SERVICE)
    USER @join__enumValue(graph: USER_SERVICE)
  }

  enum ColumnName @join__type(graph: USER_SERVICE) {
    id @join__enumValue(graph: USER_SERVICE)
    name @join__enumValue(graph: USER_SERVICE)
    email @join__enumValue(graph: USER_SERVICE)
    phone @join__enumValue(graph: USER_SERVICE)
    role @join__enumValue(graph: USER_SERVICE)
    address @join__enumValue(graph: USER_SERVICE)
    city @join__enumValue(graph: USER_SERVICE)
    state @join__enumValue(graph: USER_SERVICE)
    country @join__enumValue(graph: USER_SERVICE)
    zipcode @join__enumValue(graph: USER_SERVICE)
  }

  input CreateCategoryInput @join__type(graph: EXPENSE_TRACKER) {
    category_type: CategoryType!
    name: String!
  }

  input UpdateCategoryInput @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    category_type: CategoryType!
    name: String!
  }

  input DeleteCategoryInput @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    category_type: CategoryType!
  }

  input CategoryFilter @join__type(graph: EXPENSE_TRACKER) {
    id: ID
    search: String
  }

  input CreateExpenseTrackerInput @join__type(graph: EXPENSE_TRACKER) {
    user_id: ID!
    expense_period: String!
    amount: Float!
    description: String
    item_details: String
    tag_id: ID!
    mode_id: ID!
    fynix_id: ID!
    status: ExpenseStatus!
  }

  input UpdateExpenseTrackerInput @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    user_id: ID!
    expense_period: String!
    amount: Float!
    description: String
    item_details: String
    tag_id: ID!
    mode_id: ID!
    fynix_id: ID!
    status: ExpenseStatus!
  }

  input DeleteExpenseTrackerInput @join__type(graph: EXPENSE_TRACKER) {
    id: ID!
    user_id: ID!
  }

  input PaginatedExpenseInputs @join__type(graph: EXPENSE_TRACKER) {
    user_ids: [ID]
    expense_period: String
    tag_ids: [ID]
    mode_ids: [ID]
    fynix_ids: [ID]
    min_amount: Float
    max_amount: Float
    statuses: [ExpenseStatus]
    first: Int = 10
    after: String
    sort: Sort = DESC
    sort_by: SORT_BY = CREATED_AT
  }

  input SignUpInput @join__type(graph: USER_SERVICE) {
    name: String!
    email: String!
    password: String!
    phone: String!
    role: Role
    address: String
    city: String
    state: String
    country: String
    zipcode: String
  }

  input LoginInput @join__type(graph: USER_SERVICE) {
    email: String!
    password: String!
  }

  input UserByEmailInput @join__type(graph: USER_SERVICE) {
    email: String!
  }

  input UserByFieldInput @join__type(graph: USER_SERVICE) {
    field: ColumnName!
    value: String!
  }

  input DeleteUserInput @join__type(graph: USER_SERVICE) {
    id: ID!
  }

  input EditUserInput @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: Role
    address: String
    city: String
    state: String
    country: String
    zipcode: String
  }

  input ChangePasswordInput @join__type(graph: USER_SERVICE) {
    id: ID!
    current_password: String!
    new_password: String!
    confirm_password: String!
  }

  input AdminKvAssetInput @join__type(graph: USER_SERVICE) {
    kv_key: String!
  }

  input PaginatedUsersInputs @join__type(graph: USER_SERVICE) {
    first: Int = 10
    after: String
    sort: Sort = DESC
    sort_by: SORT_BY = CREATED_AT
  }
`;
