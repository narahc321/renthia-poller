This is a simple node app which will ping you on Slack when a new house/appartment with the preferences you configured gets added to https://renthia.com/

<h2>How To Use</h2>

1. Just Clone the Repo
```
  > git clone https://github.com/narahc321/renthia-poller.git
```

2. Go into the Repo folder
```
  > cd renthia-poller
```
  

3. Install the dependencies
```
  > npm i
```

4. open config.json file and set you preferences and make sure you update the slack_hook with your Slack webhook.
Follow [this](https://api.slack.com/messaging/webhooks) to create a new webhook. You can also set the polling period in config.json.

5. Finally Start the app and keep it running. It will notify in you slack channel when a new house/apartment with your preferences is added.

```
  > node index.js 
```