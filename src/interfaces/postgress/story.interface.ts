export interface IStory {
    id: number;
    mediaUrl: string;
    mediaType: 'image' | 'video';
    caption?: string;
    expiresAt: Date;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }
  