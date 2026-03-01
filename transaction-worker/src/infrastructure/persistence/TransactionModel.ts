import mongoose, { Schema, Document } from "mongoose";

interface ITransactionDocument extends Document {
    customerId: string;
    orderId: string;
    productId: string;
    amount: number;
    status: string;
    createdAt: Date;
}

const TransactionSchema = new Schema<ITransactionDocument>(
    {
        customerId: { type: String, required: true },
        orderId: { type: String, required: true },
        productId: { type: String, required: true },
        amount: { type: Number, required: true },
        status: { type: String, required: true, default: "success" },
    },
    { timestamps: true }
);

export const TransactionModel = mongoose.model<ITransactionDocument>(
    "Transaction",
    TransactionSchema
);
