import { Document, Model, Schema, Types, model } from "mongoose";

export type UserRole = "admin" | "manager";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: Date;
  invitationTokenHash?: string;
  invitationTokenExpiresAt?: Date;
  invitedByUserId?: Types.ObjectId;
  invitedAt?: Date;
  invitedEmailSentAt?: Date;
  invitationResentAt?: Date;
  passwordChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: { type: String, trim: true },
    avatarPublicId: { type: String, trim: true },
    role: { type: String, enum: ["admin", "manager"], default: "admin" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    invitationTokenHash: { type: String },
    invitationTokenExpiresAt: { type: Date },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    invitedAt: { type: Date },
    invitedEmailSentAt: { type: Date },
    invitationResentAt: { type: Date },
    passwordChangedAt: { type: Date }
  },
  { timestamps: true }
);

userSchema.index({ invitationTokenHash: 1 });

export const User: Model<IUser> = model<IUser>("User", userSchema);
