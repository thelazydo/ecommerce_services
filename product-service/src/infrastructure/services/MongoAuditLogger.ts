import {
    IAuditLogger,
    AuditLogEntry,
} from "@application/interfaces/IAuditLogger";
import { AuditLogModel } from "@infrastructure/persistence/mongoose-models/AuditLogModel";
import { logger } from "@main/config";

export class MongoAuditLogger implements IAuditLogger {
    async log(entry: AuditLogEntry): Promise<void> {
        try {
            const auditLog = new AuditLogModel(entry);
            await auditLog.save();
        } catch (error) {
            logger.error({ err: error }, "Failed to write to AuditLog");
        }
    }
}
