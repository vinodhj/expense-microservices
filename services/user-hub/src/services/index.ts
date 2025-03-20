import { AuthDataSource } from "@src/datasources/auth";
import { AuthServiceAPI } from "./auth-service";
import { UserDataSource } from "@src/datasources/user";
import { UserServiceAPI } from "./user-service";
import { DrizzleD1Database } from "drizzle-orm/d1";
import { KvStorageServiceAPI } from "./kv-storage-service";
import { KvStorageDataSource } from "@src/datasources/kv-storage";
import { Role } from "db/schema/user";
import { Redis } from "@upstash/redis";

export type SessionUserType = {
  id: string;
  role: Role;
  email: string;
  name: string;
} | null;

interface APIParams {
  db: DrizzleD1Database;
  env: Env;
  sessionUser: SessionUserType;
  redis: Redis;
}

export interface APIs {
  authAPI: AuthServiceAPI;
  userAPI: UserServiceAPI;
  kvStorageAPI: KvStorageServiceAPI;
}

/**
 * Factory function to create API/service instances.
 */
// TODO: Need to use redis in data sources
export const createAPIs = ({ db, env, sessionUser, redis }: APIParams): APIs => {
  // KV Storage Service API
  const kvStorageDataSource = new KvStorageDataSource(env.KV_CF_JWT_AUTH, env.EXPENSE_AUTH_EVENTS_KV);
  const kvStorageAPI = new KvStorageServiceAPI(kvStorageDataSource);

  // Auth Service API
  const authDataSource = new AuthDataSource({ db, kvStorageDataSource, sessionUser });
  const authAPI = new AuthServiceAPI({ authDataSource, jwtSecret: env.JWT_SECRET, sessionUser });

  // User Service API
  const userDataSource = new UserDataSource({ db, sessionUser });
  const userAPI = new UserServiceAPI({ userDataSource, sessionUser });

  return { authAPI, userAPI, kvStorageAPI };
};
