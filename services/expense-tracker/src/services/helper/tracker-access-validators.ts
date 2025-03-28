import { GraphQLError } from "graphql";
import { SessionUserType } from "..";
import { Role } from "@src/handlers/graphql";
import { CreateExpenseTrackerInput } from "generated";

export interface TargetIdentifier {
  user_id: string;
}

// Helper function to validate access
export const trackerAccessValidators = ({ sessionUser, target }: { sessionUser: SessionUserType; target: TargetIdentifier }): void => {
  // Admin users have full access
  if (sessionUser.role === Role.Admin) {
    return;
  }

  // Non-admin users can only modify their own records
  if (target.user_id !== sessionUser.id) {
    throw new GraphQLError("Not authorized to perform this action", {
      extensions: { code: "UNAUTHORIZED_ROLE" },
    });
  }
};

// Helper function to validate tracker input
export const trackerInputValidators = (input: CreateExpenseTrackerInput): void => {
  // Validate expense period format
  if (!isValidExpensePeriod(input.expense_period)) {
    throw new GraphQLError("Expense period must be in YYYY-MM format (e.g., 2024-03)", {
      extensions: { code: "INVALID_EXPENSE_PERIOD" },
    });
  }
};

// Helper function to validate expense period format
const isValidExpensePeriod = (period: string): boolean => {
  // Regular expression to match YYYY-MM format
  const expensePeriodRegex = /^\d{4}-\d{2}$/;

  // Check if the period matches the regex
  if (!expensePeriodRegex.test(period)) {
    return false;
  }

  // Additional validation to ensure valid year and month
  const [yearStr, monthStr] = period.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Validate year (assuming reasonable range, e.g., 1900-2100)
  if (year < 1900 || year > 2100) {
    return false;
  }

  // Validate month (1-12)
  if (month < 1 || month > 12) {
    return false;
  }

  return true;
};
