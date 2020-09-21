import express from "express";

import { botHomepage } from "../constants";

import downloadRouter from "./download";
import sourceRouter from "./source";

export default class Webserver {
	server: express.Express;
	port: number;

	constructor(port: number) {
		this.server = express();
		this.port = port;

		this.server.use("/download", downloadRouter);
		this.server.use("/source", sourceRouter);

		this.server.use((req, res) => {
			res.redirect(301, botHomepage || "");
		});
	}

	start = () =>
		new Promise((resolve, reject) => {
			this.server
				.listen(this.port, () => resolve(console.log("[INFO] Webserver running at port " + this.port)))
				.on("error", (err) => reject(err));
		});
}
