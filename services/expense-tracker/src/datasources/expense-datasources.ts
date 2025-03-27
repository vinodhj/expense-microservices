import { DrizzleD1Database } from "drizzle-orm/d1";
import { SessionUserType } from "@src/services";

export class ExpenseDataSource {
  private readonly db: DrizzleD1Database;
  private readonly sessionUser: SessionUserType;

  // Constants for pagination and batching
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MAX_PAGE_SIZE = 100; // Set maximum page size
  private readonly BATCH_SIZE = 50; // Maximum number of IDs to fetch in a single batch

  constructor({ db, sessionUser }: { db: DrizzleD1Database; sessionUser: SessionUserType }) {
    this.db = db;
    this.sessionUser = sessionUser;
  }
}
