import bcrypt from "bcryptjs";
import crypto from "crypto";
import { FilterQuery, Types } from "mongoose";

import { env } from "../config/env";
import { sendManagerInvitationEmail } from "./mail/mail.service";
import { IUser, User, UserRole } from "../models/user.model";
import { ApiError } from "../utils/api-error";

const INVITATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface InviteUserInput {
  firstName: string;
  lastName: string;
  email: string;
  role: "manager";
  invitedByUserId: string;
}

export interface SetPasswordInput {
  token: string;
  password: string;
}

export interface ListUsersInput {
  page: number;
  limit: number;
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface UpdateUserStatusInput {
  id: string;
  isActive: boolean;
  currentUserId: string;
}

export interface UpdateUserRoleInput {
  id: string;
  role: UserRole;
  currentUserId: string;
}

export interface ResendInvitationInput {
  id: string;
  invitedByUserId: string;
}

export interface SafeUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  invitedByUserId?: Types.ObjectId;
  invitedAt?: Date;
  invitedEmailSentAt?: Date;
  invitationResentAt?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedUsers {
  items: SafeUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface InviteUserResult {
  user: SafeUser;
  setupUrl?: string;
}

export interface ResendInvitationResult {
  setupUrl?: string;
}

const hashInvitationToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createRawInvitationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

const escapeRegex = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const toSafeUser = (user: IUser): SafeUser => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  avatarUrl: user.avatarUrl,
  role: user.role,
  isActive: user.isActive,
  invitedByUserId: user.invitedByUserId,
  invitedAt: user.invitedAt,
  invitedEmailSentAt: user.invitedEmailSentAt,
  invitationResentAt: user.invitationResentAt,
  passwordChangedAt: user.passwordChangedAt,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const inviteUser = async (input: InviteUserInput): Promise<InviteUserResult> => {
  const email = input.email.toLowerCase();
  const existingUser = await User.findOne({ email }).exec();

  if (existingUser) {
    throw new ApiError(409, "A user already exists with this email");
  }

  const rawToken = createRawInvitationToken();
  const invitationTokenHash = hashInvitationToken(rawToken);
  const temporaryPasswordHash = await bcrypt.hash(createRawInvitationToken(), 12);
  const invitationTokenExpiresAt = new Date(Date.now() + INVITATION_TOKEN_TTL_MS);
  const setupUrl = `${env.frontendUrl}/purement-console/set-password?token=${rawToken}`;

  const user = await User.create({
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    role: input.role,
    isActive: false,
    passwordHash: temporaryPasswordHash,
    invitationTokenHash,
    invitationTokenExpiresAt,
    invitedByUserId: new Types.ObjectId(input.invitedByUserId),
    invitedAt: new Date()
  });

  try {
    const invitedByUser = await User.findById(new Types.ObjectId(input.invitedByUserId)).exec();
    const invitedByName = invitedByUser
      ? `${invitedByUser.firstName} ${invitedByUser.lastName}`.trim()
      : undefined;

    await sendManagerInvitationEmail(
      {
        toEmail: user.email,
        toName: `${user.firstName} ${user.lastName}`.trim(),
        setupUrl,
        invitedByName
      },
      { action: "invite" }
    );

    user.invitedEmailSentAt = new Date();
    await user.save();
  } catch (error) {
    console.error("Manager invitation email failed", {
      userId: user.id,
      email: user.email,
      error: error instanceof Error ? error.message : error
    });

    throw new ApiError(500, "Invitation created but email could not be sent");
  }

  return {
    user: toSafeUser(user),
    ...(env.nodeEnv === "development" && {
      setupUrl
    })
  };
};

const sendInvitationEmailForUser = async (
  user: IUser,
  rawToken: string,
  invitedByUserId: string
): Promise<string> => {
  const setupUrl = `${env.frontendUrl}/purement-console/set-password?token=${rawToken}`;
  const invitedByUser = await User.findById(new Types.ObjectId(invitedByUserId)).exec();
  const invitedByName = invitedByUser
    ? `${invitedByUser.firstName} ${invitedByUser.lastName}`.trim()
    : undefined;

  await sendManagerInvitationEmail(
    {
      toEmail: user.email,
      toName: `${user.firstName} ${user.lastName}`.trim(),
      setupUrl,
      invitedByName
    },
    { action: "resend" }
  );

  return setupUrl;
};

export const resendInvitation = async (
  input: ResendInvitationInput
): Promise<ResendInvitationResult> => {
  const user = await User.findById(new Types.ObjectId(input.id)).exec();

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.isActive) {
    throw new ApiError(400, "User is already active");
  }

  const rawToken = createRawInvitationToken();
  user.invitationTokenHash = hashInvitationToken(rawToken);
  user.invitationTokenExpiresAt = new Date(Date.now() + INVITATION_TOKEN_TTL_MS);
  user.invitationResentAt = new Date();
  await user.save();

  let setupUrl: string;

  try {
    setupUrl = await sendInvitationEmailForUser(user, rawToken, input.invitedByUserId);
  } catch (error) {
    console.error("Manager invitation resend email failed", {
      userId: user.id,
      email: user.email,
      error: error instanceof Error ? error.message : error
    });

    throw new ApiError(500, "Invitation email could not be resent");
  }

  user.invitedEmailSentAt = new Date();
  await user.save();

  return {
    ...(env.nodeEnv === "development" && {
      setupUrl
    })
  };
};

export const setInvitedUserPassword = async (input: SetPasswordInput): Promise<SafeUser> => {
  const invitationTokenHash = hashInvitationToken(input.token);
  const user = await User.findOne({
    invitationTokenHash,
    invitationTokenExpiresAt: { $gt: new Date() }
  }).exec();

  if (!user) {
    throw new ApiError(400, "Invitation token is invalid or expired");
  }

  user.passwordHash = await bcrypt.hash(input.password, 12);
  user.isActive = true;
  user.invitationTokenHash = undefined;
  user.invitationTokenExpiresAt = undefined;
  user.passwordChangedAt = new Date();

  await user.save();

  return toSafeUser(user);
};

export const listUsers = async (input: ListUsersInput): Promise<PaginatedUsers> => {
  const { page, limit, role, isActive, search } = input;
  const filter: FilterQuery<IUser> = {};

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive;
  }

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search), "i");

    filter.$or = [
      { firstName: searchRegex },
      { lastName: searchRegex },
      { email: searchRegex }
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    User.countDocuments(filter).exec()
  ]);

  return {
    items: users.map(toSafeUser),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

export const getUserById = async (id: string): Promise<SafeUser | null> => {
  const user = await User.findById(new Types.ObjectId(id)).exec();

  return user ? toSafeUser(user) : null;
};

const assertCanRemoveActiveAdmin = async (user: IUser): Promise<void> => {
  if (user.role !== "admin" || !user.isActive) {
    return;
  }

  const activeAdminCount = await User.countDocuments({
    role: "admin",
    isActive: true
  }).exec();

  if (activeAdminCount <= 1) {
    throw new ApiError(400, "You cannot remove the last active admin");
  }
};

export const updateUserStatus = async (
  input: UpdateUserStatusInput
): Promise<SafeUser | null> => {
  if (input.id === input.currentUserId && !input.isActive) {
    throw new ApiError(400, "You cannot deactivate your own user account");
  }

  const user = await User.findById(new Types.ObjectId(input.id)).exec();

  if (!user) {
    return null;
  }

  if (!input.isActive) {
    await assertCanRemoveActiveAdmin(user);
  }

  user.isActive = input.isActive;
  await user.save();

  return toSafeUser(user);
};

export const updateUserRole = async (input: UpdateUserRoleInput): Promise<SafeUser | null> => {
  if (input.id === input.currentUserId && input.role !== "admin") {
    throw new ApiError(400, "You cannot demote your own user account");
  }

  const user = await User.findById(new Types.ObjectId(input.id)).exec();

  if (!user) {
    return null;
  }

  if (user.role === "admin" && input.role !== "admin") {
    await assertCanRemoveActiveAdmin(user);
  }

  user.role = input.role;
  await user.save();

  return toSafeUser(user);
};
