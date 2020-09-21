import { Handler, req } from ".";

export const GenericHandler = new Handler(
	"Generic",
	(url) => true,
	async (url) => {
		const referrer = ((url) => url.protocol + "//" + url.hostname)(new URL(url));

		let data = await req.head(url, { headers: { referer: referrer } });

		switch (data.headers["content-type"]) {
			case "image/gif":
				return ["gif"];

			case "video/mp4":
				return ["mp4"];

			case "video/webm":
				return ["webm"];

			default:
				return [];
		}
	},
	async (opt) => {
		return { submission: opt.submission, path: opt.submission.url };
	}
);
