import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  # ADMIN, MODERATOR, USER
  enum Role {
    ADMIN
    USER
  }

  type User {
    id: ID! #nano_id
    name: String!
    email: String!
    password: String! # hashed
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

  input SignUpInput {
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

  type SignUpResponse {
    success: Boolean!
    user: UserSuccessResponse
  }

  input LoginInput {
    email: String!
    password: String!
  }

  type LoginResponse {
    success: Boolean!
    token: String
    user: UserSuccessResponse
  }

  type UserSuccessResponse {
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

  type UserResponse {
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

  input UserByEmailInput {
    email: String!
  }

  input UserByFieldInput {
    field: ColumnName!
    value: String!
  }

  input DeleteUserInput {
    id: ID!
  }

  input EditUserInput {
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

  type EditUserResponse {
    success: Boolean!
    user: UserSuccessResponse
  }

  input ChangePasswordInput {
    id: ID!
    current_password: String!
    new_password: String!
    confirm_password: String!
  }

  enum ColumnName {
    id
    name
    email
    phone
    role
    address
    city
    state
    country
    zipcode
  }

  type LogoutResponse {
    success: Boolean!
  }

  type AdminKvAsset {
    kv_key: String!
    kv_value: JSON
  }

  input AdminKvAssetInput {
    kv_key: String!
  }

  type Query {
    userByEmail(input: UserByEmailInput!): UserResponse
    userByfield(input: UserByFieldInput!): [UserResponse]
    users: [UserResponse]
    adminKvAsset(input: AdminKvAssetInput!): AdminKvAsset
  }

  type Mutation {
    signUp(input: SignUpInput!): SignUpResponse!
    login(input: LoginInput!): LoginResponse!
    editUser(input: EditUserInput!): EditUserResponse!
    deleteUser(input: DeleteUserInput!): Boolean!
    changePassword(input: ChangePasswordInput!): Boolean!
    logout: LogoutResponse!
  }
`;
