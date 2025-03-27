import { DrizzleD1Database } from "drizzle-orm/d1";
import { Role } from "@src/handlers/graphql";
import { CategoryDataSource } from "@src/datasources/category-datasources";
import { ExpenseDataSource } from "@src/datasources/expense-datasources";
import { ExpenseServiceAPI } from "./expense-service";
import { CategoryServiceAPI } from "./category-service";

export type SessionUserType = {
  id: string;
  role: Role;
  email: string;
  name: string;
};

interface APIParams {
  db: DrizzleD1Database;
  env: Env;
  sessionUser: SessionUserType;
}

export interface APIs {
  expenseAPI: ExpenseServiceAPI;
  categoryAPI: CategoryServiceAPI;
}

/**
 * Factory function to create API/service instances.
 */
export const createAPIs = ({ db, env, sessionUser }: APIParams): APIs => {
  // Expense Service API
  const expenseDataSource = new ExpenseDataSource({ db, sessionUser });
  const expenseAPI = new ExpenseServiceAPI({ expenseDataSource, sessionUser });

  // Category Service API
  const categoryDataSource = new CategoryDataSource({ db, sessionUser });
  const categoryAPI = new CategoryServiceAPI({ categoryDataSource, sessionUser });

  return { expenseAPI, categoryAPI };
};
