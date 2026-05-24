import bcrypt from "bcryptjs";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

import { env } from "../config/env";
import { IUser, User } from "../models/user.model";
import { ApiError } from "../utils/api-error";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: IUser["role"];
}

export interface AuthTokenPayload extends JwtPayload {
  sub: string;
  role: IUser["role"];
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface UpdateCurrentUserAvatarInput {
  userId: string;
  avatarUrl: string;
  avatarPublicId?: string;
}

const invalidCredentialsError = new ApiError(401, "Courriel ou mot de passe invalide.");

export const toAuthUser = (user: IUser): AuthUser => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  role: user.role
});

export const signAuthToken = (user: IUser): string => {
  const payload: AuthTokenPayload = {
    sub: user.id,
    role: user.role
  };
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"]
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

export const login = async (input: LoginInput): Promise<LoginResult> => {
  const user = await User.findOne({ email: input.email }).exec();

  if (!user) {
    throw invalidCredentialsError;
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw invalidCredentialsError;
  }

  if (!user.isActive) {
    throw new ApiError(403, "Votre compte a été désactivé par un administrateur.");
  }

  user.lastLoginAt = new Date();
  await user.save();

  return {
    token: signAuthToken(user),
    user: toAuthUser(user)
  };
};

export const updateCurrentUserAvatar = async (
  input: UpdateCurrentUserAvatarInput
): Promise<AuthUser> => {
  const user = await User.findByIdAndUpdate(
    input.userId,
    {
      avatarUrl: input.avatarUrl,
      avatarPublicId: input.avatarPublicId
    },
    { new: true, runValidators: true }
  ).exec();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return toAuthUser(user);
};
