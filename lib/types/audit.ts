export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: Record<string, any> | null;
  createdAt: Date;
}

export interface CreateAuditLogDto {
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}



