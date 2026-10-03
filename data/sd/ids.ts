/**
 * Canonical IDs for all System Design content. Every cross-reference must use these.
 * IDs are unique within each kind; concept ids are unique across HLD+LLD,
 * pattern ids across HLD+LLD, problem ids across HLD+LLD (they share URL spaces).
 */

export const HLD_CATEGORIES = {
  core: ["scalability", "availability", "reliability", "fault-tolerance", "latency", "throughput", "consistency", "cap-theorem", "pacelc", "horizontal-scaling", "vertical-scaling", "stateless-services", "stateful-services"],
  infrastructure: ["load-balancer", "reverse-proxy", "api-gateway", "cdn", "service-discovery", "dns", "object-storage"],
  databases: ["sql-databases", "nosql-databases", "replication", "read-replicas", "sharding", "partitioning", "indexing", "consistency-models", "transactions"],
  caching: ["cache-aside", "read-through-cache", "write-through-cache", "write-behind-cache", "cache-invalidation", "distributed-cache", "cache-eviction"],
  messaging: ["message-queue", "pub-sub", "event-driven-architecture", "event-streaming", "async-processing", "dead-letter-queue"],
  reliability: ["rate-limiting", "circuit-breaker", "retries", "exponential-backoff", "idempotency", "failover", "disaster-recovery"],
  observability: ["logging", "metrics", "distributed-tracing", "monitoring", "alerting"],
} as const;

export const LLD_CATEGORIES = {
  oop: ["encapsulation", "abstraction", "inheritance", "polymorphism", "composition", "association", "aggregation", "dependency"],
  principles: ["single-responsibility", "open-closed", "liskov-substitution", "interface-segregation", "dependency-inversion", "dry", "kiss", "yagni", "high-cohesion", "low-coupling", "dependency-injection"],
  "uml-design": ["uml-class-diagrams", "class-design", "interface-design", "composition-over-inheritance"],
} as const;

export const HLD_PATTERN_IDS = [
  "cache-aside-pattern", "write-through", "write-behind", "pub-sub-pattern", "event-driven", "cqrs", "event-sourcing",
  "database-sharding", "read-replication", "consistent-hashing", "circuit-breaker-pattern", "retry-pattern", "bulkhead",
  "saga", "rate-limiting-pattern", "fan-out-fan-in",
] as const;

export const LLD_PATTERN_IDS = {
  creational: ["factory-method", "abstract-factory", "builder", "singleton", "prototype"],
  structural: ["adapter", "decorator", "facade", "proxy", "composite", "bridge"],
  behavioral: ["strategy", "observer", "command", "state", "chain-of-responsibility", "template-method", "iterator", "mediator"],
} as const;

export const HLD_PROBLEM_IDS = [
  "url-shortener", "twitter", "instagram", "youtube", "netflix", "whatsapp", "uber", "google-drive", "dropbox",
  "notification-system", "rate-limiter", "chat-system", "ticket-booking", "food-delivery", "payment-system",
  "search-autocomplete", "news-feed",
] as const;

export const LLD_PROBLEM_IDS = [
  "parking-lot", "elevator-system", "atm", "vending-machine", "coffee-machine", "chess", "tic-tac-toe",
  "snake-and-ladder", "library-management", "hotel-management", "car-rental", "movie-ticket-booking", "splitwise",
  "logger", "notification-service-lld", "meeting-room-scheduler", "ride-sharing",
] as const;
