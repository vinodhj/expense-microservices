import { paginatedExpenseTrackers } from "./paginated-trackers";
import { expenseTrackerById } from "./tracker-by-id";
import { expenseTrackerByUserIds } from "./tracker-by-user-ids";

export const ExpenseQuery = {
  expenseTrackerById,
  expenseTrackerByUserIds,
  paginatedExpenseTrackers,
};
