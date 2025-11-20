import { Users } from "../models/mmsql/user.model";

export async function getNextUserNumber() {
  const maxUserNumber = await Users.max('UserNumber');
  return (maxUserNumber as number) + 1;
}

export const getDefaultErpUserValues = () => {

  return {
   
    UserGroup: 0,
    UserIsPicker: 0,
    UserIsChecker: 0,
    UserIsAdmin: 0,
    UserIsEpickAdmin: 0,

  };
};
