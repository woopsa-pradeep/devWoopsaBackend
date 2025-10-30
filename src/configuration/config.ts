import dotenv from "dotenv";
dotenv.config();


export const config = {
  azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  hostURL: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  masterImageUrl:process.env.AZURE_STORAGE_CONNECTION_STRING || "",
  productFolder:"product_image",
  containerName: "product-images"
};
