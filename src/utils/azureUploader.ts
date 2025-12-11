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

/**
 * Delete a file from Azure Blob Storage
 * @param fileUrl - The full URL of the file to delete
 * @returns Promise with success status and optional error message
 */
export const deleteFileFromAzure = async (
  fileUrl: string
): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    if (!fileUrl || typeof fileUrl !== 'string') {
      return {
        success: false,
        error: "Invalid file URL provided",
      };
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      config.azureConnectionString
    );
    const containerClient = blobServiceClient.getContainerClient(
      config.containerName
    );

    // Extract blob name from URL
    // URL format: https://{account}.blob.core.windows.net/{container}/{blobName}
    const urlParts = fileUrl.split('/');
    const containerIndex = urlParts.findIndex(part => part === config.containerName);
    
    if (containerIndex === -1 || containerIndex === urlParts.length - 1) {
      return {
        success: false,
        error: "Could not extract blob name from URL",
      };
    }

    // Get the blob name (everything after container name)
    const blobName = urlParts.slice(containerIndex + 1).join('/');

    if (!blobName) {
      return {
        success: false,
        error: "Invalid blob name extracted from URL",
      };
    }

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    // Check if blob exists before attempting to delete
    const exists = await blockBlobClient.exists();
    if (!exists) {
      console.log(`Blob ${blobName} does not exist in Azure, skipping deletion`);
      return {
        success: true, // Return success even if file doesn't exist (idempotent)
      };
    }

    // Delete the blob
    await blockBlobClient.delete();

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('Error deleting file from Azure:', error);
    return {
      success: false,
      error: error.message || "Unknown error occurred while deleting file",
    };
  }
};