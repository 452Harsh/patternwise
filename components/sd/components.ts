import {
  Bell,
  Box,
  Cloud,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Layers,
  ListOrdered,
  Monitor,
  Network,
  Search,
  Server,
  Split,
  type LucideIcon,
} from "lucide-react";
import type { ComponentType } from "@/data/sd/types";

/** Visual vocabulary for architecture components, shared by static diagrams and the editor. */
export interface ComponentMeta {
  type: ComponentType;
  label: string;
  icon: LucideIcon;
  /** Tailwind classes for the icon chip. */
  tone: string;
}

export const COMPONENTS: ComponentMeta[] = [
  { type: "client", label: "Client", icon: Monitor, tone: "bg-info/12 text-info" },
  { type: "dns", label: "DNS", icon: Globe, tone: "bg-primary/12 text-primary" },
  { type: "cdn", label: "CDN", icon: Cloud, tone: "bg-primary/12 text-primary" },
  { type: "load-balancer", label: "Load Balancer", icon: Split, tone: "bg-primary/12 text-primary" },
  { type: "api-gateway", label: "API Gateway", icon: Network, tone: "bg-primary/12 text-primary" },
  { type: "service", label: "Service", icon: Server, tone: "bg-foreground/8 text-foreground" },
  { type: "worker", label: "Worker", icon: Cpu, tone: "bg-foreground/8 text-foreground" },
  { type: "database", label: "Database", icon: Database, tone: "bg-success/12 text-success" },
  { type: "cache", label: "Cache", icon: Layers, tone: "bg-success/12 text-success" },
  { type: "storage", label: "Object Storage", icon: HardDrive, tone: "bg-success/12 text-success" },
  { type: "search", label: "Search", icon: Search, tone: "bg-success/12 text-success" },
  { type: "queue", label: "Queue", icon: ListOrdered, tone: "bg-warning/12 text-warning" },
  { type: "notification", label: "Notification Service", icon: Bell, tone: "bg-warning/12 text-warning" },
  { type: "external", label: "External System", icon: Box, tone: "bg-muted text-muted-foreground" },
];

const BY_TYPE = new Map(COMPONENTS.map((c) => [c.type, c]));

export const componentMeta = (type: string | undefined): ComponentMeta =>
  BY_TYPE.get(type as ComponentType) ?? { type: "service", label: "Component", icon: Server, tone: "bg-foreground/8 text-foreground" };
