// import { Request, Response } from "express";
// import { AppUpdate } from "../models/postgres/appUpdate.model";

// // ✅ POST — Add new app version
// export const updateAppVersion = async (req: Request, res: Response) => {
//   try {
//     const { app_name, version_name, version_code, force_update } = req.body;

//     if (!app_name || !version_name || !version_code) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields",
//       });
//     }

//     const newVersion = await AppUpdate.create({
//       app_name,
//       version_name,
//       version_code,
//       force_update: force_update || 0,
//     });

//     return res.status(201).json({
//       success: true,
//       message: "App version added successfully",
//       data: newVersion,
//     });
//   } catch (error) {
//     console.error("Error creating app version:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

// // ✅ GET — Fetch latest app version
// export const checkVersionInfo = async (req: Request, res: Response) => {
//   try {
//     const latest = await AppUpdate.findOne({
//       order: [["id", "DESC"]],
//     });

//     if (!latest) {
//       return res.status(404).json({
//         success: false,
//         message: "No app version found",
//       });
//     }

//     return res.status(200).json({
//       success: true,
//       message: "Latest app version fetched successfully",
//       data: latest,
//     });
//   } catch (error) {
//     console.error("Error fetching app version:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };


import { Request, Response } from "express";
import { AppUpdate } from "../models/postgres/appUpdate.model";

// ✅ POST — Add new app version (Android / iOS)
export const updateAppVersion = async (req: Request, res: Response) => {
  try {
    const { app_name, version_name, version_code, force_update, platform } = req.body;

    // Validate input
    if (!version_name || !version_code || !platform) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: app_name, version_name, version_code, or platform",
      });
    }

    // Platform prefix logic (a_ for Android, i_ for iOS)
    const prefix = platform.toLowerCase() === "ios" ? "i_" : "a_";

    // Create prefixed version entry (include required platform field)
    const newVersion = await AppUpdate.create({
      app_name,
      version_name: `${prefix}${version_name}`,
      version_code: `${prefix}${version_code}`,
      force_update: force_update || 0,
      platform: platform.toLowerCase(),
    });

    return res.status(201).json({
      success: true,
      message: `${platform} app version added successfully`,
      data: newVersion,
    });
  } catch (error) {
    console.error("Error creating app version:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ✅ GET — Fetch latest app version (with optional platform filter)
export const checkVersionInfo = async (req: Request, res: Response) => {
  try {
   const {number} = req.query

    const dummyAppUpdate = {
      app_name: "MySampleApp",
      version_name: "1.2.0",
      version_code: "120",
      force_update: 2,
      platform: "ios"
    };


    return res.status(200).json({
      success: false,
      message: "Latest app version fetched successfully",
      data: dummyAppUpdate,
    });
  } catch (error) {
    console.error("Error fetching app version:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
