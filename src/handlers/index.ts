import snoowrap from "snoowrap";
import got from "got";

export interface FetchOpt {
	submission: snoowrap.Submission;
	type: string;
}

export interface FetchResult {
	submission: snoowrap.Submission;
	path: string;
}

export class Handler {
	name: string;
	match: (url: string) => boolean;
	check: (url: string) => Promise<string[] | false>;
	fetch: (opt: FetchOpt) => Promise<FetchResult>;

	constructor(
		name: string,
		match: (url: string) => boolean,
		check: (url: string) => Promise<string[] | false>,
		fetch: (opt: FetchOpt) => Promise<FetchResult>
	) {
		this.name = name;
		this.match = match;
		this.check = check;
		this.fetch = fetch;
	}
}

export const req = got.extend({ timeout: 1000 * 30, http2: true });

import { ImgurHandler } from "./imgur";
import { RedditHandler } from "./reddit";
import { RedGIFsHandler } from "./redgifs";
import { TwitterHandler } from "./twitter";
import { GenericHandler } from "./generic";

// generic should be last, everything else alphabetically ordered
export const handlers = [ImgurHandler, RedditHandler, RedGIFsHandler, TwitterHandler, GenericHandler];
