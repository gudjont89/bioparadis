import "@fontsource-variable/dm-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "./styles.css";
import { render } from "preact";
import { App } from "./App";

render(<App />, document.getElementById("app") as HTMLElement);
