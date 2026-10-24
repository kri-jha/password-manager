import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEncryptedSecretPayload {
  ciphertext: string; // Base64 AES-256-GCM ciphertext
  iv: string;         // Base64 12-byte initialization vector
  authTag: string;    // Base64 16-byte GCM authentication tag
  salt?: string;      // Optional Base64 salt
  version: number;    // Payload format version
}

export interface ICredential extends Document {
  userId: Types.ObjectId;
  categoryId?: Types.ObjectId | null;
  title: string;
  website?: string;
  encryptedSecretPayload: IEncryptedSecretPayload;
  encryptionVersion: number;
  favorite: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EncryptedSecretPayloadSchema = new Schema<IEncryptedSecretPayload>(
  {
    ciphertext: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    salt: { type: String, required: false },
    version: { type: Number, default: 1 }
  },
  { _id: false }
);

const CredentialSchema = new Schema<ICredential>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    website: {
      type: String,
      trim: true,
      default: '',
      maxlength: 255
    },
    encryptedSecretPayload: {
      type: EncryptedSecretPayloadSchema,
      required: true
    },
    encryptionVersion: {
      type: Number,
      default: 1
    },
    favorite: {
      type: Boolean,
      default: false,
      index: true
    },
    lastUsedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      }
    }
  }
);

// Performance Indexes for ownership, category filtering, favorites, and sorting
CredentialSchema.index({ userId: 1, categoryId: 1 });
CredentialSchema.index({ userId: 1, favorite: 1 });
CredentialSchema.index({ userId: 1, updatedAt: -1 });
CredentialSchema.index({ userId: 1, title: 1 });

export const Credential = mongoose.model<ICredential>('Credential', CredentialSchema);
