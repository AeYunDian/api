import { bootstrap } from "@/shared/bootstrap";
import App from "./App.vue";
import router from "./router/index.js";

document.title = "AyIntelligence";

await bootstrap("ai", App, router);
