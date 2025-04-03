import DataLoader from "dataloader";
import { User } from "generates";
import { GraphQLResolveInfo } from "graphql";
import { createUsersLoader } from "./user-by-id-loader";

// Define the context for Hive Gateway
export interface HiveGatewayContext {
  UserService: any;
  ExpenseTracker: any;
  usersLoader?: DataLoader<string, User | null>;
  [key: string]: any;
}

export default {
  ExpenseTracker: {
    user: {
      resolve: async (root: any, _args: {}, context: HiveGatewayContext, info: GraphQLResolveInfo): Promise<User> => {
        const userId = root.user_id;
        if (!userId) {
          console.error(`Missing userId for expense: ${root.user_id || "unknown expense"}`);
          throw new Error(`User not found for expense`);
        }

        // Create loader if it doesn't exist
        if (!context.usersLoader) {
          context.usersLoader = createUsersLoader(context, info);
        }
        try {
          const user = await context.usersLoader.load(userId);
          if (!user) {
            throw new Error(`User not found for userId: ${userId}`);
          }
          return user;
        } catch (error) {
          console.error(`Error loading user ${userId}:`, error);
          throw error;
        }
      },
    },
  },
};
