export const supergraphSdl = /* GraphQL */ `
  schema
    @link(url: "https://specs.apollo.dev/link/v1.0")
    @link(url: "https://specs.apollo.dev/join/v0.3", for: EXECUTION)
    @link(
      url: "https://the-guild.dev/graphql/mesh/spec/v1.0"
      import: ["@public", "@transport", "@source", "@extraSchemaDefinitionDirective"]
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
    USER_SERVICE @join__graph(name: "UserService", url: "http://localhost:8501/graphql")
  }

  directive @public on FIELD_DEFINITION

  directive @transport(
    kind: String!
    subgraph: String!
    location: String!
    headers: [[String]]
    options: USER_TransportOptions
  ) repeatable on SCHEMA

  directive @source(
    name: String!
    type: String
    subgraph: String!
  ) repeatable on SCALAR | OBJECT | FIELD_DEFINITION | ARGUMENT_DEFINITION | INTERFACE | UNION | ENUM | ENUM_VALUE | INPUT_OBJECT | INPUT_FIELD_DEFINITION

  directive @extraSchemaDefinitionDirective(directives: _DirectiveExtensions) repeatable on OBJECT

  scalar USER_DateTime @source(name: "DateTime", subgraph: "UserService") @join__type(graph: USER_SERVICE)

  scalar USER_JSON @source(name: "JSON", subgraph: "UserService") @join__type(graph: USER_SERVICE)

  scalar USER_TransportOptions @source(name: "TransportOptions", subgraph: "UserService") @join__type(graph: USER_SERVICE)

  scalar _DirectiveExtensions @join__type(graph: USER_SERVICE)

  type USER_User @source(name: "User", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    password: String!
    role: USER_Role! @source(name: "role", type: "Role!", subgraph: "UserService")
    phone: String!
    address: String
    city: String
    state: String
    country: String
    zipcode: String
    created_at: USER_DateTime! @source(name: "created_at", type: "DateTime!", subgraph: "UserService")
    updated_at: USER_DateTime! @source(name: "updated_at", type: "DateTime!", subgraph: "UserService")
    created_by: String!
    updated_by: String!
  }

  type USER_SignUpResponse @source(name: "SignUpResponse", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    success: Boolean!
    user: USER_UserSuccessResponse @source(name: "user", type: "UserSuccessResponse", subgraph: "UserService")
  }

  type USER_LoginResponse @source(name: "LoginResponse", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    success: Boolean!
    token: String
    user: USER_UserSuccessResponse @source(name: "user", type: "UserSuccessResponse", subgraph: "UserService")
  }

  type USER_UserSuccessResponse @source(name: "UserSuccessResponse", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: USER_Role! @source(name: "role", type: "Role!", subgraph: "UserService")
    address: String
    city: String
    state: String
    country: String
    zipcode: String
  }

  type USER_UserResponse @source(name: "UserResponse", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    role: USER_Role! @source(name: "role", type: "Role!", subgraph: "UserService")
    phone: String!
    address: String
    city: String
    state: String
    country: String
    zipcode: String
    created_at: USER_DateTime! @source(name: "created_at", type: "DateTime!", subgraph: "UserService")
    updated_at: USER_DateTime! @source(name: "updated_at", type: "DateTime!", subgraph: "UserService")
    created_by: String!
    updated_by: String!
  }

  type USER_EditUserResponse @source(name: "EditUserResponse", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    success: Boolean!
    user: USER_UserSuccessResponse @source(name: "user", type: "UserSuccessResponse", subgraph: "UserService")
  }

  type USER_LogoutResponse @source(name: "LogoutResponse", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    success: Boolean!
  }

  type USER_AdminKvAsset @source(name: "AdminKvAsset", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    kv_key: String!
    kv_value: USER_JSON @source(name: "kv_value", type: "JSON", subgraph: "UserService")
  }

  type Query
    @source(name: "Query", subgraph: "UserService")
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
    @join__type(graph: USER_SERVICE) {
    userByEmail(
      input: USER_UserByEmailInput! @source(name: "input", type: "UserByEmailInput!", subgraph: "UserService")
    ): USER_UserResponse @source(name: "userByEmail", type: "UserResponse", subgraph: "UserService")
    userByfield(
      input: USER_UserByFieldInput! @source(name: "input", type: "UserByFieldInput!", subgraph: "UserService")
    ): [USER_UserResponse] @source(name: "userByfield", type: "[UserResponse]", subgraph: "UserService")
    users: [USER_UserResponse] @source(name: "users", type: "[UserResponse]", subgraph: "UserService")
    adminKvAsset(
      input: USER_AdminKvAssetInput! @source(name: "input", type: "AdminKvAssetInput!", subgraph: "UserService")
    ): USER_AdminKvAsset @source(name: "adminKvAsset", type: "AdminKvAsset", subgraph: "UserService")
  }

  type Mutation @source(name: "Mutation", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    signUp(input: USER_SignUpInput! @source(name: "input", type: "SignUpInput!", subgraph: "UserService")): USER_SignUpResponse!
      @source(name: "signUp", type: "SignUpResponse!", subgraph: "UserService")
    login(input: USER_LoginInput! @source(name: "input", type: "LoginInput!", subgraph: "UserService")): USER_LoginResponse!
      @source(name: "login", type: "LoginResponse!", subgraph: "UserService")
    editUser(input: USER_EditUserInput! @source(name: "input", type: "EditUserInput!", subgraph: "UserService")): USER_EditUserResponse!
      @source(name: "editUser", type: "EditUserResponse!", subgraph: "UserService")
    deleteUser(input: USER_DeleteUserInput! @source(name: "input", type: "DeleteUserInput!", subgraph: "UserService")): Boolean!
    changePassword(input: USER_ChangePasswordInput! @source(name: "input", type: "ChangePasswordInput!", subgraph: "UserService")): Boolean!
    logout: USER_LogoutResponse! @source(name: "logout", type: "LogoutResponse!", subgraph: "UserService")
  }

  enum USER_Role @source(name: "Role", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    ADMIN @join__enumValue(graph: USER_SERVICE)
    USER @join__enumValue(graph: USER_SERVICE)
  }

  enum USER_ColumnName @source(name: "ColumnName", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
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

  input USER_SignUpInput @source(name: "SignUpInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    name: String!
    email: String!
    password: String!
    phone: String!
    role: USER_Role @source(name: "role", type: "Role", subgraph: "UserService")
    address: String
    city: String
    state: String
    country: String
    zipcode: String
  }

  input USER_LoginInput @source(name: "LoginInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    email: String!
    password: String!
  }

  input USER_UserByEmailInput @source(name: "UserByEmailInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    email: String!
  }

  input USER_UserByFieldInput @source(name: "UserByFieldInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    field: USER_ColumnName! @source(name: "field", type: "ColumnName!", subgraph: "UserService")
    value: String!
  }

  input USER_DeleteUserInput @source(name: "DeleteUserInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    id: ID!
  }

  input USER_EditUserInput @source(name: "EditUserInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    id: ID!
    name: String!
    email: String!
    phone: String!
    role: USER_Role @source(name: "role", type: "Role", subgraph: "UserService")
    address: String
    city: String
    state: String
    country: String
    zipcode: String
  }

  input USER_ChangePasswordInput @source(name: "ChangePasswordInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    id: ID!
    current_password: String!
    new_password: String!
    confirm_password: String!
  }

  input USER_AdminKvAssetInput @source(name: "AdminKvAssetInput", subgraph: "UserService") @join__type(graph: USER_SERVICE) {
    kv_key: String!
  }
`;
