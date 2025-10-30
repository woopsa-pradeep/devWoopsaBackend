// utils/azureUploader.ts
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { config } from "../configuration/config";
import fs from "fs/promises";

// Sanitize names to avoid Azure errors
function sanitizeBlobName(name: string): string {
  return name.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "").replace(/\s+/g, "_");
}

async function folderExists(
  containerClient: ContainerClient,
  folderName: string
): Promise<boolean> {
  const iterator = containerClient.listBlobsFlat({ prefix: `${folderName}/` });
  for await (const blob of iterator) {
    return true;
  }
  return false;
}

export const uploadFileToAzure = async (
  Buffer: Buffer,
  originalFileName: string,
  mimeType: string,
  folderName: string // ⬅️ New parameter
): Promise<{
  success: boolean;
  url?: string;
  fileName?: string;
  error?: string;
}> => {
  try {
    const cleanedFileName = sanitizeBlobName(originalFileName);
    const cleanedFolder = sanitizeBlobName(folderName);
    const blobName = `${cleanedFolder}/${cleanedFileName}`;

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azureConnectionString
    );
    const containerClient = blobServiceClient.getContainerClient(
      config.containerName
    );

    await containerClient.createIfNotExists({ access: "container" });

    const folderAlreadyExists = await folderExists(
      containerClient,
      cleanedFolder
    );
    console.log(
      folderAlreadyExists
        ? `Folder "${cleanedFolder}" already exists.`
        : `Folder "${cleanedFolder}" does not exist. Will be created implicitly.`
    );

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadData(Buffer, {
      blobHTTPHeaders: {
        blobContentType: mimeType,
      },
    });

    return {
      success: true,
      fileName: cleanedFileName,
      url: blockBlobClient.url,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
};
