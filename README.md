# gifmodbot

Reddit bot for GIF subreddits supplying users with download and source check options. Currently being used on /r/yaoigif and /r/yurigif.

Supported sources:

-   Imgur
-   Reddit
-   RedGIFS
-   Twitter
-   Direct link (generic)

Source check using SauceNAO and IQDB.

The bot reports posts it deems are not GIFs.

# Message preview

> Thanks for your submission, {username}.
>
> Download: [[GIF]](), [[MP4]](), [[WEBM]]()
>
> Source lookup: [[SauceNAO]](), [[IQDB]]()
>
> I'm a bot, this action was performed automatically.

# Configuration

The bot is configured using environment variables, those can also be set using an `.env` file.

The file [.env-sample](.env-sample) demonstrates a simple example.

# License

Check [LICENSE](LICENSE).
