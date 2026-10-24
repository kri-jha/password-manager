import mongoose, { Schema, Document } from 'mongoose';

export interface IVaultAuthVerifier {
  ciphertext: string;
  iv: string;
  authTag: string;
  version: number;
}

export interface IUser extends Document {
  email: string;
  accountPasswordHash: string;
  vaultSalt: string;
  vaultAuthVerifier?: IVaultAuthVerifier;
  inactivityTimeoutMinutes: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VaultAuthVerifierSchema = new Schema<IVaultAuthVerifier>(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    version: { type: Number, default: 1 }
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    accountPasswordHash: {
      type: String,
      required: true,
      select: false // Excluded by default from queries
    },
    vaultSalt: {
      type: String,
      required: true
    },
    vaultAuthVerifier: {
      type: VaultAuthVerifierSchema,
      required: false
    },
    inactivityTimeoutMinutes: {
      type: Number,
      default: 15
    },
    lastLoginAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).accountPasswordHash;
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
