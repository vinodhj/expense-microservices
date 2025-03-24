import { userByEmail } from "./userByEmail";
import { users } from "./users";
import { userByfield } from "./userByfield";
import { adminKvAsset } from "./admin-kv-asset";
import { paginatedUsers } from "./paginated-users";

export const AuthQuery = {
  users,
  userByEmail,
  userByfield,
  adminKvAsset,
  paginatedUsers,
};
