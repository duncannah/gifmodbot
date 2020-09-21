import { Handler, req } from ".";

export const ImgurHandler = new Handler(
	"Imgur",
	(url) => /^https?:\/\/(?:.+?\.)?imgur\.com/i.test(url),
	async (url) => {
		let id = url.match(/^https?:\/\/(?:i\.)?imgur\.com\/(?:a\/)?(\w+)(?:\.\w+)?(?:[\?#].*)?$/i);

		if (!id) return false;

		let gifData = await req.head(`https://i.imgur.com/${id[1]}.gif`).catch(null);
		let mp4Data = await req.head(`https://i.imgur.com/${id[1]}.mp4`).catch(null);

		let supported = [];

		if (gifData && gifData.headers["content-type"] === "image/gif") supported.push("gif");
		if (mp4Data && mp4Data.headers["content-type"] === "video/mp4") supported.push("mp4");

		return supported.length ? supported : false;
	},
	async (opt) => {
		let data = await req.get(opt.submission.url);
		let match;

		switch (opt.type) {
			case "gif":
				match = data.body.match(/"gifUrl":"([^">]+)"/);
				break;

			case "mp4":
				match = data.body.match(/"mp4Url":"([^">]+)"/);
				break;

			case "webm":
				match = data.body.match(/"webmUrl":"([^">]+)"/);
				break;
		}

		if (match && match.length >= 2)
			return { submission: opt.submission, path: decodeURIComponent(JSON.parse('"' + match[1] + '"')) };
		else throw new Error("Couldn't download");
	}
);
