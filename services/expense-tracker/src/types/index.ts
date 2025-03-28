import { gql } from "graphql-tag";

export const typeDefs = gql`
  scalar DateTime

  # Expense Status Enum
  enum ExpenseStatus {
    Paid
    UnPaid
    NextDue
  }

  # Sorting and Pagination Enums
  enum Sort {
    ASC
    DESC
  }

  # TODO: use SortBy (PascalCase)
  enum SORT_BY {
    CREATED_AT
    UPDATED_AT
    AMOUNT
  }

  # Enum for different category types
  enum CategoryType {
    EXPENSE_TAG
    EXPENSE_MODE
    EXPENSE_FYNIX
  }

  # Generic category type to represent different category entities - we not using this for now
  type GenericCategoryResponse {
    id: ID!
    name: String!
    category_type: CategoryType!
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
    is_disabled: Boolean!
  }

  type Category {
    id: ID!
    name: String!
    created_at: DateTime!
    updated_at: DateTime!
    created_by: String!
    updated_by: String!
  }

  type CategorySuccessResponse {
    id: ID!
    name: String!
    category_type: CategoryType!
  }

  type CategoryResponse {
    success: Boolean!
    category: CategorySuccessResponse
  }

  # Generic input for creating/updating categories
  input CreateCategoryInput {
    category_type: CategoryType!
    name: String!
  }

  input UpdateCategoryInput {
    id: ID!
    category_type: CategoryType!
    name: String!
  }

  input DeleteCategoryInput {
    id: ID!
    category_type: CategoryType!
  }

  input CategoryFilter {
    id: ID
    search: String # Allow partial name matching
  }

  # Expense Tracker Type
  type ExpenseTracker {
    id: ID!
    user_id: String!
    expense_period: String!
    amount: Float!
    description: String
    item_details: String
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

  type ExpenseTrackerSuccessResponse {
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

  # Edge and Connection Types for Pagination
  type ExpenseTrackerEdge {
    node: ExpenseTracker!
    cursor: String!
  }

  type PageInfo {
    endCursor: String
    hasNextPage: Boolean!
  }

  type ExpenseTrackerConnection {
    edges: [ExpenseTrackerEdge!]!
    pageInfo: PageInfo!
  }

  type ExpenseTrackerResponse {
    success: Boolean!
    expenseTracker: ExpenseTrackerSuccessResponse
  }

  # Input Type for Expense Tracker
  input CreateExpenseTrackerInput {
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

  input UpdateExpenseTrackerInput {
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

  input DeleteExpenseTrackerInput {
    id: ID!
    user_id: ID!
  }

  # Paginated Inputs
  input PaginatedExpenseInputs {
    user_ids: [ID] # User filtering (for admin)
    expense_period: String
    tag_id: [ID]
    mode_id: [ID]
    fynix_id: [ID]

    # Amount range filtering
    min_amount: Float
    max_amount: Float

    # Status filtering
    statuses: [ExpenseStatus]

    # Pagination and sorting
    first: Int = 10
    after: String
    sort: Sort = DESC
    sort_by: SORT_BY = CREATED_AT
  }

  # Query Types
  type Query {
    expenseTags(input: CategoryFilter): [Category]
    expenseModes(input: CategoryFilter): [Category]
    expenseFynixes(input: CategoryFilter): [Category]

    # Expense Tracker Queries
    expenseTrackerById(ids: ID!): ExpenseTracker
    expenseTrackerByUserIds(user_id: [ID!]!): [ExpenseTracker]!
    paginatedExpenseTrackers(session_id: ID, input: PaginatedExpenseInputs): ExpenseTrackerConnection!
  }

  # Mutation Types
  type Mutation {
    # Generic mutation for creating/updating/deleting category
    createCategory(input: CreateCategoryInput!): CategoryResponse!
    updateCategory(input: UpdateCategoryInput!): CategoryResponse!
    deleteCategory(input: DeleteCategoryInput!): Boolean!

    # Expense Tracker Mutations
    createExpenseTracker(input: CreateExpenseTrackerInput!): ExpenseTrackerResponse!
    updateExpenseTracker(input: UpdateExpenseTrackerInput!): ExpenseTrackerResponse!
    deleteExpenseTracker(input: DeleteExpenseTrackerInput!): Boolean!
  }
`;
