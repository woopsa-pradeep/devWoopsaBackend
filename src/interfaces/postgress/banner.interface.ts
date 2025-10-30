export interface BannerAttributes {
    id: number;
    isActive: boolean;
    status: boolean;
    bannerTitle: string;
    image_url: string;
    bannerDescription: string;
    inventors: object[]; // or string[] if storing IDs
    startDate: Date;
    endDate: Date;
    hasForWeb: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }