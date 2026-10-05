import { computed } from "vue";
import { Dialog } from "@varlet/ui";
import { useWindowState } from "./useWindowState";

export function useHostShell() {
  const { isMaximized } = useWindowState();

  const isHostShell = computed(
    () =>
      typeof window.hostshell !== "undefined" &&
      typeof window.chrome !== "undefined" &&
      typeof window.chrome.webview !== "undefined",
  );

  const minimizeWindow = () => {
    if (
      typeof window.hostshell !== "undefined" &&
      typeof window.hostshell.windowState === "string"
    ) {
      window.hostshell.windowState = "minimized";
    }
  };

  const maximizeWindow = () => {
    if (
      typeof window.hostshell !== "undefined" &&
      typeof window.hostshell.windowState === "string"
    ) {
      window.hostshell.windowState =
        window.hostshell.windowState === "maximized" ? "normal" : "maximized";
    }
  };

  const closeWindow = async () => {
    if (
      typeof window.hostshell !== "undefined" &&
      typeof window.hostshell.exit === "function"
    ) {
      const result = await Dialog({
        title: "退出",
        message: "确定要退出应用吗？",
        confirmButtonText: "退出",
        cancelButtonText: "取消",
      });
      if (result === "confirm") window.hostshell.exit(0);
    }
  };

  return {
    isHostShell,
    isMaximized,
    minimizeWindow,
    maximizeWindow,
    closeWindow,
  };
}
