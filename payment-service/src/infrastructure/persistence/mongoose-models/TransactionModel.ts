import mongoose, { Document, Schema } from "mongoose";

export interface ITransactionDocument extends Document {
    customerId: string;
    orderId: string;
    productId: string;
    amount: number;
    status: string;
    createdAt: Date;
}

const transactionSchema = new Schema<ITransactionDocument>({
    customerId: { type: String, required: true },
    orderId: { type: String, required: true },
    productId: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "success" },
    createdAt: { type: Date, default: Date.now },
});

export const TransactionModel = mongoose.model<ITransactionDocument>(
    "Transaction",
    transactionSchema,
);
