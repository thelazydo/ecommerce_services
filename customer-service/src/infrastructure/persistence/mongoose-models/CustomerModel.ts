import mongoose, { Document, Schema } from "mongoose";
import {
    encryptDeterministic,
    decryptDeterministic,
    encryptGCM,
    decryptGCM,
} from "@infrastructure/services/crypto";

export interface ICustomerDocument extends Document {
    name: string;
    email: string;
}

const customerSchema = new Schema<ICustomerDocument>(
    {
        name: {
            type: String,
            required: true,
            set: encryptGCM,
            get: decryptGCM,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            set: encryptDeterministic,
            get: decryptDeterministic,
        },
    },
    {
        toJSON: { getters: true },
        toObject: { getters: true },
    },
);

export const CustomerModel = mongoose.model<ICustomerDocument>(
    "Customer",
    customerSchema,
);
