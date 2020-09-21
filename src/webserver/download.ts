import path from "path";

import express from "express";
import sanitize from "sanitize-filename";

import { JobCollection } from "../utils/job";

import { GarbageCollector } from "../utils/tmp";

import errorPage from "./error";

import { client } from "../api";

import { FetchResult, handlers } from "../handlers";

import { subreddits, garbageCollectionInterval } from "../constants";

const router = express.Router();

const collector = new GarbageCollector();
collector.start();

const jobs = new JobCollection<FetchResult>();

router.get("/:post(\\w{6,8}).:type(mp4|gif|webm)", (req, res) => {
	const responseHandler = (result: string, name: string) => {
		if (result.toLowerCase().substring(0, 4) === "http") {
			res.redirect(result);
		} else {
			let fileName: any = sanitize(name);
			if (fileName.lastIndexOf(".") === 0) fileName = undefined;

			res.download(result, fileName);
		}
	};

	const job = jobs.get(req.params.post + "." + req.params.type);

	if (job)
		return job.promise.then(
			(result) => responseHandler(result.path, result.submission.title + "." + path.extname(result.path)),
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
				const promise = passed[0].handler.fetch({ submission, type: req.params.type });

				promise.then(
					(result) => responseHandler(result.path, submission.title + "." + req.params.type),
					(err) => res.status(503).send(errorPage(err))
				);

				jobs.create({
					id: req.params.post + "." + req.params.type,
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

export default router;
