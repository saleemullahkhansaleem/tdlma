export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: string;
  title: string;
  message: string;
}

export interface UpdateNotificationDto {
  read?: boolean;
}



