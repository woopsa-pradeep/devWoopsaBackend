// interfaces/token.interface.ts
export interface IToken {
  id?: number;
  token: string;
  deviceId: number;
  isActive?: boolean;
  retailerId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
