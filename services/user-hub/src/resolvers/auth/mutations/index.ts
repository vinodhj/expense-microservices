import { signUp } from "./signup";
import { login } from "./login";
import { deleteUser } from "./delete-user";
import { editUser } from "./edit-user";
import { changePassword } from "./change-password";
import { logout } from "./logout";

export const AuthMutation = {
  signUp,
  login,
  deleteUser,
  editUser,
  changePassword,
  logout,
};
