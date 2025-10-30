export interface IProductImage {
    id: number;
    product_number: string;
    img_url: string;
    isAllow: boolean;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }