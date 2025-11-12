// export interface IAppUpdate {
// //   id?: number;
//   app_name: string;          // App name (e.g., "MyApp")
//   version_name: string;     // Version name (e.g., "Lollipop")
//   version_code: number;     // Version code (e.g., 0.01)
//   force_update: 0 | 1 | 2;  //Normal, 1=Popup, 2=Must Update → handled as boolean flag

//   created_at?: Date;
//   updated_at?: Date;
// }


export interface IAppUpdate {
  app_name: string;              // App name (e.g., "MyApp")
  version_name: string;          // Version name (will be prefixed as a_ / i_)
  version_code: number | string; // Version code (will be prefixed as a_ / i_)
  force_update: 0 | 1 | 2;       // 0=Normal, 1=Popup, 2=Must Update
  platform: "android" | "ios";   // Platform type for prefix
  created_at?: Date;
  updated_at?: Date;
}
