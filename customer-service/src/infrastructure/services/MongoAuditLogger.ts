import {
    IAuditLogger,
    AuditLogEntry,
} from "@application/interfaces/IAuditLogger";
import { AuditLogModel } from "@infrastructure/persistence/mongoose-models/AuditLogModel";
import type { Logger } from "pino";

export class MongoAuditLogger implements IAuditLogger {
    constructor(private readonly logger: Logger) {}

    async log(entry: AuditLogEntry): Promise<void> {
        try {
            const auditLog = new AuditLogModel(entry);
            await auditLog.save();
        } catch (error) {
            this.logger.error({ err: error }, "Failed to write to AuditLog");
        }
    }
}
