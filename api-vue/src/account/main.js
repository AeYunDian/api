import { bootstrap } from "@/shared/bootstrap";
import App from "./App.vue";
import router from "./router/index.js";

await bootstrap("account", App, router);
