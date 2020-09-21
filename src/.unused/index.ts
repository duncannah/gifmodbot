import fse from "fs-extra";
import path from "path";
import os from "os";
import stream from "stream";
import { promisify } from "util";

import got from "got";
import FormData from "form-data";
import snoowrap from "snoowrap";
import { spawn } from "promisify-child-process";

import { Handler } from "../handlers";

import { botName, botVersion, botCreator } from "../constants";

const pipeline = promisify(stream.pipeline);

const download = (handler: Handler, submission: snoowrap.Submission, type: string): Promise<string> =>
	handler.fetch({ postID: submission.id, url: submission.url, type }).then((result) => {
		if (result.toLowerCase().substring(0, 4) === "http")
			return fse
				.mkdtemp(path.join(os.tmpdir(), "gifmodbot/"))
				.then((tmpDir) =>
					pipeline(
						got.stream(submission.url),
						fse.createWriteStream(path.join(path.join(tmpDir, submission.id + "." + type)))
					).then(() => path.join(path.join(tmpDir, submission.id + "." + type)))
				);
		else return result;
	});

const fixURL = (url: string): string => {
	if (url.startsWith("//")) url = "https:" + url;

	return url;
};

// TODO: error handler WHEN CALLED
export default (handler: Handler, submission: snoowrap.Submission): Promise<[string, string, string] | null> =>
	handler
		.check(submission.url)
		.then((availableFormats) => {
			if (!availableFormats.length) throw new Error();

			return download(
				handler,
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
		.then(
			(filePath): Promise<string> =>
				new Promise((resolve, reject) => {
					const frame = spawn("ffmpeg", [
						"-i",
						filePath,
						"-vf",
						"select=eq(n\\,0)",
						"-vframes",
						"1",
						path.join(path.dirname(filePath), "frame.png"),
						"-y",
					]);

					let lastStderr = "";

					if (frame.stderr)
						frame.stderr.on("data", function (data) {
							lastStderr = data.toString();
						});

					frame.catch((err) => reject(err));

					frame.on("close", (code) => {
						if (code) {
							console.error("[ERROR] Checking source failed with code " + code + "; " + lastStderr);
							reject(new Error("Error code " + code));
						} else resolve(path.join(path.dirname(filePath), "frame.png"));
					});
				})
		)
		.then((frameFile) => {
			const form = new FormData();

			form.append("MAX_FILE_SIZE", "8388608");
			form.append("service[]", "1");
			//form.append("service[]", "2");
			//form.append("service[]", "3");
			form.append("service[]", "4");
			form.append("service[]", "5");
			form.append("file", fse.createReadStream(frameFile));
			form.append("url", "");

			return got
				.post("https://www.iqdb.org", {
					body: form,
					headers: {
						"user-agent": `${botName}:${botVersion} (by /u/${botCreator})`,
					},
				})
				.then((resp) => {
					let match = resp.body.match(
						/<table><tr><th>Best match<\/th><\/tr><tr><td class='image'><a href="([^"]+)">.+class="service-icon">([^<]+)<.+<td>([^%]+)% similarity<\/td>/
					);

					if (match && parseInt(match[3], 10) >= 25) {
						let idMatch = match[1].match(/(\d+)$/);
						// TODO: get info about post
						// if source is text then ""[source]" by [artist]"
						// if not then "[characters] by [artist]"

						return [
							match[3] + "%",
							`${match[2]} post${idMatch ? " #" + idMatch[1] : ""}`,
							fixURL(match[1]),
						];
					} else return null;
				});
		});
