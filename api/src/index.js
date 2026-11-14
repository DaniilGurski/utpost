import { app } from "./app.js";
import { config } from "./config.js";

app.listen(config.port, () => {
  console.log(`REST listening: http://localhost:${config.port}`);
  console.log(`GraphQL listening: http://localhost:${config.port}/graphql`);
});
