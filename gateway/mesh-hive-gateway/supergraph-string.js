export const supergraphSdl = /* GraphQL */ `
  schema
    @link(url: "https://specs.apollo.dev/link/v1.0")
    @link(url: "https://specs.apollo.dev/join/v0.3", for: EXECUTION)
    @link(url: "https://the-guild.dev/graphql/mesh/spec/v1.0", import: ["@transport", "@extraSchemaDefinitionDirective"]) {
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
    USER_SERVICE @join__graph(name: "UserService", url: "http://localhost:8501/graphql")
  }

  directive @transport(
    kind: String!
    subgraph: String!
    location: String!
    headers: [[String]]
    options: TransportOptions
  ) repeatable on SCHEMA

  directive @extraSchemaDefinitionDirective(directives: _DirectiveExtensions) repeatable on OBJECT

  scalar DateTime @join__type(graph: USER_SERVICE)

  scalar JSON @join__type(graph: USER_SERVICE)

  scalar TransportOptions @join__type(graph: USER_SERVICE)

  scalar _DirectiveExtensions @join__type(graph: USER_SERVICE)

  type User @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    password: String!
    role: Role!
    created_at: DateTime!
    updated_at: DateTime!
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
    role: Role!
  }

  type UserResponse @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    role: Role!
    created_at: DateTime!
    updated_at: DateTime!
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

  type Query
    @extraSchemaDefinitionDirective(
      directives: {
        transport: [
          {
            kind: "http"
            subgraph: "UserService"
            location: "http://localhost:8501/graphql"
            headers: [["Authorization", "{context.headers.Authorization}"], ["X-Project-Token", "{context.headers.X-Project-Token}"]]
            options: { method: "POST", credentials: "include", retry: 3, timeout: 10000 }
          }
        ]
      }
    )
    @join__type(graph: USER_SERVICE) {
    userByEmail(input: UserByEmailInput!): UserResponse
    userByfield(input: UserByFieldInput!): [UserResponse]
    users: [UserResponse]
    adminKvAsset(input: AdminKvAssetInput!): AdminKvAsset
  }

  type Mutation @join__type(graph: USER_SERVICE) {
    signUp(input: SignUpInput!): SignUpResponse!
    login(input: LoginInput!): LoginResponse!
    editUser(input: EditUserInput!): EditUserResponse!
    deleteUser(input: DeleteUserInput!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    logout: LogoutResponse!
  }

  enum Role @join__type(graph: USER_SERVICE) {
    ADMIN @join__enumValue(graph: USER_SERVICE)
    USER @join__enumValue(graph: USER_SERVICE)
  }

  enum ColumnName @join__type(graph: USER_SERVICE) {
    id @join__enumValue(graph: USER_SERVICE)
    name @join__enumValue(graph: USER_SERVICE)
    email @join__enumValue(graph: USER_SERVICE)
    role @join__enumValue(graph: USER_SERVICE)
  }

  input SignUpInput @join__type(graph: USER_SERVICE) {
    name: String!
    email: String!
    password: String!
    role: Role
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
    role: Role
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
`;
