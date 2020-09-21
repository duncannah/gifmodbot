import fse from "fs-extra";
import path from "path";
import os from "os";

import snoowrap from "snoowrap";
import { SubmissionStream } from "snoostorm";

require("source-map-support").install();
const dotEnvErr = require("dotenv").config({ path: path.join(__dirname, "..", ".env") }).error;
if (dotEnvErr) {
	console.error("[ERROR] .env file is missing or invalid:", dotEnvErr);
	process.exit(1);
}

import { client } from "./api";
import { subreddits, serverLocation } from "./constants";
import { handlers } from "./handlers";
import Webserver from "./webserver";

(async () => {
	await fse.ensureDir(path.join(os.tmpdir(), "gifmodbot"));

	const moderatedSubreddits = await (await client.getModeratedSubreddits()).fetchAll();

	let subsWatchedCount = 0;

	const subsWatched = subreddits.map((subreddit: string) => {
		// check if mod
		if (!moderatedSubreddits.find((s) => s.display_name === subreddit))
			return console.error(`[ERROR] Not a moderator on r/${subreddit}!`);

		subsWatchedCount++;

		const stream = new SubmissionStream(client, { subreddit, limit: 10, pollTime: 10000 });

		stream.on("item", async (submission: snoowrap.Submission) => {
			if (await submission.is_self) return;

			// check if the post is actually recent (because this returns all posts within a month)
			if ((await submission.created_utc) * 1000 + 1000 * 60 * 60 * 24 * 7 < Date.now()) return;

			// check if bot posted before

			if (
				(await submission.comments.fetchAll({ amount: 100, skipReplies: true })).find(
					(c) => c.author.id === client.getMe().id // && c.stickied
				)
			)
				return;

			let downloadableTypes = [];

			let passed = handlers
				.map((handler) => ({ handler, match: handler.match(submission.url) }))
				.filter((h) => h.match);

			const check = await passed[0].handler.check(submission.url).catch(() => []);

			if (passed.length && check) downloadableTypes.push(...check);
			else {
				// report the post
				submission.report({ reason: "Possible non-GIF post" });
				return;
				//console.log("non-GIF post: " + submission.id);
			}

			/*
				Thanks for your submission, [name].

				* Download: [GIF](https://a) [MP4](https://a) [WEBM](https://a)
				* Check for source: [on SauceNAO](https://a) [on IQDB](https://a)

				*I'm a bot, this action was performed automatically.*
			*/

			//

			let response = [`Thanks for your submission, *${submission.author.name}*.`];

			response.push(``);

			if (downloadableTypes.length)
				response.push(
					`* Download: ` +
						downloadableTypes
							.map(
								(t) =>
									`[\[${t.toUpperCase()}\]](${serverLocation}/download/${
										submission.id
									}.${t.toLowerCase()})`
							)
							.join(", ")
				);

			response.push(
				`* Source lookup: [\[SauceNAO\]](${serverLocation}/source/${submission.id}/saucenao), [\[IQDB\]](${serverLocation}/source/${submission.id}/iqdb)`
			);

			response.push(``);

			response.push(`*^(I'm a bot, this action was performed automatically.)*`);

			submission
				.reply(response.join("\n"))
				.then((reply) => reply.fetch())
				.then((reply) => reply.sticky());
		});
	});

	console.log(`[INFO] Watching ${subsWatchedCount} subreddits`);

	// TODO: reply to mentions

	/*
	

	const subsWatched = ["yaoigif", "yurigif"].map((s) => {
		const stream = new SubmissionStream(client, { subreddit: s, limit: 10, pollTime: 5000 });

		stream.on("item", (item: snoowrap.Submission) => {});

		/*
			Example reply:

			Thanks for your submission, [name]! Here's a few possibly useful links.

			Download: [GIF] [MP4]
			Possible source ([]% match): [URL]

			*I'm a bot, this action was performed automatically.*

		

		return stream;
	});
*/
	const webserver = new Webserver(parseInt(process.env.PORT || "", 10) || 3000);

	await webserver.start().catch((err) => console.error(err));
})();
