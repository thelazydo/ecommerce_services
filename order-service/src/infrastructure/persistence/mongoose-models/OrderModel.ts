import mongoose, { Document, Schema } from "mongoose";

export interface IOrderDocument extends Document {
    customerId: string;
    productId: string;
    amount: number;
    orderStatus: "pending" | "failed";
}

const orderSchema = new Schema<IOrderDocument>({
    customerId: { type: String, required: true },
    productId: { type: String, required: true },
    amount: { type: Number, required: true },
    orderStatus: {
        type: String,
        enum: ["pending", "failed"],
        default: "pending",
    },
});

export const OrderModel = mongoose.model<IOrderDocument>("Order", orderSchema);
