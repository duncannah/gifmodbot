import stream from "stream";
import { promisify } from "util";
import fse from "fs-extra";
import path from "path";
import os from "os";

import got from "got";
import snoowrap from "snoowrap";
import express from "express";
import { spawn } from "promisify-child-process";

import { JobCollection } from "../utils/job";

import errorPage from "./error";

import { client } from "../api";

import { handlers, Handler } from "../handlers";

import { subreddits, serverLocation } from "../constants";

const router = express.Router();
const pipeline = promisify(stream.pipeline);

const jobs = new JobCollection<string>();

const sauceServices: { [s: string]: (u: string) => string } = {
	saucenao: (u: string) => `https://saucenao.com/search.php?url=${u}`,
	iqdb: (u: string) => `https://www.iqdb.org/?service%5B%5D=1&service%5B%5D=4&service%5B%5D=5&file=&url=${u}`,
};

const download = (handler: Handler, submission: snoowrap.Submission, type: string): Promise<string> =>
	handler.fetch({ submission, type }).then((result) => {
		if (result.path.toLowerCase().substring(0, 4) === "http")
			return fse
				.mkdtemp(path.join(os.tmpdir(), "gifmodbot/"))
				.then((tmpDir) =>
					pipeline(
						got.stream(result.path),
						fse.createWriteStream(path.join(path.join(tmpDir, submission.id + "." + type)))
					).then(() => path.join(path.join(tmpDir, submission.id + "." + type)))
				);
		else return result.path;
	});

// TODO: split framing and redirecting to different jobcollectors

router.get("/:post(\\w{6,8})/:service", (req, res) => {
	if (!Object.keys(sauceServices).includes(req.params.service))
		return res.status(503).send(errorPage("Unknown service"));

	const sauceService = sauceServices[req.params.service];

	const job = jobs.get(req.params.post + req.params.service);

	if (job)
		return job.promise.then(
			(result) => res.redirect(result),
			(err) => res.status(503).send(errorPage(err))
		);

	client
		.getSubmission(req.params.post)
		.fetch()
		.then((submission) => {
			if (!subreddits.includes(submission.subreddit.display_name))
				return res.status(503).send(errorPage("Wrong subreddit"));

			let passed = handlers
				.map((handler) => ({ handler, match: handler.match(submission.url) }))
				.filter((h) => h.match);

			if (passed.length) {
				const promise = passed[0].handler
					.check(submission.url)
					.then((availableFormats) => {
						if (!availableFormats || !availableFormats.length) throw new Error();

						return download(
							passed[0].handler,
							submission,
							availableFormats.includes("mp4")
								? "mp4"
								: availableFormats.includes("gif")
								? "gif"
								: availableFormats.includes("webm")
								? "webm"
								: ""
						);
					})
					.then((filePath) => {
						return spawn("ffmpeg", [
							"-i",
							filePath,
							"-vf",
							"select=eq(n\\,0)",
							"-vframes",
							"1",
							path.join(path.dirname(filePath), "frame.png"),
						]).then(() =>
							sauceService(
								encodeURIComponent(
									serverLocation +
										"/source/" +
										path.dirname(filePath).split(path.sep).pop() +
										"_frame.png"
								)
							)
						);
					});

				promise.then(
					(result) => res.redirect(result),
					(err) => res.status(503).send(errorPage(err))
				);

				jobs.create({
					id: req.params.post,
					time: Date.now(),
					promise,
				});
			} else {
				return res.status(503).send(errorPage("Source not supported"));
			}
		})
		.catch(() => {
			res.status(503).send(errorPage("Submission not found"));
		});
});

router.get("/:post(\\w{6,8})_frame.png", (req, res) => {
	res.sendFile(path.join(os.tmpdir(), "gifmodbot", req.params.post, "frame.png"));
});

export default router;
