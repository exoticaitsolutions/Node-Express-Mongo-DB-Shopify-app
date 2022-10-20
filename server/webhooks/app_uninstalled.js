import SessionModel from "../../utils/models/SessionModel";
import StoreModel from "../../utils/models/StoreModel";

const appUninstallHandler = async (topic, shop, webhookRequestBody) => {
  await StoreModel.findOneAndUpdate({ shop }, { isActive: false });
  await SessionModel.deleteMany({ shop });
};

export default appUninstallHandler;
