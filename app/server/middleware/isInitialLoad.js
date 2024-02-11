import { RequestedTokenType } from "@shopify/shopify-api";
import StoreModel from "../../utils/models/StoreModel.js";
import sessionHandler from "../../utils/sessionHandler.js";
import shopify from "../../utils/shopify.js";
import freshInstall from "../../utils/freshInstall.js";

const isShopActive = async (req, res, next) => {
  try {
    const shop = req.query.shop;
    const idToken = req.query.id_token;

    if (shop && idToken) {
      const { session: offlineSession } = await shopify.auth.tokenExchange({
        sessionToken: idToken,
        shop,
        requestedTokenType: RequestedTokenType.OfflineAccessToken,
      });
      const { session: onlineSession } = await shopify.auth.tokenExchange({
        sessionToken: idToken,
        shop,
        requestedTokenType: RequestedTokenType.OnlineAccessToken,
      });

      sessionHandler.storeSession(offlineSession);
      sessionHandler.storeSession(onlineSession);

      const webhookRegistrar = await shopify.webhooks.register({
        sessoin: offlineSession,
      });

      const isFreshInstall = await StoreModel.findOne({
        shop: onlineSession.shop,
      });

      if (!isFreshInstall || isFreshInstall?.isActive === false) {
        // !isFreshInstall -> New Install
        // isFreshInstall?.isActive === false -> Reinstall
        await freshInstall({ shop: onlineSession.shop });
      }

      console.dir(webhookRegistrar, { depth: null });
    }
    next();
  } catch (e) {
    console.log(`---> An error occured in isInitialLoad:, ${e.message}`, e);
    return res.status(403).send({ error: true });
  }
};

export default isShopActive;
