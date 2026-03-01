export interface AuditLogEntry {
    action: string;
    entityId: string;
    entityType: string;
    actorId: string;
    correlationId: string;
    metadata?: Record<string, any>;
}

export interface IAuditLogger {
    log(entry: AuditLogEntry): Promise<void>;
}
