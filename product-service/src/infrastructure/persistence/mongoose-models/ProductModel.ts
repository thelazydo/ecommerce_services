import mongoose, { Document, Schema } from "mongoose";

export interface IProductDocument extends Document {
    name: string;
    price: number;
    description?: string;
}

const productSchema = new Schema<IProductDocument>({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
});

export const ProductModel = mongoose.model<IProductDocument>(
    "Product",
    productSchema,
);
