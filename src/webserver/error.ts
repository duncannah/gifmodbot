import { botName, botVersion } from "../constants";

export default (msg: string) => {
	return `
	<!DOCTYPE html>
	<html lang="en">
		<head>
			<meta charset="UTF-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<title>GifModBot - Error</title>
			<style type="text/css">
				body {
					background: #222;
					color: #eee;

					display: flex;
					justify-content: center;
					align-items: center;
					margin: 0;
					min-height: 100vh;
					font-size: 32px;
					font-family: sans-serif;
					text-align: center;
				}

				.info {
					font-size: 0.3em;
					opacity: .25;
					margin-top: 2em;
				}
			</style>
		</head>
		<body>
			<div class="container">
				<div class="content">${msg}</div>
				<div class="info">${botName} ${botVersion} ・ ${new Date().toUTCString()}</div>
			</div>
		</body>
	</html>`.replace(/\n|\t/g, "");
};
