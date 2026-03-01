import mongoose, { Document, Schema } from "mongoose";

export interface IAuditLogDocument extends Document {
    action: string;
    entityId: string;
    entityType: string;
    actorId: string;
    correlationId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

const auditLogSchema = new Schema<IAuditLogDocument>({
    action: { type: String, required: true },
    entityId: { type: String, required: true },
    entityType: { type: String, required: true },
    actorId: { type: String, required: true },
    correlationId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed },
});

export const AuditLogModel = mongoose.model<IAuditLogDocument>(
    "AuditLog",
    auditLogSchema,
);
