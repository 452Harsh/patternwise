import type { SDCategory, SDConcept } from "./types";

export const LLD_CATEGORY_LIST: SDCategory[] = [
  {
    id: "oop",
    track: "lld",
    name: "Object-Oriented Programming",
    blurb: "The four pillars of OOP and the object relationships every class design is built from.",
  },
  {
    id: "principles",
    track: "lld",
    name: "Design Principles",
    blurb: "SOLID and the everyday heuristics that keep code easy to change, test, and reason about.",
  },
  {
    id: "uml-design",
    track: "lld",
    name: "UML & Class Design",
    blurb: "How to model entities, interfaces, and relationships clearly before and during an LLD interview.",
  },
];

export const LLD_CONCEPTS: SDConcept[] = [
  // ───────────────────────────── OOP ─────────────────────────────
  {
    id: "encapsulation",
    track: "lld",
    category: "oop",
    name: "Encapsulation",
    summary: "Bundling data with the methods that operate on it and hiding internal state behind a controlled public interface.",
    why: "It protects invariants: callers cannot put an object into an invalid state, and internals can change without breaking clients.",
    whenToUse: [
      "Any class that owns state with rules (e.g. balance can never be negative)",
      "When you want to change internal representation later without touching callers",
      "Domain entities in LLD problems like Account, ParkingSpot, or Order",
    ],
    howItWorks: [
      "Make fields private (or otherwise non-public)",
      "Expose behavior-oriented methods (deposit, withdraw) rather than raw setters",
      "Validate inputs inside those methods to enforce invariants",
      "Return copies or read-only views of internal collections",
    ],
    pros: [
      "Invariants are enforced in one place",
      "Internal representation can evolve freely",
      "Smaller, clearer public API surface",
      "Easier debugging since state changes go through known paths",
    ],
    cons: [
      "Getter/setter-for-everything defeats the purpose while adding boilerplate",
      "Leaking mutable internal collections silently breaks encapsulation",
      "Over-hiding can make testing awkward if no seams are provided",
    ],
    interviewQuestions: [
      "How is encapsulation different from abstraction?",
      "Why are public setters for every field considered a code smell?",
      "How would you prevent callers from mutating a list returned by a getter?",
      "Does encapsulation matter in languages without access modifiers, like Python?",
    ],
    related: ["abstraction", "high-cohesion", "class-design", "low-coupling"],
    example: {
      language: "java",
      code: `public class BankAccount {
    private long balanceCents;           // hidden state
    private final List<String> history = new ArrayList<>();

    public void deposit(long cents) {
        if (cents <= 0) throw new IllegalArgumentException("must be positive");
        balanceCents += cents;
        history.add("deposit " + cents);
    }

    public void withdraw(long cents) {
        if (cents > balanceCents) throw new IllegalStateException("insufficient funds");
        balanceCents -= cents;
        history.add("withdraw " + cents);
    }

    public long getBalance() { return balanceCents; }

    public List<String> getHistory() {
        return Collections.unmodifiableList(history); // no leaking mutable state
    }
}`,
    },
  },
  {
    id: "abstraction",
    track: "lld",
    category: "oop",
    name: "Abstraction",
    summary: "Exposing only the essential behavior of a thing while hiding how it is implemented, typically via interfaces or abstract classes.",
    why: "It lets callers depend on what something does rather than how, reducing cognitive load and making implementations swappable.",
    whenToUse: [
      "Multiple implementations of the same capability (payment gateways, storage backends)",
      "Hiding complex subsystems behind a simple contract",
      "Defining module boundaries in an LLD design",
      "Writing code that should be testable with fakes or mocks",
    ],
    howItWorks: [
      "Identify the behavior clients actually need",
      "Define an interface or abstract class describing that behavior",
      "Provide concrete implementations that hide the details",
      "Make clients depend on the abstraction, not the concrete type",
    ],
    pros: [
      "Simplifies client code",
      "Enables swapping implementations without client changes",
      "Improves testability via substitutes",
    ],
    cons: [
      "Premature abstractions with one implementation add indirection for no gain",
      "Leaky abstractions force callers to know implementation details anyway",
      "Wrong abstractions are costly to undo once widely used",
    ],
    interviewQuestions: [
      "What is the difference between abstraction and encapsulation?",
      "When would you choose an abstract class over an interface?",
      "What is a leaky abstraction? Give an example.",
      "How do you decide the right level of abstraction for a module?",
    ],
    related: ["encapsulation", "interface-design", "dependency-inversion", "polymorphism"],
    example: {
      language: "java",
      code: `// Clients only know "a notifier can send a message"
public interface Notifier {
    void send(String userId, String message);
}

public class EmailNotifier implements Notifier {
    public void send(String userId, String message) {
        String email = lookupEmail(userId);   // SMTP details hidden
        smtpClient.send(email, message);
    }
}

public class SmsNotifier implements Notifier {
    public void send(String userId, String message) {
        smsGateway.post(lookupPhone(userId), message);
    }
}

// Caller code is unaware of SMTP or SMS gateways
void alert(Notifier notifier, String userId) {
    notifier.send(userId, "Your order has shipped");
}`,
    },
  },
  {
    id: "inheritance",
    track: "lld",
    category: "oop",
    name: "Inheritance",
    summary: "A mechanism where a subclass acquires the fields and behavior of a parent class, modeling an \"is-a\" relationship.",
    why: "It enables reuse of shared behavior and lets subclasses be treated as their parent type, which underpins polymorphism.",
    whenToUse: [
      "A genuine, stable is-a relationship (SavingsAccount is an Account)",
      "Sharing a common skeleton via template methods in an abstract base",
      "Framework extension points designed for subclassing",
    ],
    howItWorks: [
      "Define a base class with shared state and behavior",
      "Create subclasses with extends, adding or overriding behavior",
      "Call super for shared initialization or behavior",
      "Use the subclass anywhere the base type is expected",
    ],
    pros: [
      "Straightforward code reuse",
      "Natural modeling of taxonomies",
      "Enables polymorphic dispatch",
    ],
    cons: [
      "Tight coupling between parent and child (fragile base class problem)",
      "Deep hierarchies are hard to understand and change",
      "Subclasses can violate parent contracts, breaking LSP",
      "Single inheritance in Java limits flexibility",
    ],
    interviewQuestions: [
      "What is the fragile base class problem?",
      "When is inheritance the right choice over composition?",
      "Why does Java not support multiple inheritance of classes?",
      "Is Square extends Rectangle a good design? Why or why not?",
    ],
    related: ["polymorphism", "composition-over-inheritance", "liskov-substitution", "composition"],
    example: {
      language: "java",
      code: `public abstract class Vehicle {
    protected final String plate;

    protected Vehicle(String plate) { this.plate = plate; }

    public abstract int wheels();

    public String describe() {
        return getClass().getSimpleName() + " " + plate + " with " + wheels() + " wheels";
    }
}

public class Car extends Vehicle {
    public Car(String plate) { super(plate); }
    public int wheels() { return 4; }
}

public class Motorcycle extends Vehicle {
    public Motorcycle(String plate) { super(plate); }
    public int wheels() { return 2; }
}`,
    },
  },
  {
    id: "polymorphism",
    track: "lld",
    category: "oop",
    name: "Polymorphism",
    summary: "The ability for one interface to have many implementations, so the same call dispatches to different behavior depending on the runtime type.",
    why: "It eliminates type-switching conditionals and lets new behaviors be added by adding classes rather than editing existing code.",
    whenToUse: [
      "Replacing if/else or switch chains on a type field",
      "Strategy-like variation (pricing rules, payment methods)",
      "Processing heterogeneous collections uniformly",
    ],
    howItWorks: [
      "Declare a common interface or base type",
      "Implement or override the method in each concrete class",
      "Hold references by the common type",
      "At runtime, dynamic dispatch picks the concrete implementation (overloading is the compile-time form)",
    ],
    pros: [
      "Removes conditional type logic",
      "Supports the Open/Closed Principle",
      "Client code stays simple and uniform",
    ],
    cons: [
      "Behavior is spread across classes, harder to trace",
      "Overkill when there are only two fixed cases",
      "Misused overriding can break substitutability",
    ],
    interviewQuestions: [
      "Explain compile-time vs runtime polymorphism.",
      "How does dynamic dispatch work in Java?",
      "Refactor a switch on vehicle type to use polymorphism.",
      "Can static methods be overridden? Why not?",
    ],
    related: ["inheritance", "abstraction", "open-closed", "interface-design"],
    example: {
      language: "python",
      code: `from abc import ABC, abstractmethod
import math

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

class Circle(Shape):
    def __init__(self, r: float):
        self.r = r
    def area(self) -> float:
        return math.pi * self.r ** 2

class Rect(Shape):
    def __init__(self, w: float, h: float):
        self.w, self.h = w, h
    def area(self) -> float:
        return self.w * self.h

# No type checks: each object answers for itself
shapes: list[Shape] = [Circle(1), Rect(2, 3)]
total = sum(s.area() for s in shapes)`,
    },
  },
  {
    id: "composition",
    track: "lld",
    category: "oop",
    name: "Composition",
    summary: "A strong \"has-a\" relationship where a whole owns its parts and the parts' lifecycle is tied to the whole.",
    why: "It builds complex objects from simpler ones and favors flexible, delegated behavior over rigid class hierarchies.",
    whenToUse: [
      "Parts that make no sense without the owner (Order owns OrderLines)",
      "Assembling behavior from smaller collaborators",
      "When you want to swap internal components at construction time",
    ],
    howItWorks: [
      "The owner creates or exclusively holds its parts as fields",
      "The owner delegates work to its parts",
      "Parts are not shared with other owners",
      "Destroying the owner destroys (or orphans) the parts",
    ],
    pros: [
      "Clear ownership and lifecycle",
      "Flexible: parts can be changed without changing the owner's type",
      "Encourages small, focused classes",
    ],
    cons: [
      "More delegation boilerplate than inheritance",
      "Many small objects can make the design feel fragmented",
      "Confusing composition with aggregation leads to wrong lifecycle handling",
    ],
    interviewQuestions: [
      "What is the difference between composition and aggregation?",
      "How is composition shown in a UML class diagram?",
      "Give an example of composition in a parking lot design.",
    ],
    related: ["aggregation", "association", "composition-over-inheritance", "uml-class-diagrams"],
    example: {
      language: "java",
      code: `public class Order {
    // Order owns its lines; lines do not exist outside an order
    private final List<OrderLine> lines = new ArrayList<>();

    public void addItem(String sku, int qty, long priceCents) {
        lines.add(new OrderLine(sku, qty, priceCents)); // created by the owner
    }

    public long total() {
        return lines.stream().mapToLong(OrderLine::subtotal).sum();
    }

    private static final class OrderLine {
        private final String sku;
        private final int qty;
        private final long priceCents;

        OrderLine(String sku, int qty, long priceCents) {
            this.sku = sku; this.qty = qty; this.priceCents = priceCents;
        }
        long subtotal() { return qty * priceCents; }
    }
}`,
    },
  },
  {
    id: "association",
    track: "lld",
    category: "oop",
    name: "Association",
    summary: "A general structural relationship where one object knows about and uses another, with independent lifecycles.",
    why: "It models how domain objects are linked (a Driver drives a Car) without implying ownership.",
    whenToUse: [
      "Objects that reference each other but live independently",
      "Modeling multiplicity (one-to-many, many-to-many) between entities",
      "Navigable links needed for queries (Student to Courses)",
    ],
    howItWorks: [
      "Hold a reference (or collection of references) to the associated object",
      "Decide direction: unidirectional or bidirectional navigation",
      "Specify multiplicity, e.g. 1..*, 0..1",
      "Keep both sides consistent if bidirectional",
    ],
    pros: [
      "Expresses real-world relationships directly",
      "No lifecycle coupling between objects",
      "Multiplicity makes constraints explicit",
    ],
    cons: [
      "Bidirectional associations are easy to get out of sync",
      "Too many associations create a tangled object graph",
      "Vague associations hide whether ownership is intended",
    ],
    interviewQuestions: [
      "How do association, aggregation, and composition differ?",
      "When would you make an association bidirectional?",
      "How do you represent a many-to-many association in code?",
    ],
    related: ["aggregation", "composition", "dependency", "uml-class-diagrams"],
    example: {
      language: "java",
      code: `public class Doctor {
    private final String name;
    private final Set<Patient> patients = new HashSet<>();

    public Doctor(String name) { this.name = name; }

    public void addPatient(Patient p) {
        if (patients.add(p)) p.addDoctor(this);  // keep both sides in sync
    }
}

public class Patient {
    private final String name;
    private final Set<Doctor> doctors = new HashSet<>();

    public Patient(String name) { this.name = name; }

    void addDoctor(Doctor d) { doctors.add(d); }
}
// Many-to-many; each exists independently of the other`,
    },
  },
  {
    id: "aggregation",
    track: "lld",
    category: "oop",
    name: "Aggregation",
    summary: "A weak \"has-a\" relationship where a whole groups parts that can exist independently and may be shared.",
    why: "It models containment without ownership, so removing the container does not destroy its members.",
    whenToUse: [
      "A Team has Players who can move to other teams",
      "A Library has Books that exist independently of a particular shelf",
      "Grouping objects that are created and managed elsewhere",
    ],
    howItWorks: [
      "The container holds references to parts passed in from outside",
      "Parts are created independently, often injected",
      "Removing the container leaves parts intact",
      "Parts may belong to multiple containers",
    ],
    pros: [
      "Models shared membership accurately",
      "Parts are reusable across containers",
      "Loose lifecycle coupling",
    ],
    cons: [
      "In code it often looks identical to association, causing ambiguity",
      "Shared parts can be mutated unexpectedly by other containers",
      "Unclear ownership complicates cleanup",
    ],
    interviewQuestions: [
      "Give an example of aggregation vs composition in the same domain.",
      "How is aggregation drawn in UML?",
      "Does the distinction between aggregation and composition matter in garbage-collected languages?",
    ],
    related: ["composition", "association", "uml-class-diagrams", "dependency"],
    example: {
      language: "python",
      code: `class Player:
    def __init__(self, name: str):
        self.name = name

class Team:
    def __init__(self, name: str):
        self.name = name
        self.players: list[Player] = []

    def sign(self, player: Player) -> None:
        self.players.append(player)      # player created elsewhere

    def release(self, player: Player) -> None:
        self.players.remove(player)      # player keeps existing

alice = Player("Alice")
red, blue = Team("Red"), Team("Blue")
red.sign(alice)
red.release(alice)
blue.sign(alice)   # same object, new team; no lifecycle tie`,
    },
  },
  {
    id: "dependency",
    track: "lld",
    category: "oop",
    name: "Dependency",
    summary: "The weakest relationship: one class uses another temporarily, e.g. as a method parameter, local variable, or return type.",
    why: "Recognizing dependencies helps you minimize them; every dependency is a reason a class might need to change.",
    whenToUse: [
      "A class needs another only within a single method call",
      "Passing a collaborator as an argument instead of storing it",
      "Analyzing coupling and change impact in a design",
    ],
    howItWorks: [
      "The dependent class references the other type in a method signature or body",
      "No long-lived field reference is kept",
      "A change in the used class's interface may require changing the user",
      "In UML it is shown as a dashed arrow toward the used class",
    ],
    pros: [
      "Lightest form of coupling",
      "Makes collaborators explicit in method signatures",
      "Easy to substitute in tests by passing a different argument",
    ],
    cons: [
      "Hidden dependencies (static calls, new inside methods) hurt testability",
      "Many dependencies signal low cohesion",
      "Depending on concrete classes rather than abstractions spreads change",
    ],
    interviewQuestions: [
      "How does a dependency differ from an association?",
      "What is a hidden dependency and why is it harmful?",
      "How do you depict dependency in a UML class diagram?",
    ],
    related: ["association", "dependency-injection", "dependency-inversion", "low-coupling"],
    example: {
      language: "java",
      code: `public class InvoicePrinter {
    // Depends on Invoice and Formatter only for the duration of the call
    public String print(Invoice invoice, Formatter formatter) {
        StringBuilder sb = new StringBuilder();
        sb.append(formatter.header(invoice.getId()));
        for (LineItem item : invoice.getItems()) {
            sb.append(formatter.line(item));
        }
        return sb.toString();
    }
}
// UML: InvoicePrinter - - -> Invoice, InvoicePrinter - - -> Formatter`,
    },
  },

  // ───────────────────────────── Principles ─────────────────────────────
  {
    id: "single-responsibility",
    track: "lld",
    category: "principles",
    name: "Single Responsibility Principle (SRP)",
    summary: "A class should have one reason to change, meaning it should serve a single actor or concern.",
    why: "Mixing concerns means a change for one stakeholder can break another; separating them localizes change and simplifies testing.",
    whenToUse: [
      "A class mixes business logic with persistence, formatting, or I/O",
      "A class keeps growing and is edited for unrelated reasons",
      "Tests for one behavior require setting up unrelated dependencies",
    ],
    howItWorks: [
      "List the reasons the class might change (who requests changes)",
      "Group methods by those reasons",
      "Extract each group into its own class with a clear name",
      "Have a coordinator or the caller compose them",
    ],
    pros: [
      "Smaller, focused, easier-to-read classes",
      "Changes are isolated to one place",
      "Simpler unit tests",
    ],
    cons: [
      "Over-splitting creates many trivial classes and indirection",
      "\"One responsibility\" is subjective; teams can argue endlessly",
      "Can scatter a simple feature across too many files",
    ],
    interviewQuestions: [
      "What does \"one reason to change\" really mean?",
      "Identify SRP violations in a class that validates, saves, and emails a user.",
      "How do you avoid over-applying SRP?",
      "How does SRP relate to cohesion?",
    ],
    related: ["high-cohesion", "open-closed", "class-design", "low-coupling"],
    example: {
      language: "java",
      code: `// Before: one class handles calculation, persistence, and formatting
class ReportBad {
    double calculateTotal() { /* ... */ return 0; }
    void saveToDb() { /* ... */ }
    String toHtml() { /* ... */ return ""; }
}

// After: each class has a single reason to change
class ReportCalculator {
    double total(Report r) { /* business rules */ return 0; }
}
class ReportRepository {
    void save(Report r) { /* persistence */ }
}
class HtmlReportFormatter {
    String format(Report r) { /* presentation */ return ""; }
}`,
    },
  },
  {
    id: "open-closed",
    track: "lld",
    category: "principles",
    name: "Open/Closed Principle (OCP)",
    summary: "Software entities should be open for extension but closed for modification: add new behavior by adding code, not editing working code.",
    why: "Editing stable, tested code to add features risks regressions; extension points let new variants plug in safely.",
    whenToUse: [
      "A switch/if-chain on a type that grows with every new feature",
      "Pluggable rules: pricing, discounts, payment methods, notification channels",
      "Libraries or frameworks consumed by other teams",
    ],
    howItWorks: [
      "Identify the axis of variation that keeps changing",
      "Introduce an abstraction (interface) for that variation",
      "Move each variant into its own implementation",
      "Have the core code depend only on the abstraction; register new variants",
    ],
    pros: [
      "New features with minimal risk to existing code",
      "Encourages pluggable, testable designs",
      "Pairs naturally with Strategy and Decorator",
    ],
    cons: [
      "Guessing future variation leads to speculative abstractions",
      "More classes and indirection",
      "Not every change can be anticipated; sometimes modification is right",
    ],
    interviewQuestions: [
      "Refactor a discount calculator with a switch on customer type to follow OCP.",
      "Which design patterns help achieve OCP?",
      "Is it possible to be fully closed for modification? Why not?",
    ],
    related: ["polymorphism", "single-responsibility", "dependency-inversion", "interface-design", "yagni"],
    example: {
      language: "java",
      code: `// Before: every new type means editing this method
// double discount(String type) { switch (type) { case "VIP": ... } }

// After: add a new DiscountPolicy class; calculator never changes
interface DiscountPolicy {
    double apply(double amount);
}
class NoDiscount implements DiscountPolicy {
    public double apply(double a) { return a; }
}
class VipDiscount implements DiscountPolicy {
    public double apply(double a) { return a * 0.8; }
}
class Checkout {
    private final DiscountPolicy policy;
    Checkout(DiscountPolicy policy) { this.policy = policy; }
    double total(double amount) { return policy.apply(amount); }
}`,
    },
  },
  {
    id: "liskov-substitution",
    track: "lld",
    category: "principles",
    name: "Liskov Substitution Principle (LSP)",
    summary: "Objects of a subtype must be usable anywhere the base type is expected without breaking correctness.",
    why: "If subclasses change expected behavior, polymorphism becomes unsafe and callers must special-case types.",
    whenToUse: [
      "Designing any inheritance hierarchy or interface implementations",
      "A subclass throws UnsupportedOperationException for inherited methods",
      "Callers use instanceof checks to handle certain subclasses",
    ],
    howItWorks: [
      "Do not strengthen preconditions in a subtype",
      "Do not weaken postconditions or break invariants of the base",
      "Do not throw new unexpected exceptions from overrides",
      "If a subtype cannot honor the contract, change the hierarchy (split the interface or use composition)",
    ],
    pros: [
      "Polymorphism is safe and predictable",
      "Removes instanceof special-casing",
      "Leads to more accurate abstractions",
    ],
    cons: [
      "Contracts are often implicit, making violations hard to spot",
      "Fixing violations may require restructuring hierarchies",
      "Can push toward many fine-grained interfaces",
    ],
    interviewQuestions: [
      "Why does Square extending Rectangle violate LSP?",
      "Why does a Penguin extending Bird with fly() violate LSP, and how do you fix it?",
      "How do preconditions and postconditions relate to LSP?",
      "How does LSP relate to interface segregation?",
    ],
    related: ["inheritance", "polymorphism", "interface-segregation", "composition-over-inheritance"],
    example: {
      language: "java",
      code: `// Violation: Penguin cannot honor Bird.fly()
// class Bird { void fly() {} }
// class Penguin extends Bird { void fly() { throw new UnsupportedOperationException(); } }

// Compliant: only birds that can fly promise to fly
interface Bird {
    void eat();
}
interface FlyingBird extends Bird {
    void fly();
}
class Sparrow implements FlyingBird {
    public void eat() { }
    public void fly() { }
}
class Penguin implements Bird {
    public void eat() { }
}
// Any FlyingBird can be substituted safely wherever fly() is called`,
    },
  },
  {
    id: "interface-segregation",
    track: "lld",
    category: "principles",
    name: "Interface Segregation Principle (ISP)",
    summary: "Clients should not be forced to depend on methods they do not use; prefer several small, role-specific interfaces over one fat interface.",
    why: "Fat interfaces force implementers to stub irrelevant methods and couple clients to changes they do not care about.",
    whenToUse: [
      "Implementers leave methods empty or throw UnsupportedOperationException",
      "Different clients use disjoint subsets of an interface",
      "An interface keeps growing with unrelated methods",
    ],
    howItWorks: [
      "Group interface methods by the client role that uses them",
      "Split into small interfaces named for those roles",
      "Let classes implement only the interfaces they support",
      "Have clients depend on the narrowest interface they need",
    ],
    pros: [
      "No dummy implementations",
      "Clients are insulated from unrelated changes",
      "Clearer contracts and easier mocking",
    ],
    cons: [
      "Too many tiny interfaces fragment the API",
      "Can be harder to discover what a class supports",
      "Over-segregation adds naming and wiring overhead",
    ],
    interviewQuestions: [
      "Split a Machine interface with print, scan, and fax for a basic printer.",
      "How does ISP help with LSP violations?",
      "What is the difference between ISP and SRP?",
    ],
    related: ["interface-design", "liskov-substitution", "single-responsibility", "low-coupling"],
    example: {
      language: "java",
      code: `// Before: one fat interface forces stubs
// interface Machine { void print(Doc d); void scan(Doc d); void fax(Doc d); }

// After: role interfaces
interface Printer { void print(Doc d); }
interface Scanner { void scan(Doc d); }
interface Fax     { void fax(Doc d); }

class BasicPrinter implements Printer {
    public void print(Doc d) { /* ... */ }
}

class OfficeMachine implements Printer, Scanner, Fax {
    public void print(Doc d) { /* ... */ }
    public void scan(Doc d)  { /* ... */ }
    public void fax(Doc d)   { /* ... */ }
}`,
    },
  },
  {
    id: "dependency-inversion",
    track: "lld",
    category: "principles",
    name: "Dependency Inversion Principle (DIP)",
    summary: "High-level modules should not depend on low-level modules; both should depend on abstractions, and abstractions should be owned by the high-level policy.",
    why: "It keeps business logic independent of infrastructure details like databases or APIs, so those can change without touching core logic.",
    whenToUse: [
      "Business logic directly instantiates a database client or HTTP client",
      "You need to swap infrastructure (MySQL to Postgres, SMTP to a vendor)",
      "Core logic must be unit-testable without real I/O",
    ],
    howItWorks: [
      "Define an interface in terms the high-level module needs (e.g. OrderRepository)",
      "Make the high-level class depend only on that interface",
      "Implement the interface in a low-level adapter (JdbcOrderRepository)",
      "Wire the concrete implementation at the composition root, typically via DI",
    ],
    pros: [
      "Decouples policy from mechanism",
      "Easy testing with fakes",
      "Infrastructure becomes replaceable",
    ],
    cons: [
      "Interfaces for everything adds indirection",
      "Abstractions designed around the low-level API defeat the purpose",
      "Wiring can become complex without a DI container",
    ],
    interviewQuestions: [
      "What is being \"inverted\" in DIP?",
      "How is DIP different from dependency injection?",
      "Who should own the interface: the high-level or low-level module?",
      "Apply DIP to a NotificationService that uses an email client directly.",
    ],
    related: ["dependency-injection", "abstraction", "low-coupling", "open-closed"],
    example: {
      language: "java",
      code: `// Abstraction owned by the business layer
interface OrderRepository {
    void save(Order order);
}

// High-level policy depends only on the abstraction
class OrderService {
    private final OrderRepository repo;
    OrderService(OrderRepository repo) { this.repo = repo; }

    void place(Order order) {
        order.validate();
        repo.save(order);
    }
}

// Low-level detail implements the abstraction
class JdbcOrderRepository implements OrderRepository {
    public void save(Order order) { /* SQL insert */ }
}`,
    },
  },
  {
    id: "dry",
    track: "lld",
    category: "principles",
    name: "DRY (Don't Repeat Yourself)",
    summary: "Every piece of knowledge should have a single, authoritative representation in the system.",
    why: "Duplicated logic drifts: a fix applied in one copy but not another causes subtle bugs.",
    whenToUse: [
      "The same business rule is implemented in multiple places",
      "Copy-pasted validation or formatting logic",
      "Constants or configuration repeated as magic values",
    ],
    howItWorks: [
      "Spot duplicated knowledge, not just similar-looking code",
      "Extract it into a function, class, or constant with a meaningful name",
      "Replace all copies with references to the single source",
      "Wait for a third occurrence (rule of three) if unsure the duplication is real",
    ],
    pros: [
      "Fix bugs once",
      "Consistent behavior across the codebase",
      "Less code to maintain",
    ],
    cons: [
      "Merging code that is only coincidentally similar creates bad coupling",
      "Premature extraction leads to flag-heavy, hard-to-read helpers",
      "Shared utilities can become dumping grounds",
    ],
    interviewQuestions: [
      "Is all duplicated code a DRY violation? Explain incidental vs real duplication.",
      "What is the rule of three?",
      "How can over-applying DRY increase coupling?",
    ],
    related: ["kiss", "yagni", "single-responsibility", "high-cohesion"],
    example: {
      language: "python",
      code: `# Before: the same tax rule lives in two places
def invoice_total(items):
    return sum(i.price for i in items) * 1.18

def cart_preview(items):
    return sum(i.price for i in items) * 1.18   # will drift

# After: one authoritative definition
TAX_RATE = 0.18

def with_tax(amount: float) -> float:
    return amount * (1 + TAX_RATE)

def invoice_total(items):
    return with_tax(sum(i.price for i in items))

def cart_preview(items):
    return with_tax(sum(i.price for i in items))`,
    },
  },
  {
    id: "kiss",
    track: "lld",
    category: "principles",
    name: "KISS (Keep It Simple, Stupid)",
    summary: "Prefer the simplest design that correctly solves the problem; avoid unnecessary cleverness and complexity.",
    why: "Simple code is easier to read, debug, and change, and in interviews it communicates clear thinking.",
    whenToUse: [
      "Choosing between a straightforward solution and a clever one",
      "Early in an LLD interview before adding patterns",
      "Code reviews where abstractions outnumber use cases",
    ],
    howItWorks: [
      "Start with the most direct solution that meets requirements",
      "Use standard library and familiar idioms over custom machinery",
      "Add abstractions only when a concrete need appears",
      "Refactor to simplify when complexity creeps in",
    ],
    pros: [
      "Easier onboarding and maintenance",
      "Fewer bugs and edge cases",
      "Faster delivery",
    ],
    cons: [
      "\"Simple\" can be misused to justify skipping necessary structure",
      "Overly simple designs may need rework as requirements grow",
      "Simplicity is subjective across teams",
    ],
    interviewQuestions: [
      "How do you balance KISS with designing for extensibility?",
      "Give an example where a design pattern made code worse.",
      "How do KISS and YAGNI differ?",
    ],
    related: ["yagni", "dry", "high-cohesion", "class-design"],
    example: {
      language: "java",
      code: `// Over-engineered: factory + strategy just to check even numbers
// ParityCheckerFactory.create(ParityType.EVEN).check(n);

// Simple and clear
static boolean isEven(int n) {
    return n % 2 == 0;
}

// Prefer the standard library over hand-rolled loops
static int maxOf(List<Integer> xs) {
    return Collections.max(xs);
}`,
    },
  },
  {
    id: "yagni",
    track: "lld",
    category: "principles",
    name: "YAGNI (You Aren't Gonna Need It)",
    summary: "Do not build functionality or abstractions until there is an actual, present need for them.",
    why: "Speculative features cost time, add complexity, and are often wrong when the real requirement finally arrives.",
    whenToUse: [
      "Tempted to add config options or plugin systems \"just in case\"",
      "Designing interfaces with a single foreseeable implementation",
      "Scoping an LLD interview answer to stated requirements",
    ],
    howItWorks: [
      "Implement only the current, confirmed requirements",
      "Keep code clean and tested so it is cheap to extend later",
      "Note likely extensions verbally or in docs rather than in code",
      "Add the abstraction when the second real use case appears",
    ],
    pros: [
      "Less code and less maintenance",
      "Faster delivery of real value",
      "Designs shaped by real needs rather than guesses",
    ],
    cons: [
      "Ignoring known near-term requirements causes expensive rework",
      "Some decisions (public APIs, data schemas) are costly to change later",
      "Can be used as an excuse for poor structure",
    ],
    interviewQuestions: [
      "How do YAGNI and OCP coexist?",
      "When is it worth designing for future requirements anyway?",
      "How would you discuss extensibility in an interview without over-building?",
    ],
    related: ["kiss", "dry", "open-closed", "class-design"],
    example: {
      language: "python",
      code: `# Speculative: plugin registry, config flags, and exporters nobody asked for
# class ExporterRegistry: ...
# def export(data, fmt="csv", compress=False, encrypt=False, cloud=None): ...

# YAGNI: requirement is "export to CSV" - build exactly that
import csv

def export_csv(rows: list[dict], path: str) -> None:
    if not rows:
        return
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)`,
    },
  },
  {
    id: "high-cohesion",
    track: "lld",
    category: "principles",
    name: "High Cohesion",
    summary: "The elements inside a module or class are closely related and work together toward a single, well-defined purpose.",
    why: "Cohesive classes are easier to understand, reuse, and change because related logic lives together.",
    whenToUse: [
      "Deciding where a new method belongs",
      "A class named Manager, Helper, or Utils accumulates unrelated methods",
      "Splitting a large class into meaningful parts",
    ],
    howItWorks: [
      "Check whether each method uses the class's own fields",
      "Group methods that operate on the same data and concept",
      "Move methods that mostly use another class's data into that class",
      "Name classes precisely; a vague name often signals low cohesion",
    ],
    pros: [
      "Easier comprehension and navigation",
      "Changes stay localized",
      "Naturally leads to low coupling",
    ],
    cons: [
      "Chasing perfect cohesion can create many tiny classes",
      "Requires judgment about what belongs together",
      "Refactoring for cohesion can be disruptive in large codebases",
    ],
    interviewQuestions: [
      "What is the relationship between cohesion and coupling?",
      "How do you detect low cohesion in a class?",
      "How does SRP relate to high cohesion?",
    ],
    related: ["low-coupling", "single-responsibility", "encapsulation", "class-design"],
    example: {
      language: "java",
      code: `// Low cohesion: unrelated responsibilities in one bag
// class Utils { sendEmail(); parseDate(); computeTax(); resizeImage(); }

// High cohesion: everything here is about a ParkingSpot's occupancy
class ParkingSpot {
    private final String id;
    private final SpotSize size;
    private Vehicle parked;

    ParkingSpot(String id, SpotSize size) { this.id = id; this.size = size; }

    boolean isFree() { return parked == null; }
    boolean fits(Vehicle v) { return isFree() && v.size().compareTo(size) <= 0; }
    void park(Vehicle v) {
        if (!fits(v)) throw new IllegalStateException("spot unavailable");
        parked = v;
    }
    void vacate() { parked = null; }
}`,
    },
  },
  {
    id: "low-coupling",
    track: "lld",
    category: "principles",
    name: "Low Coupling",
    summary: "Modules depend on each other as little as possible, and only through narrow, stable interfaces.",
    why: "Tightly coupled code means a change ripples across many classes; low coupling keeps change local and enables independent testing.",
    whenToUse: [
      "A change in one class forces edits in many others",
      "Classes reach through chains like a.getB().getC().doX()",
      "Components need to be tested or deployed independently",
    ],
    howItWorks: [
      "Depend on interfaces, not concrete classes",
      "Pass collaborators in rather than constructing them internally",
      "Follow the Law of Demeter: talk to immediate collaborators only",
      "Use events or callbacks to decouple producers from consumers",
    ],
    pros: [
      "Localized changes and fewer regressions",
      "Easier unit testing with substitutes",
      "Components are reusable in other contexts",
    ],
    cons: [
      "Excess indirection makes flow harder to follow",
      "Event-based decoupling hides control flow",
      "Some coupling is inherent; eliminating it entirely is impossible",
    ],
    interviewQuestions: [
      "What is the Law of Demeter?",
      "How do you measure or recognize tight coupling?",
      "How does dependency injection reduce coupling?",
      "Describe the trade-off between coupling and simplicity.",
    ],
    related: ["high-cohesion", "dependency-injection", "dependency-inversion", "interface-design"],
    example: {
      language: "java",
      code: `// Tight: knows the internals of three classes
// double fee = ticket.getSpot().getFloor().getRateCard().hourly() * hours;

// Loose: ask the collaborator, depend on an interface
interface PricingPolicy {
    long feeFor(Ticket ticket, Duration parked);
}

class ExitGate {
    private final PricingPolicy pricing;

    ExitGate(PricingPolicy pricing) { this.pricing = pricing; }

    long checkout(Ticket ticket, Instant exitTime) {
        Duration parked = Duration.between(ticket.entryTime(), exitTime);
        return pricing.feeFor(ticket, parked);
    }
}`,
    },
  },
  {
    id: "dependency-injection",
    track: "lld",
    category: "principles",
    name: "Dependency Injection (DI)",
    summary: "A technique where an object receives its collaborators from the outside (constructor, setter, or method) rather than creating them itself.",
    why: "It makes dependencies explicit and replaceable, which is the practical way to achieve DIP and testable code.",
    whenToUse: [
      "A class news up databases, clients, or clocks internally",
      "You need to unit-test with fakes or mocks",
      "Multiple environments require different implementations",
    ],
    howItWorks: [
      "Declare dependencies as constructor parameters typed by interfaces",
      "Store them in final fields",
      "Construct and wire the object graph at a composition root (main, DI container)",
      "Inject test doubles in tests",
    ],
    pros: [
      "Explicit, visible dependencies",
      "Excellent testability",
      "Easy to swap implementations per environment",
    ],
    cons: [
      "Large constructors can reveal (or hide) too many responsibilities",
      "DI containers add magic and runtime errors",
      "Overuse for trivial value objects adds noise",
    ],
    interviewQuestions: [
      "Compare constructor, setter, and field injection.",
      "How is DI related to the Dependency Inversion Principle?",
      "What is a composition root?",
      "Is a Service Locator the same as DI?",
    ],
    related: ["dependency-inversion", "low-coupling", "dependency", "abstraction"],
    example: {
      language: "java",
      code: `interface Clock { Instant now(); }

class TokenService {
    private final Clock clock;
    private final Duration ttl;

    // Dependencies injected via constructor
    TokenService(Clock clock, Duration ttl) {
        this.clock = clock;
        this.ttl = ttl;
    }

    boolean isExpired(Instant issuedAt) {
        return clock.now().isAfter(issuedAt.plus(ttl));
    }
}

// Composition root
TokenService prod = new TokenService(Instant::now, Duration.ofHours(1));
// Test: fixed clock, deterministic result
TokenService test = new TokenService(() -> Instant.parse("2024-01-01T02:00:00Z"), Duration.ofHours(1));`,
    },
  },

  // ───────────────────────────── UML & Class Design ─────────────────────────────
  {
    id: "uml-class-diagrams",
    track: "lld",
    category: "uml-design",
    name: "UML Class Diagrams",
    summary: "A static diagram showing classes, their attributes and methods, and the relationships between them (inheritance, realization, association, aggregation, composition, dependency).",
    why: "It communicates a design quickly and unambiguously, which is often the first deliverable in an LLD interview.",
    whenToUse: [
      "Starting an LLD interview after clarifying requirements",
      "Reviewing a design with teammates before coding",
      "Documenting relationships and multiplicities in a domain model",
    ],
    howItWorks: [
      "Draw each class as a box: name, attributes (+ public, - private, # protected), methods",
      "Mark interfaces and abstract classes",
      "Connect with the correct arrow: hollow triangle for inheritance, dashed hollow triangle for realization",
      "Use filled diamond for composition, hollow diamond for aggregation, plain line for association, dashed arrow for dependency",
      "Annotate multiplicities like 1, 0..1, 1..*, *",
    ],
    pros: [
      "Shared, standard visual vocabulary",
      "Exposes coupling and missing abstractions early",
      "Fast to sketch and iterate",
    ],
    cons: [
      "Can drift from code if treated as long-lived documentation",
      "Too much detail clutters the diagram",
      "Static view only; does not show runtime flow (use sequence diagrams)",
    ],
    interviewQuestions: [
      "Draw the arrows for inheritance, realization, composition, and aggregation.",
      "How do you show multiplicity between a ParkingLot and its Floors?",
      "What level of detail should a class diagram have in a 45-minute interview?",
    ],
    related: ["class-design", "composition", "aggregation", "association", "interface-design"],
    example: {
      language: "java",
      code: `// UML (text form) for a parking lot:
//   ParkingLot  <>------ 1..*  Floor          (composition, filled diamond)
//   Floor       <>------ 1..*  ParkingSpot    (composition)
//   ParkingSpot ------- 0..1   Vehicle        (association)
//   Car --|> Vehicle                          (inheritance)
//   HourlyPricing ..|> PricingPolicy          (realization)

abstract class Vehicle { protected String plate; }
class Car extends Vehicle { }

interface PricingPolicy { long fee(Ticket t); }
class HourlyPricing implements PricingPolicy {
    public long fee(Ticket t) { return 0; }
}

class ParkingSpot { private Vehicle parked; }
class Floor { private final List<ParkingSpot> spots = new ArrayList<>(); }
class ParkingLot { private final List<Floor> floors = new ArrayList<>(); }`,
    },
  },
  {
    id: "class-design",
    track: "lld",
    category: "uml-design",
    name: "Class Design",
    summary: "The process of identifying entities, their responsibilities, state, and collaborations, then shaping them into clean classes.",
    why: "Good class boundaries determine how easy the system is to extend and test; it is the core skill LLD interviews evaluate.",
    whenToUse: [
      "Translating requirements into code structure",
      "Refactoring a god class into collaborating objects",
      "Deciding between entity, value object, and service classes",
    ],
    howItWorks: [
      "Extract nouns from requirements as candidate entities; verbs as candidate methods",
      "Assign each responsibility to the class that owns the needed data",
      "Distinguish entities (identity), value objects (immutable), and services (stateless operations)",
      "Define relationships and multiplicities; keep public APIs small",
      "Validate the design by walking through key use cases",
    ],
    pros: [
      "Clear mapping from requirements to code",
      "Supports extension without rewrites",
      "Makes responsibilities and ownership explicit",
    ],
    cons: [
      "Noun extraction can produce anemic or unnecessary classes",
      "Over-modeling slows delivery and confuses interviewers",
      "Early boundaries may need revisiting as requirements change",
    ],
    interviewQuestions: [
      "Walk through how you identify classes for a library management system.",
      "What is an anemic domain model and why is it criticized?",
      "When should a class be immutable?",
      "Entity vs value object: how do you decide?",
    ],
    related: ["uml-class-diagrams", "encapsulation", "high-cohesion", "single-responsibility", "interface-design"],
    example: {
      language: "java",
      code: `// Value object: immutable, equality by value
record Money(long cents, String currency) {
    Money plus(Money o) {
        if (!currency.equals(o.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(cents + o.cents, currency);
    }
}

// Entity: has identity and lifecycle, owns its rules
class Book {
    private final String isbn;
    private boolean onLoan;

    Book(String isbn) { this.isbn = isbn; }

    void checkout() {
        if (onLoan) throw new IllegalStateException("already on loan");
        onLoan = true;
    }
}

// Service: stateless coordination across entities
class LoanService {
    void lend(Book book, Member member) { book.checkout(); member.addLoan(book); }
}`,
    },
  },
  {
    id: "interface-design",
    track: "lld",
    category: "uml-design",
    name: "Interface Design",
    summary: "Defining small, intention-revealing contracts that describe what a component does, independent of how it does it.",
    why: "Well-designed interfaces are the seams that enable substitution, testing, and parallel development.",
    whenToUse: [
      "There are or will clearly be multiple implementations",
      "Defining a boundary between business logic and infrastructure",
      "Exposing a module to other teams or modules",
    ],
    howItWorks: [
      "Name the interface for the role it plays (PaymentProcessor, not PaymentHelper)",
      "Keep methods minimal and cohesive; follow ISP",
      "Use domain types in signatures rather than primitives or vendor types",
      "Document the contract: preconditions, return semantics, errors",
    ],
    pros: [
      "Enables polymorphism and dependency inversion",
      "Simplifies mocking and testing",
      "Stable contracts reduce churn for consumers",
    ],
    cons: [
      "Interfaces with a single implementation may be needless ceremony",
      "Leaking implementation details into signatures couples clients",
      "Changing a widely used interface is expensive",
    ],
    interviewQuestions: [
      "Design the interface for a pluggable payment processor.",
      "Interface vs abstract class: when do you pick each?",
      "How do default methods in Java interfaces affect design?",
    ],
    related: ["interface-segregation", "abstraction", "dependency-inversion", "polymorphism"],
    example: {
      language: "java",
      code: `// Role-named, minimal, uses domain types, explicit outcomes
public interface PaymentProcessor {
    PaymentResult charge(PaymentRequest request);
    RefundResult refund(String paymentId, Money amount);
}

public record PaymentRequest(String orderId, Money amount, String idempotencyKey) { }

public sealed interface PaymentResult permits Approved, Declined { }
public record Approved(String paymentId) implements PaymentResult { }
public record Declined(String reason) implements PaymentResult { }

// Implementations hide vendor SDKs behind the contract
public class CardProcessor implements PaymentProcessor {
    public PaymentResult charge(PaymentRequest r) { /* vendor call */ return new Approved("p1"); }
    public RefundResult refund(String id, Money amt) { /* ... */ return null; }
}`,
    },
  },
  {
    id: "composition-over-inheritance",
    track: "lld",
    category: "uml-design",
    name: "Composition over Inheritance",
    summary: "Prefer building behavior by combining objects (has-a) over extending classes (is-a), reserving inheritance for true, stable subtyping.",
    why: "Inheritance hierarchies explode combinatorially and couple subclasses to parents; composition lets behaviors vary independently and change at runtime.",
    whenToUse: [
      "Behaviors vary along multiple independent axes (fly style, quack style)",
      "You see subclass explosion like FlyingSwimmingRobotDuck",
      "Behavior must change at runtime",
      "You want to reuse code across unrelated hierarchies",
    ],
    howItWorks: [
      "Identify behaviors that vary independently",
      "Extract each into an interface with small implementations",
      "Have the main class hold references to these behavior objects",
      "Delegate calls to them; inject or swap them as needed",
    ],
    pros: [
      "Avoids deep, brittle hierarchies",
      "Mix and match behaviors without new subclasses",
      "Runtime flexibility and easier testing",
      "Underlies Strategy, Decorator, and State patterns",
    ],
    cons: [
      "More objects and delegation boilerplate",
      "Harder to see full behavior in one place",
      "Overkill when a simple, stable is-a relationship exists",
    ],
    interviewQuestions: [
      "Why is composition often preferred over inheritance?",
      "Refactor a Duck hierarchy with flying and non-flying variants using composition.",
      "When is inheritance still the better choice?",
      "Which design patterns rely on composition?",
    ],
    related: ["composition", "inheritance", "liskov-substitution", "polymorphism", "low-coupling"],
    example: {
      language: "java",
      code: `// Instead of RubberDuck, WoodenDuck, RobotFlyingDuck subclasses...
interface FlyBehavior   { String fly(); }
interface QuackBehavior { String quack(); }

class FlyWithWings implements FlyBehavior { public String fly() { return "flap"; } }
class NoFly        implements FlyBehavior { public String fly() { return "..."; } }
class Squeak       implements QuackBehavior { public String quack() { return "squeak"; } }

class Duck {
    private FlyBehavior fly;
    private final QuackBehavior quack;

    Duck(FlyBehavior fly, QuackBehavior quack) { this.fly = fly; this.quack = quack; }

    String performFly()   { return fly.fly(); }      // delegate
    String performQuack() { return quack.quack(); }
    void setFly(FlyBehavior f) { this.fly = f; }     // change at runtime
}

Duck rubber = new Duck(new NoFly(), new Squeak());`,
    },
  },
];
