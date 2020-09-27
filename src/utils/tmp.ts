import fse from "fs-extra";
import path from "path";
import os from "os";

import { garbageCollectionInterval } from "../constants";

export class GarbageCollector {
	interval?: NodeJS.Timeout;

	collect = () =>
		Promise.resolve()
			.then(() => fse.ensureDir(path.join(os.tmpdir(), "gifmodbot")))
			.then(() => fse.readdir(path.join(os.tmpdir(), "gifmodbot")))
			.then((files) =>
				Promise.all(
					files.map((file) =>
						fse
							.stat(path.join(os.tmpdir(), "gifmodbot", file))
							.then((stats) =>
								stats.mtimeMs <= Date.now() - garbageCollectionInterval
									? fse.remove(path.join(os.tmpdir(), "gifmodbot", file))
									: Promise.resolve()
							)
					)
				)
			);

	start = () => (this.interval = setInterval(() => this.collect(), garbageCollectionInterval));

	stop = () => clearInterval(this.interval as NodeJS.Timeout);
}

export const makeTmpDir = () =>
	Promise.resolve()
		.then(() => fse.ensureDir(path.join(os.tmpdir(), "gifmodbot")))
		.then(() => fse.mkdtemp(path.join(os.tmpdir(), "gifmodbot/")));
