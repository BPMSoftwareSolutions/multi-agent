require("dotenv").config();
require("dotenv").config({ path: ".env.local", override: true });
require("dotenv").config({ path: "bin/.env.local", override: false });

const { createApp } = require("./app");

const port = Number(process.env.PORT || 3030);
const app = createApp();

app.listen(port, () => {
  console.log(`multi-agent-studio listening on http://localhost:${port}`);
});
