import { Handler, req } from ".";

export const RedGIFsHandler = new Handler(
	"RedGIFs",
	(url) => /^https?:\/\/(?:www\.)?redgifs\.com\/watch\/\w+|^https?:\/\/gfycat\.com\/\w+/i.test(url),
	async (url) => {
		let data = await req.get(url);
		let supported = [];

		if (/"gifUrl":"([^">]+)"/.test(data.body)) supported.push("gif");
		if (/"mp4Url":"([^">]+)"/.test(data.body)) supported.push("mp4");
		if (/"webmUrl":"([^">]+)"/.test(data.body)) supported.push("webm");

		return supported;
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
