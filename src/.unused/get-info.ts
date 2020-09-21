import got from "got";

interface SiteFuncResponse {
	artistTags: string[];
	characterTags: string[];
	source: string;
}

const sites: {
	[site: string]: [RegExp, (id: string) => Promise<SiteFuncResponse>];
} = {
	danbooru: [
		/^https:\/\/danbooru\.donmai\.us\/posts\/(\d+)$/,
		(id) => {
			return got
				.get("https://danbooru.donmai.us/posts/" + id + ".json")
				.json()
				.then((data) => {
					interface DanbooruResponse {
						tag_string_artist?: string;
						tag_string_character?: string;
						source?: string;
					}

					const isDanbooruResponse = (object: unknown): object is DanbooruResponse =>
						typeof data === "object" && data !== null;

					if (!isDanbooruResponse(data)) throw new Error("Failed to get info");
					else
						return {
							artistTags: (typeof data["tag_string_artist"] === "string"
								? data["tag_string_artist"]
								: ""
							).split(" "),
							characterTags: (typeof data["tag_string_character"] === "string"
								? data["tag_string_character"]
								: ""
							).split(" "),
							source: typeof data["source"] === "string" ? data["source"] : "",
						};
				});
		},
	],
};

export default () => {};
