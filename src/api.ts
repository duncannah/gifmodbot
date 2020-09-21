import fs from "fs";
import path from "path";

import snoowrap from "snoowrap";

import { botName, botVersion, botCreator } from "./constants";

export const client = new snoowrap({
	userAgent: `${botName}:${botVersion} (by /u/${botCreator})`,
	clientId: process.env.CLIENT_ID,
	clientSecret: process.env.CLIENT_SECRET,
	username: process.env.REDDIT_USER,
	password: process.env.REDDIT_PASS,
});
