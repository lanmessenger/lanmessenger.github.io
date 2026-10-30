import { SITE } from "./site";
import { formatBytes, type ReleaseInfo } from "../lib/github";

// Download cards are built at build time from the GitHub release API
// (see buildReleaseView). Only presentation copy lives here: titles,
// subtitles, badges, icons. File names, sizes and URLs come from the API,
// matched per slot by filename pattern — a renamed upstream asset fails
// the build loudly instead of shipping a dead link.
// The ARCHIVE section below is intentionally frozen (old releases), not API-driven.
export interface DownloadEntry {
  icon: "monitor" | "desktopmac" | "windows" | "terminal" | "box" | "code";
  iconTone: "default" | "dark" | "slate" | "green";
  badge: string;
  title: string;
  sub: string;
  pkgLabel: string;
  pkgValue: string;
  verLabel: string;
  verValue: string;
  href: string;
  external: boolean;
  buttonStyle: "primary" | "secondary";
  buttonIcon: "download" | "gear";
  buttonLabel: string;
  /** Optional helper link under the card (e.g. macOS first-launch note). */
  noteHref?: string;
  noteLabel?: string;
}

interface SlotDef {
  key: "windows" | "mac-arm64" | "mac-intel" | "linux-deb" | "linux-rpm";
  /** Matched against the release asset file name. */
  match: RegExp;
  icon: DownloadEntry["icon"];
  iconTone: DownloadEntry["iconTone"];
  badge: string;
  title: string;
  sub: string;
  pkgLabel: string;
  pkgValue: string;
  buttonKind: string; // "Download <buttonKind> (<size>)"
  /** Optional helper link under the card (e.g. macOS first-launch note). */
  noteHref?: string;
  noteLabel?: string;
}

const SLOTS: SlotDef[] = [
  {
    key: "windows",
    match: /-win64\.exe$/,
    icon: "windows",
    iconTone: "default",
    badge: "64-bit",
    title: "Windows",
    sub: "Windows 11 and 10 (64-bit)",
    pkgLabel: "Package:",
    pkgValue: "Windows .exe installer",
    buttonKind: ".exe",
  },
  {
    key: "mac-arm64",
    match: /_arm64\.dmg$/,
    icon: "desktopmac",
    iconTone: "slate",
    badge: "Apple Silicon",
    title: "macOS (Apple Silicon)",
    sub: "Native ARM64 build for Apple Silicon (M-series) Macs",
    pkgLabel: "Package:",
    pkgValue: "Mac .dmg (arm64)",
    buttonKind: ".dmg arm64",
    noteHref: "/docs/install-macos",
    noteLabel: "Launch on Mac",
  },
  {
    key: "mac-intel",
    match: /_x86_64\.dmg$/,
    icon: "desktopmac",
    iconTone: "slate",
    badge: "Intel x86_64",
    title: "macOS (Intel)",
    sub: "Native build for Intel-based Macs",
    pkgLabel: "Package:",
    pkgValue: "Mac .dmg (Intel x86_64)",
    buttonKind: ".dmg Intel",
    noteHref: "/docs/install-macos",
    noteLabel: "Launch on Mac",
  },
  {
    key: "linux-deb",
    match: /_amd64\.deb$/,
    icon: "terminal",
    iconTone: "green",
    badge: "Debian / Ubuntu",
    title: "Linux (.deb)",
    sub: "Ubuntu, Debian, Linux Mint, Pop!_OS and apt-based distros",
    pkgLabel: "Package:",
    pkgValue: "Linux .deb",
    buttonKind: ".deb",
    noteHref: "/docs/install-linux",
    noteLabel: "Install on Linux",
  },
  {
    key: "linux-rpm",
    match: /\.x86_64\.rpm$/,
    icon: "box",
    iconTone: "green",
    badge: "Fedora / RHEL",
    title: "Linux (.rpm)",
    sub: "Fedora, RedHat Enterprise Linux, CentOS, openSUSE",
    pkgLabel: "Package:",
    pkgValue: "Linux .rpm",
    buttonKind: ".rpm",
    noteHref: "/docs/install-linux",
    noteLabel: "Install on Linux",
  },
];

export interface HeroTarget {
  href: string;
  text: string;
  tag: string;
}

export interface HeroTargets {
  windows: HeroTarget;
  mac: HeroTarget;
  linux: HeroTarget;
}

export interface ReleaseView {
  version: string;
  downloads: DownloadEntry[];
  heroTargets: HeroTargets;
}

export function buildReleaseView(info: ReleaseInfo): ReleaseView {
  const { version, assets } = info;
  const hrefByKey = new Map<string, string>();
  const downloads: DownloadEntry[] = SLOTS.map((slot) => {
    const hit = assets.find((a) => slot.match.test(a.name));
    if (!hit)
      throw new Error(
        `Release v${version}: no asset matching ${slot.match} for "${slot.key}"`
      );
    hrefByKey.set(slot.key, hit.url);
    const size = formatBytes(hit.size);
    return {
      icon: slot.icon,
      iconTone: slot.iconTone,
      badge: slot.badge,
      title: slot.title,
      sub: slot.sub,
      pkgLabel: slot.pkgLabel,
      pkgValue: slot.pkgValue,
      verLabel: "Version / Size:",
      verValue: `v${version} · ${size}`,
      href: hit.url,
      external: false,
      buttonStyle: "primary",
      buttonIcon: "download",
      buttonLabel: `Download ${slot.buttonKind} (${size})`,
      noteHref: slot.noteHref,
      noteLabel: slot.noteLabel,
    };
  });
  downloads.push({
    icon: "code",
    iconTone: "dark",
    badge: "GPL-3.0",
    title: "Source Code (C++ / Qt)",
    sub: "Audit cryptographic functions, compile for custom BSD or specialized OS",
    pkgLabel: "Repository:",
    pkgValue: "lanmessenger/lanmessenger",
    verLabel: "License:",
    verValue: "GNU General Public License v3.0",
    href: SITE.repo,
    external: true,
    buttonStyle: "secondary",
    buttonIcon: "gear",
    buttonLabel: "Browse Repository",
  });
  const href = (key: string): string => {
    const v = hrefByKey.get(key);
    if (!v) throw new Error(`Release v${version}: missing href for "${key}"`);
    return v;
  };
  return {
    version,
    downloads,
    heroTargets: {
      windows: {
        href: href("windows"),
        text: "Download for Windows",
        tag: `v${version} .exe`,
      },
      mac: {
        href: href("mac-arm64"),
        text: "Download for Mac",
        tag: "Apple Silicon",
      },
      linux: {
        href: href("linux-deb"),
        text: "Download for Linux",
        tag: ".deb x64",
      },
    },
  };
}

export interface ArchiveEntry {
  icon: "file" | "zip" | "monitor" | "terminal" | "box" | "archivebox";
  href: string;
  label: string;
  sub: string;
}

export const ARCHIVE: ArchiveEntry[] = [
  {
    icon: "file",
    href: "https://github.com/lanmessenger/lanmessenger/releases/download/v1.2.39/lmc-1.2.39-win32.exe",
    label: "Windows .exe installer",
    sub: "v1.2.39 · 7.21 MB",
  },
  {
    icon: "zip",
    href: "https://github.com/lanmessenger/lanmessenger/releases/download/v1.2.39/lmc-1.2.39-win32.zip",
    label: "Windows .zip (Portable)",
    sub: "v1.2.39 · 9.25 MB",
  },
  {
    icon: "monitor",
    href: "https://github.com/lanmessenger/lanmessenger/releases/download/v1.2.37/lmc_1.2.37_intel.dmg",
    label: "Mac OS X .dmg",
    sub: "v1.2.37 · 24.2 MB",
  },
  {
    icon: "terminal",
    href: "https://github.com/lanmessenger/lanmessenger/releases/download/v1.2.37/lmc_1.2.37_x86_64_min.deb",
    label: "Linux .deb",
    sub: "v1.2.37 · 1.4 MB",
  },
  {
    icon: "box",
    href: "https://github.com/lanmessenger/lanmessenger/releases/download/v1.2.37/lmc-1.2.37.x86_64_min.rpm",
    label: "Linux .rpm",
    sub: "v1.2.37 · 2.6 MB",
  },
  {
    icon: "archivebox",
    href: "https://github.com/lanmessenger/lanmessenger/archive/v1.2.37.zip",
    label: "Source code .zip",
    sub: "v1.2.37 · Archive zip",
  },
];
