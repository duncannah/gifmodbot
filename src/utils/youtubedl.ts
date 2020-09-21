import fse from "fs-extra";
import path from "path";
import os from "os";

import got from "got";
import touch from "touch";
import { spawn } from "promisify-child-process";

import { FetchOpt } from "../handlers";

const YTDL_PATH = path.join(__dirname, "../../bin/youtube-dl" + (os.platform() === "win32" ? ".exe" : ""));

const updateYTDL = () =>
	new Promise((resv) => {
		try {
			if (fse.statSync(YTDL_PATH).mtimeMs <= new Date().getTime() - 1000 * 60 * 60 * 6) throw Error;
			else resv();
		} catch (error) {
			touch(YTDL_PATH); // prevent collision

			let tmpName = YTDL_PATH + "." + new Date().getTime();

			got.stream("https://yt-dl.org/downloads/latest/youtube-dl" + (os.platform() === "win32" ? ".exe" : ""))
				.pipe(fse.createWriteStream(tmpName))
				.on("finish", async () => {
					await fse.move(tmpName, YTDL_PATH, { overwrite: true });
					resv();
				});
		}
	});

const download = (opt: FetchOpt, tmp: string): Promise<string> =>
	spawn(
		"python3",
		[
			YTDL_PATH,
			"--no-warnings",
			"--max-filesize",
			"10m",
			"--merge-output-format",
			opt.type,
			"-o",
			path.join(tmp, opt.submission.id + "." + opt.type),
			"--postprocessor-args",
			"-strict -2",
			"--",
			opt.submission.url,
		],
		{ stdio: "ignore" } // since we're not reading it; no feedback if buffer exceeds
	).then(({ code }) => {
		if (code) throw new Error("Error code " + code);
		else return `${tmp}/${opt.submission.id}.${opt.type}`;
	});

export const checkVideo = (url: string): Promise<boolean> =>
	spawn("python3", [YTDL_PATH, "--no-warnings", "-F", "--", url], { stdio: "ignore" })
		.then(({ code }) => !code)
		.catch(() => false);

export const getURL = (url: string): Promise<string> =>
	spawn("python3", [YTDL_PATH, "--no-warnings", "-g", "--", url], { encoding: "utf8" }).then(({ stdout, code }) => {
		if (!code && typeof stdout === "string" && stdout.split("\n")[0].toLowerCase().substring(0, 4) === "http")
			return stdout.split("\n")[0];
		else throw new Error("Can't get URL");
	});

export default (opt: FetchOpt) =>
	Promise.resolve()
		.then(updateYTDL)
		.then(() => fse.mkdtemp(path.join(os.tmpdir(), "gifmodbot/")))
		.then((tmpDir) => download(opt, tmpDir));
