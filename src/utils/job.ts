import { garbageCollectionInterval } from "../constants";

export interface Job<T> {
	id: string;
	time: number;
	promise: Promise<T>;
}

export class JobCollection<T> {
	jobs: Job<T>[] = [];

	get = (id: string): Job<T> | undefined => {
		const job = this.jobs.find((job) => job.id === id);

		if (job)
			if (job.time > Date.now() - garbageCollectionInterval + 1000 * 60 * 5) {
				let index = this.jobs.findIndex((job) => job.id === id);
				if (index > -1) this.jobs.splice(index, 1);
			} else return job;
	};

	create = (job: Job<T>): void => {
		this.jobs.push(job);
	};
}
