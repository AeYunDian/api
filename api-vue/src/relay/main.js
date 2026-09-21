import { bootstrap } from "@/shared/bootstrap";
import App from "./App.vue";

document.title = "AyRelay";

await bootstrap("relay", App, null);
