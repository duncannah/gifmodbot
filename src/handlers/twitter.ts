import { Handler } from ".";

import YTDL, { checkVideo } from "../utils/youtubedl";
import { serverLocation } from "../constants";

export const TwitterHandler = new Handler(
	"Twitter",
	(url) => /^https?:\/\/(?:.+?\.)?twitter\.com(\/|$)/i.test(url),
	async (url) => {
		return await checkVideo(url) ? ["mp4"] : false;
	},
	async (opt) => {
		switch (opt.type) {
			case "mp4":
				const res = await YTDL(opt).catch((err) => console.error(err));
				if (res) return { submission: opt.submission, path: res };
				else throw new Error("Couldn't download");

			default:
				throw new Error("Type not supported");
		}
	}
);
