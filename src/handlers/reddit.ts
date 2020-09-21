import { Handler } from ".";

import YTDL from "../utils/youtubedl";

export const RedditHandler = new Handler(
	"Reddit",
	(url) => /^https?:\/\/[iv]\.redd\.it\//i.test(url),
	async (url) => {
		let supported = [];

		if (url.match(/\.gif$/)) supported.push("gif");

		supported.push("mp4");

		return supported;
	},
	async (opt) => {
		switch (opt.type) {
			case "gif":
				if (opt.submission.url.match(/\.gif$/)) return { submission: opt.submission, path: opt.submission.url };
				else throw new Error("Type not supported"); //return `https://ezgif.com/video-to-gif?url=${serverLocation}/${opt.postID}.mp4`;

			case "mp4":
				const res = await YTDL(opt).catch((err) => console.error(err));
				if (res) return { submission: opt.submission, path: res };
				else throw new Error("Couldn't download");

			default:
				throw new Error("Type not supported");
		}
	}
);
