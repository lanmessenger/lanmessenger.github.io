// Feature cards for #features. Icons resolve via the shared Icon component.
export interface FeatureEntry {
  icon:
    | "chat"
    | "lock"
    | "send"
    | "upload"
    | "users"
    | "archive"
    | "server"
    | "wifioff"
    | "lang";
  green: boolean;
  title: string;
  text: string;
  tag: string;
  tagHot: boolean;
}

export const FEATURES: FeatureEntry[] = [
  {
    icon: "chat",
    green: false,
    title: "Instant Messaging",
    text: "You can instantly connect with other users on the network and start a conversation.",
    tag: "Zero-latency sub-millisecond",
    tagHot: false,
  },
  {
    icon: "lock",
    green: true,
    title: "Private Network",
    text: "No need to worry about your privacy. AES encryption with RSA offers industry-leading security.",
    tag: "AES-256 + RSA-2048",
    tagHot: true,
  },
  {
    icon: "send",
    green: false,
    title: "Broadcast messages",
    text: "You will have the option to notify all users within the network or choose specific users.",
    tag: "Subnet Multicast Support",
    tagHot: false,
  },
  {
    icon: "upload",
    green: false,
    title: "Transfer Files",
    text: "Forget about email attachments. This app makes it easy and hassle-free to transfer files to other users within the network.",
    tag: "Gigabit LAN Throughput",
    tagHot: false,
  },
  {
    icon: "users",
    green: false,
    title: "Group Contacts",
    text: "You can also easily organize people in your contact list. This will make it easy to find people when needed.",
    tag: "Department Folders",
    tagHot: false,
  },
  {
    icon: "archive",
    green: false,
    title: "Log Messages",
    text: "Previous conversations can also be archived, which you can access at any given time.",
    tag: "Local history file",
    tagHot: false,
  },
  {
    icon: "server",
    green: true,
    title: "Works without Server",
    text: "One of the best things about this instant messaging application is the lack of server that is required, making it less complicated.",
    tag: "Zero Maintenance Cost",
    tagHot: true,
  },
  {
    icon: "wifioff",
    green: true,
    title: "Works without Internet Connection",
    text: "This messaging application utilizes a local network, which means that you can send messages even without internet, which is beneficial in minimizing possible threats.",
    tag: "Immune to WAN Outages",
    tagHot: true,
  },
  {
    icon: "lang",
    green: false,
    title: "Supports Multiple Languages & Multi-platform",
    text: "You can choose from the different languages that will be used as the medium for the user interface. Regardless of your operating system, whether you are on Mac, Windows, or Linux, you can use this messaging application.",
    tag: "20 interface languages",
    tagHot: false,
  },
];
