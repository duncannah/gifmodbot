export const botName = process.env.BOT_NAME;
export const botVersion =
	"git-" +
	(() => {
		try {
			return require("child_process")
				.execSync("git rev-parse HEAD", { stdio: "ignore" })
				.toString()
				.trim()
				.substr(0, 7);
		} catch {
			return "000000";
		}
	})();
export const botCreator = process.env.BOT_CREATOR;
export const botHomepage = process.env.BOT_HOMEPAGE;

export const serverLocation = process.env.SERVER_LOCATION;

export const subreddits =
	process.env.SUBREDDITS && process.env.SUBREDDITS.substring(0, 1) === "["
		? JSON.parse(process.env.SUBREDDITS || "[]")
		: [];

// BOT CONSTANTS

export const garbageCollectionInterval = 1000 * 60 * 60 * 0.25; // 15 mins
