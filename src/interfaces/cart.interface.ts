export interface CartItem {
  id: number;
  Customer_Number: number;
  Item_Number: number;
  Price: number;
  Qty: number;
  TotalPrice: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AddToCartRequest {
  Item_Number: number;
  Price: number;
  Qty: number;
  TotalPrice: number;
  Tax_Rate: number;
  Price_With_Tax: number;
  TotalPriceWithTax: number;
  discount?: number;
  originalPrice?: number;
}

export interface UpdateCartItemRequest {
  Qty?: number;
  Price?: number;
  TotalPrice?: number;
  discount?: number;
}

export interface PlaceOrderRequest {
  Customer_Number: number;
  Item_Number: number;
  Price: number;
  Qty: number;
  TotalPrice: number;
  discountPrice?: number;
  Tax_Rate: number;
  Price_With_Tax: number;
  TotalPriceWithTax: number;
  id: number;
}

export type PlaceOrderRequestArray = PlaceOrderRequest[];

export interface PlaceOrder {
  orderPlayload: PlaceOrderRequest[];
  Delivery_Charge: number;
  shippingDetails: any;
  hasDiscount: boolean;
  discountAmount: number;
}


export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  itemCount: number;
}

export interface CartResponse {
  message: string;
  affectedRows?: number;
} 