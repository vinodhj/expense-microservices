import { AuthDataSource } from "@src/datasources/auth";
import { ChangePasswordInput, LoginInput, SignUpInput } from "generated";
import { validateEmailAndPassword } from "@src/services/helper/authValidators";
import { generateToken, TokenPayload } from "@src/services/helper/jwtUtils";
import { validateUserAccess } from "@src/services/helper/userAccessValidators";
import { changePasswordValidators } from "@src/services/helper/changePasswordValidators";
import { GraphQLError } from "graphql";
import jwt from "jsonwebtoken";
import { SessionUserType } from ".";

export class AuthServiceAPI {
  private readonly authDataSource: AuthDataSource;
  private readonly jwtSecret: string;
  private readonly sessionUser: SessionUserType;

  constructor({
    authDataSource,
    jwtSecret,
    sessionUser,
  }: {
    authDataSource: AuthDataSource;
    jwtSecret: string;
    sessionUser?: SessionUserType;
  }) {
    this.authDataSource = authDataSource;
    this.jwtSecret = jwtSecret;
    this.sessionUser = sessionUser ?? null;
  }

  async signUp(input: SignUpInput) {
    validateEmailAndPassword(input.email, input.password);
    return await this.authDataSource.signUp(input);
  }

  async login(input: LoginInput) {
    validateEmailAndPassword(input.email, input.password);

    const result = await this.authDataSource.login(input);

    const tokenPayload: TokenPayload = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      tokenVersion: result.token_version,
    };

    const token = generateToken(tokenPayload, this.jwtSecret, "1d");
    return {
      token,
      ...result,
    };
  }

  async changePassword(input: ChangePasswordInput, accessToken: string | null) {
    // Validate user access and inputs
    validateUserAccess(accessToken, this.sessionUser, { id: input.id });
    changePasswordValidators(input.current_password, input.new_password, input.confirm_password);

    const result = await this.authDataSource.changePassword(input);
    return result ?? false;
  }

  async logout(accessToken: string | null): Promise<{ success: boolean }> {
    if (!accessToken) {
      throw new GraphQLError("Not authenticated", {
        extensions: { code: "TOKEN_NOT_FOUND" },
      });
    }

    let payload: TokenPayload;
    try {
      payload = jwt.verify(accessToken, this.jwtSecret) as TokenPayload;
    } catch (error) {
      throw new GraphQLError("Invalid token", {
        extensions: { code: "INVALID_TOKEN" },
      });
    }

    // Here we use the KV storage API from the auth data source to increment the token version,
    // thereby invalidating all tokens issued before this logout.
    await this.authDataSource.incrementTokenVersion(payload.email);

    return { success: true };
  }
}
