import { createExpenseTracker } from "./create";
import { deleteExpenseTracker } from "./delete";
import { updateExpenseTracker } from "./update";

export const ExpenseMutation = {
  createExpenseTracker,
  updateExpenseTracker,
  deleteExpenseTracker,
};
