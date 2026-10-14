// Screenshot cards for #screenshots. Full-size .jpg opens on click.
export interface ScreenshotEntry {
  full: string;
  thumb: string;
  alt: string;
  label: string;
  title: string;
  text: string;
}

export const SCREENSHOTS: ScreenshotEntry[] = [
  {
    full: "images/lmc_1225_win7.jpg",
    thumb: "images/lmc_1225_win7_min.png",
    alt: "LAN Messenger main window on Windows: contact list and chat",
    label: "Windows Client",
    title: "Windows Integration",
    text: "System tray notifications, automatic startup option, and Windows firewall pre-configuration.",
  },
  {
    full: "images/lmc_1225_osx.jpg",
    thumb: "images/lmc_1225_osx_min.png",
    alt: "LAN Messenger main window on macOS with native title bar",
    label: "macOS Universal",
    title: "macOS Native Look",
    text: "Native title bars, crisp typography, and separate builds for Apple Silicon and Intel.",
  },
  {
    full: "images/lmc_1225_kde.jpg",
    thumb: "images/lmc_1225_kde_min.png",
    alt: "LAN Messenger main window on Linux KDE desktop",
    label: "Linux KDE / GNOME",
    title: "Linux Desktop Fit",
    text: "Adapts to KDE and GNOME themes; ultra-light .deb and .rpm packages.",
  },
];
