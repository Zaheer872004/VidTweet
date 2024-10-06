import { Router } from "express";
import { verifyJWT } from "../middleware/getUser.middleware.js"
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";


const router = Router();

router.route("/channel-subscribes/:channelId").get(verifyJWT,toggleSubscription)

router.route("/get-subscriber-list/:channelId").get(verifyJWT,getUserChannelSubscribers)

router.route("/get-channel-list/:subscriberId").get(verifyJWT, getSubscribedChannels)




export default router;