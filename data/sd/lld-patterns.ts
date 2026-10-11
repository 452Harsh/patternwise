import type { LLDPattern } from "./types";

/** Gang-of-Four design patterns for the LLD track. Order follows LLD_PATTERN_IDS. */
export const LLD_PATTERNS: LLDPattern[] = [
  // ───────────────────────────── Creational ─────────────────────────────
  {
    id: "factory-method",
    name: "Factory Method",
    category: "creational",
    intent:
      "Define an interface for creating an object, but let subclasses decide which concrete class to instantiate. The creator works with products only through their common interface.",
    problem:
      "Code that calls new on concrete classes directly is tightly coupled to them, so adding a new product type means editing every place that creates objects. You want creation to vary while the surrounding workflow stays the same.",
    whenToUse: [
      "A class cannot anticipate which concrete product it will need to create.",
      "You want subclasses or plugins to extend which objects a framework creates.",
      "The creation logic should be isolated from the business logic that uses the product.",
      "You expect to add new product variants (e.g. a new notification channel) over time.",
    ],
    whenNotToUse: [
      "There is only one concrete product and no realistic prospect of another.",
      "A simple constructor call or a static helper is clear enough.",
      "Introducing a parallel creator hierarchy would add more classes than it saves.",
    ],
    uml: {
      classes: [
        { name: "Notification", kind: "interface", attributes: [], methods: ["+ send(message: String): void"] },
        { name: "EmailNotification", kind: "class", attributes: [], methods: ["+ send(message: String): void"] },
        { name: "SmsNotification", kind: "class", attributes: [], methods: ["+ send(message: String): void"] },
        {
          name: "NotificationCreator",
          kind: "abstract",
          attributes: [],
          methods: ["# createNotification(): Notification", "+ notifyUser(message: String): void"],
        },
        { name: "EmailCreator", kind: "class", attributes: [], methods: ["# createNotification(): Notification"] },
        { name: "SmsCreator", kind: "class", attributes: [], methods: ["# createNotification(): Notification"] },
      ],
      relations: [
        { from: "EmailNotification", to: "Notification", type: "realization" },
        { from: "SmsNotification", to: "Notification", type: "realization" },
        { from: "EmailCreator", to: "NotificationCreator", type: "inheritance" },
        { from: "SmsCreator", to: "NotificationCreator", type: "inheritance" },
        { from: "NotificationCreator", to: "Notification", type: "dependency", label: "uses" },
        { from: "EmailCreator", to: "EmailNotification", type: "dependency", label: "creates" },
        { from: "SmsCreator", to: "SmsNotification", type: "dependency", label: "creates" },
      ],
    },
    example:
      "Python's __iter__() is a factory method: each collection class returns its own iterator object. UI frameworks also use it so each platform's dialog creates its own native buttons.",
    advantages: [
      "Decouples client code from concrete product classes.",
      "Follows the Open/Closed Principle: add products by adding creators, not editing callers.",
      "Puts creation code in one place (Single Responsibility).",
      "Lets frameworks expose extension points for subclasses.",
    ],
    disadvantages: [
      "Can lead to a parallel hierarchy of creator subclasses.",
      "Adds indirection that can be overkill for simple object creation.",
      "Subclassing just to change one created type is heavier than passing a function or class reference.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Notification(ABC):
    @abstractmethod
    def send(self, message: str) -> None: ...


class EmailNotification(Notification):
    def send(self, message: str) -> None:
        print("Email:", message)


class SmsNotification(Notification):
    def send(self, message: str) -> None:
        print("SMS:", message)


class NotificationCreator(ABC):
    @abstractmethod
    def create_notification(self) -> Notification:
        """The factory method: subclasses pick the concrete product."""

    def notify_user(self, message: str) -> None:
        notification = self.create_notification()
        notification.send(message)


class EmailCreator(NotificationCreator):
    def create_notification(self) -> Notification:
        return EmailNotification()


class SmsCreator(NotificationCreator):
    def create_notification(self) -> Notification:
        return SmsNotification()


if __name__ == "__main__":
    for creator in (EmailCreator(), SmsCreator()):
        creator.notify_user("Your order has shipped")`,
    },
    related: ["abstract-factory", "template-method", "prototype"],
    problems: ["notification-service-lld", "parking-lot", "car-rental"],
  },
  {
    id: "abstract-factory",
    name: "Abstract Factory",
    category: "creational",
    intent:
      "Provide an interface for creating families of related or dependent objects without specifying their concrete classes.",
    problem:
      "A system must work with several families of products (e.g. light and dark UI widgets) and must never mix products from different families. Hard-coding concrete classes scatters family decisions across the codebase.",
    whenToUse: [
      "Products come in families that must be used together consistently.",
      "You want to swap an entire family (theme, platform, vendor) via configuration.",
      "Client code should depend only on product interfaces, not concrete classes.",
      "You are building a library and want to reveal only interfaces, not implementations.",
    ],
    whenNotToUse: [
      "There is only one product family, or products are unrelated to each other.",
      "New product types are added often: each one forces a change to every factory.",
      "A single Factory Method or simple constructor would do the job.",
    ],
    uml: {
      classes: [
        {
          name: "GUIFactory",
          kind: "interface",
          attributes: [],
          methods: ["+ createButton(): Button", "+ createCheckbox(): Checkbox"],
        },
        {
          name: "LightFactory",
          kind: "class",
          attributes: [],
          methods: ["+ createButton(): Button", "+ createCheckbox(): Checkbox"],
        },
        {
          name: "DarkFactory",
          kind: "class",
          attributes: [],
          methods: ["+ createButton(): Button", "+ createCheckbox(): Checkbox"],
        },
        { name: "Button", kind: "interface", attributes: [], methods: ["+ render(): String"] },
        { name: "Checkbox", kind: "interface", attributes: [], methods: ["+ render(): String"] },
        { name: "Application", kind: "class", attributes: ["- factory: GUIFactory"], methods: ["+ renderForm(): void"] },
      ],
      relations: [
        { from: "LightFactory", to: "GUIFactory", type: "realization" },
        { from: "DarkFactory", to: "GUIFactory", type: "realization" },
        { from: "GUIFactory", to: "Button", type: "dependency", label: "creates" },
        { from: "GUIFactory", to: "Checkbox", type: "dependency", label: "creates" },
        { from: "Application", to: "GUIFactory", type: "association", label: "uses" },
      ],
    },
    example:
      "Python's DB-API works this way: each driver module (sqlite3, psycopg) hands back its own family of connection and cursor objects. Cross-platform UI toolkits use one factory per OS to create matching native widgets.",
    advantages: [
      "Guarantees products from one family are compatible with each other.",
      "Isolates concrete classes from client code.",
      "Switching an entire family is a one-line change.",
      "Keeps creation code for a family in one place.",
    ],
    disadvantages: [
      "Adding a new product type requires changing the interface and every concrete factory.",
      "Introduces many interfaces and classes.",
      "Can be over-engineering when only one family exists today.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Button(ABC):
    @abstractmethod
    def render(self) -> str: ...


class Checkbox(ABC):
    @abstractmethod
    def render(self) -> str: ...


class LightButton(Button):
    def render(self) -> str:
        return "[Light Button]"


class LightCheckbox(Checkbox):
    def render(self) -> str:
        return "[Light Checkbox]"


class DarkButton(Button):
    def render(self) -> str:
        return "[Dark Button]"


class DarkCheckbox(Checkbox):
    def render(self) -> str:
        return "[Dark Checkbox]"


class GUIFactory(ABC):
    @abstractmethod
    def create_button(self) -> Button: ...

    @abstractmethod
    def create_checkbox(self) -> Checkbox: ...


class LightFactory(GUIFactory):
    def create_button(self) -> Button:
        return LightButton()

    def create_checkbox(self) -> Checkbox:
        return LightCheckbox()


class DarkFactory(GUIFactory):
    def create_button(self) -> Button:
        return DarkButton()

    def create_checkbox(self) -> Checkbox:
        return DarkCheckbox()


class Application:
    def __init__(self, factory: GUIFactory) -> None:
        self.factory = factory

    def render_form(self) -> None:
        print(self.factory.create_button().render(), self.factory.create_checkbox().render())


if __name__ == "__main__":
    dark_mode = True
    Application(DarkFactory() if dark_mode else LightFactory()).render_form()`,
    },
    related: ["factory-method", "builder", "singleton", "prototype"],
    problems: ["notification-service-lld", "chess"],
  },
  {
    id: "builder",
    name: "Builder",
    category: "creational",
    intent:
      "Separate the construction of a complex object from its representation so the same step-by-step process can create different configurations.",
    problem:
      "Objects with many optional parameters lead to telescoping constructors or half-initialised objects built through setters. You want readable, validated, step-by-step construction that ends in an immutable object.",
    whenToUse: [
      "A constructor would need many parameters, especially optional ones.",
      "You want the finished object to be immutable but built incrementally.",
      "Construction needs validation across several fields before the object exists.",
      "The same construction steps should produce different representations.",
    ],
    whenNotToUse: [
      "The object has only two or three required fields.",
      "The language offers named and default arguments that already solve readability (e.g. Python keyword arguments or Kotlin data classes).",
      "The object is mutable and simple setters are perfectly acceptable.",
    ],
    uml: {
      classes: [
        {
          name: "HttpRequest",
          kind: "class",
          attributes: ["- method: String", "- url: String", "- headers: Map", "- body: String", "- timeoutMs: int"],
          methods: ["~ HttpRequest(b: RequestBuilder)"],
        },
        {
          name: "RequestBuilder",
          kind: "class",
          attributes: ["- url: String", "- method: String", "- headers: Map", "- body: String", "- timeoutMs: int"],
          methods: [
            "+ method(m: String): RequestBuilder",
            "+ header(k: String, v: String): RequestBuilder",
            "+ body(b: String): RequestBuilder",
            "+ timeout(ms: int): RequestBuilder",
            "+ build(): HttpRequest",
          ],
        },
        { name: "Client", kind: "class", attributes: [], methods: ["+ main(): void"] },
      ],
      relations: [
        { from: "RequestBuilder", to: "HttpRequest", type: "dependency", label: "builds" },
        { from: "Client", to: "RequestBuilder", type: "dependency", label: "configures" },
      ],
    },
    example:
      "argparse.ArgumentParser (add arguments step by step, then parse_args()) and SQLAlchemy's select(...).where(...).order_by(...) are builders.",
    advantages: [
      "Readable, self-documenting construction with fluent method chaining.",
      "Produces immutable objects without telescoping constructors.",
      "Centralises validation in build().",
      "The same builder steps can produce different variants.",
    ],
    disadvantages: [
      "Doubles the number of classes and duplicates field declarations.",
      "Errors for missing required fields surface at runtime unless the builder enforces them in its constructor.",
      "Overkill for small objects.",
    ],
    code: {
      python: `from dataclasses import dataclass


@dataclass(frozen=True)
class HttpRequest:
    url: str
    method: str
    headers: dict
    body: str
    timeout_ms: int


class RequestBuilder:
    def __init__(self, url: str) -> None:
        self._url = url              # required
        self._method = "GET"         # optional, with defaults
        self._headers: dict = {}
        self._body = ""
        self._timeout_ms = 5000

    def method(self, method: str) -> "RequestBuilder":
        self._method = method
        return self

    def header(self, key: str, value: str) -> "RequestBuilder":
        self._headers[key] = value
        return self

    def body(self, body: str) -> "RequestBuilder":
        self._body = body
        return self

    def timeout(self, ms: int) -> "RequestBuilder":
        self._timeout_ms = ms
        return self

    def build(self) -> HttpRequest:
        if self._body and self._method == "GET":
            raise ValueError("GET cannot have a body")
        return HttpRequest(self._url, self._method, dict(self._headers), self._body, self._timeout_ms)


if __name__ == "__main__":
    req = (
        RequestBuilder("https://api.example.com/orders")
        .method("POST")
        .header("Content-Type", "application/json")
        .body("item=42")
        .timeout(2000)
        .build()
    )
    print(req)`,
    },
    related: ["abstract-factory", "composite", "factory-method"],
    problems: ["coffee-machine", "hotel-management", "movie-ticket-booking"],
  },
  {
    id: "singleton",
    name: "Singleton",
    category: "creational",
    intent: "Ensure a class has exactly one instance and provide a global point of access to it.",
    problem:
      "Some resources (a logger, a configuration registry, a connection pool) must be shared and creating several copies would waste resources or cause inconsistent state. You need controlled, lazy, thread-safe creation of that single instance.",
    whenToUse: [
      "Exactly one instance must coordinate access to a shared resource (logger, config, pool).",
      "The instance should be created lazily on first use.",
      "You need strict control over global state that would otherwise be a bare global variable.",
    ],
    whenNotToUse: [
      "You only want convenient access: dependency injection of a single shared instance is more testable.",
      "The object holds per-request or per-user state.",
      "Unit tests need to substitute or reset the instance easily.",
      "In distributed systems where one instance per process does not mean one instance overall.",
    ],
    uml: {
      classes: [
        {
          name: "Logger",
          kind: "class",
          attributes: ["- instance: Logger {static}", "- lineCount: int"],
          methods: ["- Logger()", "+ getInstance(): Logger {static}", "+ log(msg: String): void"],
        },
        { name: "OrderService", kind: "class", attributes: [], methods: ["+ placeOrder(): void"] },
        { name: "PaymentService", kind: "class", attributes: [], methods: ["+ charge(): void"] },
      ],
      relations: [
        { from: "Logger", to: "Logger", type: "association", label: "holds sole instance" },
        { from: "OrderService", to: "Logger", type: "dependency", label: "getInstance()" },
        { from: "PaymentService", to: "Logger", type: "dependency", label: "getInstance()" },
      ],
    },
    example:
      "Python modules are singletons: a module is imported once and cached in sys.modules. logging.getLogger(name) always returns the same logger for a name, and app-wide configuration objects are often singletons.",
    advantages: [
      "Guarantees a single instance and a well-known access point.",
      "Lazy initialisation avoids paying the cost until first use.",
      "Better than a raw global variable because creation is controlled.",
    ],
    disadvantages: [
      "Introduces hidden global state and hidden dependencies between classes.",
      "Hard to mock or reset in unit tests.",
      "Requires care for thread safety (double-checked locking, holder idiom, or enum).",
      "Violates the Single Responsibility Principle by managing its own lifecycle.",
    ],
    code: {
      python: `import threading


class Logger:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:                 # first check, no lock
            with cls._lock:
                if cls._instance is None:         # second check, with lock
                    instance = super().__new__(cls)
                    instance.line_count = 0
                    cls._instance = instance
        return cls._instance

    @classmethod
    def get_instance(cls) -> "Logger":
        return cls()

    def log(self, msg: str) -> None:
        with self._lock:
            self.line_count += 1
            print(f"[{self.line_count}] {msg}")


class OrderService:
    def place_order(self) -> None:
        Logger.get_instance().log("Order placed")


class PaymentService:
    def charge(self) -> None:
        Logger.get_instance().log("Payment charged")


if __name__ == "__main__":
    OrderService().place_order()
    PaymentService().charge()
    print(Logger() is Logger.get_instance())  # True`,
    },
    related: ["abstract-factory", "facade", "factory-method"],
    problems: ["logger", "parking-lot", "elevator-system"],
  },
  {
    id: "prototype",
    name: "Prototype",
    category: "creational",
    intent:
      "Create new objects by copying an existing, pre-configured instance (the prototype) rather than constructing them from scratch.",
    problem:
      "Constructing some objects is expensive or requires lots of configuration, and client code may not even know the concrete class of the object it wants to duplicate. You need a way to copy objects through a common interface.",
    whenToUse: [
      "Creating an object is costly (heavy setup, I/O) and copying is cheaper.",
      "You need many objects that differ only slightly from a few preset configurations.",
      "Code must copy objects without depending on their concrete classes.",
      "You want a registry of ready-made templates that clients clone on demand.",
    ],
    whenNotToUse: [
      "Objects are cheap to construct with a plain constructor.",
      "Objects hold resources that cannot be meaningfully copied (sockets, file handles, threads).",
      "The object graph has circular references that make deep copying error-prone.",
    ],
    uml: {
      classes: [
        {
          name: "Shape",
          kind: "abstract",
          attributes: ["# x: int", "# y: int", "# color: String"],
          methods: ["+ clone(): Shape"],
        },
        { name: "Circle", kind: "class", attributes: ["- radius: int"], methods: ["+ clone(): Shape"] },
        { name: "Rectangle", kind: "class", attributes: ["- width: int", "- height: int"], methods: ["+ clone(): Shape"] },
        {
          name: "ShapeRegistry",
          kind: "class",
          attributes: ["- prototypes: Map<String, Shape>"],
          methods: ["+ register(key: String, s: Shape): void", "+ create(key: String): Shape"],
        },
      ],
      relations: [
        { from: "Circle", to: "Shape", type: "inheritance" },
        { from: "Rectangle", to: "Shape", type: "inheritance" },
        { from: "ShapeRegistry", to: "Shape", type: "aggregation", label: "prototypes" },
      ],
    },
    example:
      "Python's copy.copy() and copy.deepcopy() exist for this purpose. Game engines clone pre-configured enemy or particle templates instead of rebuilding them.",
    advantages: [
      "Copies objects without coupling to their concrete classes.",
      "Avoids repeated expensive initialisation.",
      "Replaces many configuration subclasses with a set of preset instances.",
      "New variants can be registered at runtime.",
    ],
    disadvantages: [
      "Deep versus shallow copy must be handled carefully to avoid shared mutable state.",
      "Cloning objects with circular references or external resources is tricky.",
      "copy.deepcopy() can copy far more than you intended (and is slow), so an explicit clone() method or __deepcopy__ is often preferred.",
    ],
    code: {
      python: `import copy


class Shape:
    def __init__(self, x: int = 0, y: int = 0, color: str = "black") -> None:
        self.x, self.y, self.color = x, y, color
        self.tags: list[str] = []

    def clone(self) -> "Shape":
        return copy.deepcopy(self)   # deep copy so mutable state is not shared


class Circle(Shape):
    def __init__(self, radius: int = 1, **kwargs) -> None:
        super().__init__(**kwargs)
        self.radius = radius

    def __repr__(self) -> str:
        return f"Circle(r={self.radius}, {self.color}, at=({self.x},{self.y}), tags={self.tags})"


class Rectangle(Shape):
    def __init__(self, width: int = 1, height: int = 1, **kwargs) -> None:
        super().__init__(**kwargs)
        self.width, self.height = width, height

    def __repr__(self) -> str:
        return f"Rectangle({self.width}x{self.height}, {self.color})"


class ShapeRegistry:
    def __init__(self) -> None:
        self._prototypes: dict[str, Shape] = {}

    def register(self, key: str, shape: Shape) -> None:
        self._prototypes[key] = shape

    def create(self, key: str) -> Shape:
        return self._prototypes[key].clone()


if __name__ == "__main__":
    registry = ShapeRegistry()
    base = Circle(radius=10, color="red")
    base.tags.append("logo")
    registry.register("big-red-circle", base)
    registry.register("card", Rectangle(width=300, height=200, color="white"))

    c = registry.create("big-red-circle")
    c.x = 5
    c.tags.append("copy")
    print(c, "| prototype:", base)`,
    },
    related: ["factory-method", "abstract-factory", "composite", "decorator"],
    problems: ["chess"],
  },

  // ───────────────────────────── Structural ─────────────────────────────
  {
    id: "adapter",
    name: "Adapter",
    category: "structural",
    intent:
      "Convert the interface of a class into another interface clients expect, letting classes work together that otherwise could not because of incompatible interfaces.",
    problem:
      "You want to reuse an existing class or third-party SDK, but its interface does not match the one your code depends on, and you cannot or should not modify either side.",
    whenToUse: [
      "Integrating a third-party or legacy component whose API you cannot change.",
      "Several vendors expose different APIs and you want one uniform interface.",
      "Migrating gradually from an old interface to a new one.",
    ],
    whenNotToUse: [
      "You own both sides and can simply change one interface to match.",
      "The interfaces already match; a wrapper adds nothing.",
      "You need to simplify a whole subsystem rather than translate one interface (use Facade).",
    ],
    uml: {
      classes: [
        { name: "PaymentProcessor", kind: "interface", attributes: [], methods: ["+ pay(amount: double): boolean"] },
        {
          name: "LegacyGateway",
          kind: "class",
          attributes: [],
          methods: ["+ makePayment(cents: long, currency: String): int"],
        },
        {
          name: "LegacyGatewayAdapter",
          kind: "class",
          attributes: ["- gateway: LegacyGateway"],
          methods: ["+ pay(amount: double): boolean"],
        },
        {
          name: "CheckoutService",
          kind: "class",
          attributes: ["- processor: PaymentProcessor"],
          methods: ["+ checkout(total: double): void"],
        },
      ],
      relations: [
        { from: "LegacyGatewayAdapter", to: "PaymentProcessor", type: "realization" },
        { from: "LegacyGatewayAdapter", to: "LegacyGateway", type: "association", label: "adaptee" },
        { from: "CheckoutService", to: "PaymentProcessor", type: "association", label: "uses" },
      ],
    },
    example:
      "io.TextIOWrapper adapts a binary stream to a text stream, and csv.reader adapts any iterable of lines into rows.",
    advantages: [
      "Reuses existing code without modifying it.",
      "Keeps translation logic separate from business logic (Single Responsibility).",
      "New adapters can be added without touching client code (Open/Closed).",
    ],
    disadvantages: [
      "Adds an extra class and a level of indirection.",
      "A large mismatch can make the adapter complex and leaky.",
      "Too many adapters can hide the fact that interfaces should really be redesigned.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class PaymentProcessor(ABC):
    """Target interface that our checkout code expects."""

    @abstractmethod
    def pay(self, amount: float) -> bool: ...


class LegacyGateway:
    """Adaptee: third-party SDK with an incompatible API."""

    def make_payment(self, cents: int, currency: str) -> int:
        print("Legacy gateway charged", cents, currency, "cents")
        return 200


class LegacyGatewayAdapter(PaymentProcessor):
    def __init__(self, gateway: LegacyGateway) -> None:
        self._gateway = gateway

    def pay(self, amount: float) -> bool:
        cents = round(amount * 100)                     # translate units
        status = self._gateway.make_payment(cents, "USD")
        return status == 200                            # translate the result


class CheckoutService:
    def __init__(self, processor: PaymentProcessor) -> None:
        self._processor = processor

    def checkout(self, total: float) -> None:
        print("Order confirmed" if self._processor.pay(total) else "Payment failed")


if __name__ == "__main__":
    CheckoutService(LegacyGatewayAdapter(LegacyGateway())).checkout(49.99)`,
    },
    related: ["decorator", "facade", "proxy", "bridge"],
    problems: ["notification-service-lld", "atm", "ride-sharing"],
  },
  {
    id: "decorator",
    name: "Decorator",
    category: "structural",
    intent:
      "Attach additional responsibilities to an object dynamically by wrapping it in objects that share its interface, providing a flexible alternative to subclassing.",
    problem:
      "Adding every combination of optional features through subclasses causes a class explosion (MilkCaramelEspresso, DoubleMilkEspresso, ...). You need to add or stack behaviour at runtime without changing the original class.",
    whenToUse: [
      "Optional features must be combined freely at runtime.",
      "Extending by subclassing would cause a combinatorial explosion of classes.",
      "You want to add cross-cutting behaviour (logging, caching, compression) around an object transparently.",
      "The class to extend is final or comes from a library.",
    ],
    whenNotToUse: [
      "There is only one fixed extension: a subclass or a simple flag is clearer.",
      "The order of wrappers matters in subtle ways that make behaviour hard to reason about.",
      "Clients need to know the concrete type of the object, since wrapping hides it.",
    ],
    uml: {
      classes: [
        { name: "Beverage", kind: "interface", attributes: [], methods: ["+ description(): String", "+ cost(): double"] },
        { name: "Espresso", kind: "class", attributes: [], methods: ["+ description(): String", "+ cost(): double"] },
        {
          name: "BeverageDecorator",
          kind: "abstract",
          attributes: ["# inner: Beverage"],
          methods: ["+ description(): String", "+ cost(): double"],
        },
        { name: "Milk", kind: "class", attributes: [], methods: ["+ description(): String", "+ cost(): double"] },
        { name: "Caramel", kind: "class", attributes: [], methods: ["+ description(): String", "+ cost(): double"] },
      ],
      relations: [
        { from: "Espresso", to: "Beverage", type: "realization" },
        { from: "BeverageDecorator", to: "Beverage", type: "realization" },
        { from: "BeverageDecorator", to: "Beverage", type: "aggregation", label: "wraps" },
        { from: "Milk", to: "BeverageDecorator", type: "inheritance" },
        { from: "Caramel", to: "BeverageDecorator", type: "inheritance" },
      ],
    },
    example:
      "Python's I/O stack is decorators: io.BufferedReader(gzip.GzipFile(...)) wraps one stream in another. @functools.lru_cache and HTTP middleware follow the same idea.",
    advantages: [
      "Adds behaviour at runtime without modifying or subclassing the original.",
      "Features can be combined in any order and quantity.",
      "Each decorator has a single responsibility.",
      "Avoids a class explosion from feature combinations.",
    ],
    disadvantages: [
      "Many small wrapper objects can make debugging and stack traces harder.",
      "Removing a specific wrapper from the middle of a stack is awkward.",
      "Behaviour can depend on wrapping order.",
      "Object identity checks fail because the decorator is a different object.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Beverage(ABC):
    @abstractmethod
    def description(self) -> str: ...

    @abstractmethod
    def cost(self) -> float: ...


class Espresso(Beverage):
    def description(self) -> str:
        return "Espresso"

    def cost(self) -> float:
        return 2.00


class BeverageDecorator(Beverage, ABC):
    def __init__(self, inner: Beverage) -> None:
        self._inner = inner   # the wrapped component


class Milk(BeverageDecorator):
    def description(self) -> str:
        return self._inner.description() + ", milk"

    def cost(self) -> float:
        return self._inner.cost() + 0.50


class Caramel(BeverageDecorator):
    def description(self) -> str:
        return self._inner.description() + ", caramel"

    def cost(self) -> float:
        return self._inner.cost() + 0.75


if __name__ == "__main__":
    order = Caramel(Milk(Milk(Espresso())))
    print(order.description(), "=", round(order.cost(), 2))`,
    },
    related: ["adapter", "proxy", "composite", "strategy"],
    problems: ["coffee-machine", "logger"],
  },
  {
    id: "facade",
    name: "Facade",
    category: "structural",
    intent:
      "Provide a unified, simplified interface to a set of interfaces in a subsystem, making the subsystem easier to use.",
    problem:
      "Clients that orchestrate many subsystem classes directly become tightly coupled to their details and call order. A simple, high-level entry point would hide that complexity.",
    whenToUse: [
      "A common workflow requires coordinating several subsystem classes in a specific order.",
      "You want to decouple clients from a complex or frequently changing subsystem.",
      "You want to define clear entry points into layers of a system.",
    ],
    whenNotToUse: [
      "The subsystem is already simple; a facade would just forward calls one-to-one.",
      "Clients regularly need fine-grained control the facade would hide.",
      "The facade starts accumulating unrelated responsibilities and becomes a god object.",
    ],
    uml: {
      classes: [
        {
          name: "OrderFacade",
          kind: "class",
          attributes: ["- inventory: InventoryService", "- payments: PaymentService", "- shipping: ShippingService"],
          methods: ["+ placeOrder(userId: String, sku: String, qty: int, price: double): String"],
        },
        { name: "InventoryService", kind: "class", attributes: [], methods: ["+ reserve(sku: String, qty: int): boolean"] },
        { name: "PaymentService", kind: "class", attributes: [], methods: ["+ charge(userId: String, amount: double): boolean"] },
        { name: "ShippingService", kind: "class", attributes: [], methods: ["+ schedule(userId: String, sku: String): String"] },
      ],
      relations: [
        { from: "OrderFacade", to: "InventoryService", type: "association" },
        { from: "OrderFacade", to: "PaymentService", type: "association" },
        { from: "OrderFacade", to: "ShippingService", type: "association" },
      ],
    },
    example:
      "SLF4J offers a simple logging facade over several logging back-ends, and a service-layer method like placeOrder() is a facade over inventory, payment and shipping components.",
    advantages: [
      "Simplifies usage of a complex subsystem.",
      "Reduces coupling between clients and subsystem internals.",
      "Subsystem classes remain accessible for advanced use cases.",
    ],
    disadvantages: [
      "Can grow into a god object coupled to every class in the app.",
      "Adds a layer that must be maintained as the subsystem evolves.",
      "May hide useful capabilities if it is the only access path.",
    ],
    code: {
      python: `class InventoryService:
    def reserve(self, sku: str, qty: int) -> bool:
        print("Reserved", qty, "x", sku)
        return True


class PaymentService:
    def charge(self, user_id: str, amount: float) -> bool:
        print("Charged", user_id, amount)
        return True


class ShippingService:
    def schedule(self, user_id: str, sku: str) -> str:
        print("Shipping", sku, "to", user_id)
        return "TRK-1001"


class OrderFacade:
    """One simple entry point that orchestrates the subsystems."""

    def __init__(self) -> None:
        self._inventory = InventoryService()
        self._payments = PaymentService()
        self._shipping = ShippingService()

    def place_order(self, user_id: str, sku: str, qty: int, price: float) -> str:
        if not self._inventory.reserve(sku, qty):
            raise RuntimeError("Out of stock")
        if not self._payments.charge(user_id, qty * price):
            raise RuntimeError("Payment declined")
        return self._shipping.schedule(user_id, sku)


if __name__ == "__main__":
    print("Tracking:", OrderFacade().place_order("user-42", "BOOK-7", 2, 15.0))`,
    },
    related: ["adapter", "mediator", "singleton"],
    problems: ["hotel-management", "movie-ticket-booking", "atm"],
  },
  {
    id: "proxy",
    name: "Proxy",
    category: "structural",
    intent:
      "Provide a surrogate or placeholder for another object to control access to it, using the same interface as the real object.",
    problem:
      "Direct access to an object may be expensive (lazy loading), remote, or need protection, caching or logging. You want to add that control without changing the real object or its clients.",
    whenToUse: [
      "Virtual proxy: defer creating a heavy object until it is actually needed.",
      "Protection proxy: check permissions before forwarding calls.",
      "Remote proxy: represent an object that lives in another process or machine.",
      "Caching or logging proxy: add behaviour around calls transparently.",
    ],
    whenNotToUse: [
      "The real object is cheap and needs no access control.",
      "The extra latency of an indirection layer is unacceptable on a hot path.",
      "You need to add many stackable features (Decorator fits better).",
    ],
    uml: {
      classes: [
        { name: "Image", kind: "interface", attributes: [], methods: ["+ display(): void"] },
        { name: "RealImage", kind: "class", attributes: ["- filename: String"], methods: ["+ display(): void", "- loadFromDisk(): void"] },
        {
          name: "ImageProxy",
          kind: "class",
          attributes: ["- filename: String", "- real: RealImage"],
          methods: ["+ display(): void"],
        },
        { name: "Gallery", kind: "class", attributes: ["- images: List<Image>"], methods: ["+ show(index: int): void"] },
      ],
      relations: [
        { from: "RealImage", to: "Image", type: "realization" },
        { from: "ImageProxy", to: "Image", type: "realization" },
        { from: "ImageProxy", to: "RealImage", type: "association", label: "lazily creates" },
        { from: "Gallery", to: "Image", type: "aggregation" },
      ],
    },
    example:
      "SQLAlchemy lazy-loads relationships behind proxy attributes, unittest.mock.Mock stands in for real objects, and xmlrpc.client.ServerProxy is a remote proxy.",
    advantages: [
      "Controls access to the real object without clients noticing.",
      "Enables lazy initialisation, caching, access control and remote access.",
      "The real object can be swapped or managed independently (Open/Closed).",
    ],
    disadvantages: [
      "Adds indirection and potential latency.",
      "Responses may be delayed or behave unexpectedly (e.g. lazy-load exceptions).",
      "More classes to maintain.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Image(ABC):
    @abstractmethod
    def display(self) -> None: ...


class RealImage(Image):
    def __init__(self, filename: str) -> None:
        self._filename = filename
        print("Loading", filename, "from disk (expensive)")

    def display(self) -> None:
        print("Displaying", self._filename)


class ImageProxy(Image):
    """Virtual proxy: same interface, defers creation until first use."""

    def __init__(self, filename: str) -> None:
        self._filename = filename
        self._real: RealImage | None = None

    def display(self) -> None:
        if self._real is None:
            self._real = RealImage(self._filename)
        self._real.display()


class Gallery:
    def __init__(self) -> None:
        self._images: list[Image] = []

    def add(self, image: Image) -> None:
        self._images.append(image)

    def show(self, index: int) -> None:
        self._images[index].display()


if __name__ == "__main__":
    gallery = Gallery()
    gallery.add(ImageProxy("a.png"))   # nothing loaded yet
    gallery.add(ImageProxy("b.png"))
    gallery.show(0)                    # loads, then displays
    gallery.show(0)                    # displays only`,
    },
    related: ["decorator", "adapter", "facade"],
    problems: ["atm", "library-management"],
  },
  {
    id: "composite",
    name: "Composite",
    category: "structural",
    intent:
      "Compose objects into tree structures to represent part-whole hierarchies, letting clients treat individual objects and compositions uniformly.",
    problem:
      "When data is naturally a tree (files and folders, menus and items), client code fills up with type checks to distinguish leaves from containers. A common interface lets recursive operations work on any node.",
    whenToUse: [
      "The domain is a part-whole hierarchy (file systems, org charts, UI widget trees, menus).",
      "Clients should handle single items and groups through one interface.",
      "Operations like size, price or render naturally recurse over children.",
    ],
    whenNotToUse: [
      "The structure is flat or has a fixed, shallow depth.",
      "Leaves and containers have very different interfaces and forcing a common one would be misleading.",
      "You need strict compile-time rules about which children a node may contain.",
    ],
    uml: {
      classes: [
        {
          name: "FileSystemNode",
          kind: "abstract",
          attributes: ["# name: String"],
          methods: ["+ getSize(): long", "+ print(indent: String): void"],
        },
        { name: "File", kind: "class", attributes: ["- size: long"], methods: ["+ getSize(): long", "+ print(indent: String): void"] },
        {
          name: "Directory",
          kind: "class",
          attributes: ["- children: List<FileSystemNode>"],
          methods: ["+ add(node: FileSystemNode): Directory", "+ getSize(): long", "+ print(indent: String): void"],
        },
      ],
      relations: [
        { from: "File", to: "FileSystemNode", type: "inheritance" },
        { from: "Directory", to: "FileSystemNode", type: "inheritance" },
        { from: "Directory", to: "FileSystemNode", type: "aggregation", label: "children 0..*" },
      ],
    },
    example:
      "In Tkinter, a Frame holds other widgets and is itself a widget. Python's ast module (a Module node containing statement nodes) and the browser DOM are composites too.",
    advantages: [
      "Clients treat leaves and composites uniformly, simplifying code.",
      "Easy to add new node types (Open/Closed).",
      "Recursive operations over trees become natural and concise.",
    ],
    disadvantages: [
      "A common interface can be too general, e.g. leaves exposing meaningless add() methods.",
      "Hard to restrict which components may be children of which.",
      "Deep trees can make recursive operations expensive without caching.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class FileSystemNode(ABC):
    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def get_size(self) -> int: ...

    @abstractmethod
    def print(self, indent: str = "") -> None: ...


class File(FileSystemNode):
    def __init__(self, name: str, size: int) -> None:
        super().__init__(name)
        self.size = size

    def get_size(self) -> int:
        return self.size

    def print(self, indent: str = "") -> None:
        print(f"{indent}{self.name} ({self.size} B)")


class Directory(FileSystemNode):
    def __init__(self, name: str) -> None:
        super().__init__(name)
        self.children: list[FileSystemNode] = []

    def add(self, node: FileSystemNode) -> "Directory":
        self.children.append(node)
        return self

    def get_size(self) -> int:
        return sum(child.get_size() for child in self.children)

    def print(self, indent: str = "") -> None:
        print(f"{indent}{self.name}/ ({self.get_size()} B)")
        for child in self.children:
            child.print(indent + "  ")


if __name__ == "__main__":
    root = Directory("root").add(File("readme.md", 120)).add(
        Directory("src").add(File("app.py", 2048)).add(File("util.py", 512))
    )
    root.print()
    print("Total:", root.get_size())`,
    },
    related: ["iterator", "decorator", "chain-of-responsibility", "builder"],
    problems: ["library-management"],
  },
  {
    id: "bridge",
    name: "Bridge",
    category: "structural",
    intent:
      "Decouple an abstraction from its implementation so that the two can vary independently, connected by composition rather than inheritance.",
    problem:
      "When a class varies along two independent dimensions (e.g. remote type and device type), inheritance produces a Cartesian product of subclasses. Splitting the dimensions into two hierarchies linked by a reference keeps both extensible.",
    whenToUse: [
      "A class varies along two or more orthogonal dimensions.",
      "You want to switch implementations at runtime.",
      "Both the abstraction and the implementation should be extensible by subclassing without affecting each other.",
      "You need to hide platform-specific implementation details from clients.",
    ],
    whenNotToUse: [
      "There is only one implementation, and no second dimension of variation.",
      "The abstraction and implementation are tightly cohesive and always change together.",
      "Simple composition with a strategy already covers the need.",
    ],
    uml: {
      classes: [
        {
          name: "RemoteControl",
          kind: "class",
          attributes: ["# device: Device"],
          methods: ["+ togglePower(): void", "+ volumeUp(): void"],
        },
        { name: "AdvancedRemote", kind: "class", attributes: [], methods: ["+ mute(): void"] },
        {
          name: "Device",
          kind: "interface",
          attributes: [],
          methods: ["+ isEnabled(): boolean", "+ setEnabled(on: boolean): void", "+ getVolume(): int", "+ setVolume(v: int): void"],
        },
        { name: "Tv", kind: "class", attributes: ["- on: boolean", "- volume: int"], methods: ["+ setVolume(v: int): void"] },
        { name: "Radio", kind: "class", attributes: ["- on: boolean", "- volume: int"], methods: ["+ setVolume(v: int): void"] },
      ],
      relations: [
        { from: "AdvancedRemote", to: "RemoteControl", type: "inheritance" },
        { from: "RemoteControl", to: "Device", type: "aggregation", label: "bridge" },
        { from: "Tv", to: "Device", type: "realization" },
        { from: "Radio", to: "Device", type: "realization" },
      ],
    },
    example:
      "Python's DB-API is a bridge: application code uses the same connect()/cursor()/execute() API (abstraction) while each driver provides the implementation. A notification type (alert, digest) sent over different channels (email, SMS) is another common case.",
    advantages: [
      "Avoids a class explosion from combining two dimensions.",
      "Abstraction and implementation evolve independently (Open/Closed).",
      "Implementations can be swapped at runtime.",
      "Hides implementation details from clients.",
    ],
    disadvantages: [
      "Adds complexity and indirection when there is only one dimension.",
      "Requires identifying the independent dimensions up front.",
      "The implementor interface can become a lowest-common-denominator API.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Device(ABC):
    def __init__(self, name: str, volume: int) -> None:
        self.name, self.enabled, self.volume = name, False, volume

    def set_enabled(self, on: bool) -> None:
        self.enabled = on
        print(self.name, "power", on)

    def set_volume(self, volume: int) -> None:
        self.volume = max(0, min(100, volume))
        print(self.name, "volume", self.volume)


class Tv(Device):
    def __init__(self) -> None:
        super().__init__("TV", 30)


class Radio(Device):
    def __init__(self) -> None:
        super().__init__("Radio", 50)


class RemoteControl:
    """Abstraction: holds a reference to the implementation (the bridge)."""

    def __init__(self, device: Device) -> None:
        self.device = device

    def toggle_power(self) -> None:
        self.device.set_enabled(not self.device.enabled)

    def volume_up(self) -> None:
        self.device.set_volume(self.device.volume + 10)


class AdvancedRemote(RemoteControl):
    def mute(self) -> None:
        self.device.set_volume(0)


if __name__ == "__main__":
    RemoteControl(Tv()).volume_up()
    remote = AdvancedRemote(Radio())
    remote.toggle_power()
    remote.mute()`,
    },
    related: ["adapter", "strategy", "abstract-factory"],
    problems: ["notification-service-lld", "logger"],
  },

  // ───────────────────────────── Behavioral ─────────────────────────────
  {
    id: "strategy",
    name: "Strategy",
    category: "behavioral",
    intent:
      "Define a family of algorithms, encapsulate each one, and make them interchangeable so the algorithm can vary independently from the clients that use it.",
    problem:
      "A class that picks between algorithms with growing if/else or switch blocks becomes hard to extend and test. Extracting each algorithm behind a common interface lets you add or swap them without touching the context.",
    whenToUse: [
      "Several variants of an algorithm exist (pricing, sorting, routing, matching) and may grow.",
      "The algorithm must be chosen or changed at runtime.",
      "You want to replace conditionals that select behaviour with polymorphism.",
      "Algorithms need to be unit-tested in isolation from the context.",
    ],
    whenNotToUse: [
      "There are only one or two algorithms that rarely change.",
      "A simple function or lambda parameter is enough, and a class hierarchy adds noise.",
      "Clients should not need to know about or choose among the strategies.",
    ],
    uml: {
      classes: [
        { name: "PricingStrategy", kind: "interface", attributes: [], methods: ["+ calculate(hours: int): double"] },
        { name: "HourlyPricing", kind: "class", attributes: ["- rate: double"], methods: ["+ calculate(hours: int): double"] },
        { name: "FlatRatePricing", kind: "class", attributes: ["- flat: double"], methods: ["+ calculate(hours: int): double"] },
        { name: "TieredPricing", kind: "class", attributes: [], methods: ["+ calculate(hours: int): double"] },
        {
          name: "ParkingFeeCalculator",
          kind: "class",
          attributes: ["- strategy: PricingStrategy"],
          methods: ["+ setStrategy(s: PricingStrategy): void", "+ fee(hours: int): double"],
        },
      ],
      relations: [
        { from: "HourlyPricing", to: "PricingStrategy", type: "realization" },
        { from: "FlatRatePricing", to: "PricingStrategy", type: "realization" },
        { from: "TieredPricing", to: "PricingStrategy", type: "realization" },
        { from: "ParkingFeeCalculator", to: "PricingStrategy", type: "aggregation", label: "delegates to" },
      ],
    },
    example:
      "The key= function passed to sorted() is a strategy. Parking lots switching between hourly, flat and weekend pricing, or ride-sharing apps choosing a fare or matching algorithm, are classic uses.",
    advantages: [
      "Swap algorithms at runtime without changing the context.",
      "Eliminates conditional logic for selecting behaviour.",
      "New strategies can be added without modifying existing code (Open/Closed).",
      "Each algorithm is isolated and easy to test.",
    ],
    disadvantages: [
      "Clients must be aware of the different strategies to choose one.",
      "Increases the number of classes for small algorithms.",
      "Strategies may need data from the context, which can widen interfaces.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class PricingStrategy(ABC):
    @abstractmethod
    def calculate(self, hours: int) -> float: ...


class HourlyPricing(PricingStrategy):
    def __init__(self, rate: float) -> None:
        self.rate = rate

    def calculate(self, hours: int) -> float:
        return hours * self.rate


class FlatRatePricing(PricingStrategy):
    def __init__(self, flat: float) -> None:
        self.flat = flat

    def calculate(self, hours: int) -> float:
        return self.flat


class TieredPricing(PricingStrategy):
    def calculate(self, hours: int) -> float:
        # first 2 hours at 5.0, every extra hour at 3.0
        return min(hours, 2) * 5.0 + max(0, hours - 2) * 3.0


class ParkingFeeCalculator:
    def __init__(self, strategy: PricingStrategy) -> None:
        self.strategy = strategy

    def set_strategy(self, strategy: PricingStrategy) -> None:
        self.strategy = strategy

    def fee(self, hours: int) -> float:
        return self.strategy.calculate(hours)


if __name__ == "__main__":
    calc = ParkingFeeCalculator(HourlyPricing(4.0))
    for strategy in (HourlyPricing(4.0), TieredPricing(), FlatRatePricing(15.0)):
        calc.set_strategy(strategy)
        print(type(strategy).__name__, calc.fee(5))`,
    },
    related: ["state", "template-method", "bridge", "command"],
    problems: ["parking-lot", "ride-sharing", "splitwise", "elevator-system"],
  },
  {
    id: "observer",
    name: "Observer",
    category: "behavioral",
    intent:
      "Define a one-to-many dependency between objects so that when one object (the subject) changes state, all its dependents (observers) are notified automatically.",
    problem:
      "Several objects need to react when another object changes, but hard-wiring the subject to each of them creates tight coupling and makes adding new reactions painful. Polling for changes is wasteful.",
    whenToUse: [
      "A change in one object must trigger updates in an open-ended set of others.",
      "Subscribers should be added or removed at runtime.",
      "The subject should not know the concrete classes of its listeners.",
      "Building event systems, UI data binding, or notification fan-out.",
    ],
    whenNotToUse: [
      "There is exactly one fixed dependent; a direct call is simpler.",
      "Notification order or delivery guarantees matter (use a queue or explicit orchestration).",
      "Cascading updates between observers would become hard to trace and debug.",
    ],
    uml: {
      classes: [
        {
          name: "Subject",
          kind: "interface",
          attributes: [],
          methods: ["+ subscribe(o: Observer): void", "+ unsubscribe(o: Observer): void", "+ notifyObservers(): void"],
        },
        { name: "Observer", kind: "interface", attributes: [], methods: ["+ update(orderId: String, status: String): void"] },
        {
          name: "OrderTracker",
          kind: "class",
          attributes: ["- observers: List<Observer>", "- orderId: String", "- status: String"],
          methods: ["+ setStatus(status: String): void"],
        },
        { name: "EmailNotifier", kind: "class", attributes: [], methods: ["+ update(orderId: String, status: String): void"] },
        { name: "SmsNotifier", kind: "class", attributes: [], methods: ["+ update(orderId: String, status: String): void"] },
      ],
      relations: [
        { from: "OrderTracker", to: "Subject", type: "realization" },
        { from: "OrderTracker", to: "Observer", type: "aggregation", label: "notifies 0..*" },
        { from: "EmailNotifier", to: "Observer", type: "realization" },
        { from: "SmsNotifier", to: "Observer", type: "realization" },
      ],
    },
    example:
      "GUI callbacks (Tkinter's bind, addEventListener in the DOM), Django signals and reactive libraries like RxPY are built on Observer. An order-status change fanning out to email, SMS and push notifiers is a typical LLD use.",
    advantages: [
      "Loose coupling: the subject knows only the observer interface.",
      "New observers can be added without changing the subject (Open/Closed).",
      "Supports dynamic subscription at runtime.",
      "Natural fit for event-driven designs.",
    ],
    disadvantages: [
      "Notification order is usually unspecified.",
      "Forgotten subscriptions cause memory leaks (lapsed listener problem).",
      "Cascading or cyclic updates can be hard to debug.",
      "Synchronous notification means one slow observer blocks the rest.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Observer(ABC):
    @abstractmethod
    def update(self, order_id: str, status: str) -> None: ...


class OrderTracker:
    """The subject: keeps a list of observers and notifies them on change."""

    def __init__(self, order_id: str) -> None:
        self._observers: list[Observer] = []
        self.order_id = order_id
        self.status = "CREATED"

    def subscribe(self, observer: Observer) -> None:
        self._observers.append(observer)

    def unsubscribe(self, observer: Observer) -> None:
        self._observers.remove(observer)

    def notify_observers(self) -> None:
        for observer in list(self._observers):
            observer.update(self.order_id, self.status)

    def set_status(self, status: str) -> None:
        self.status = status
        self.notify_observers()


class EmailNotifier(Observer):
    def update(self, order_id: str, status: str) -> None:
        print("Email: order", order_id, "is", status)


class SmsNotifier(Observer):
    def update(self, order_id: str, status: str) -> None:
        print("SMS: order", order_id, "is", status)


if __name__ == "__main__":
    tracker = OrderTracker("A-17")
    sms = SmsNotifier()
    tracker.subscribe(EmailNotifier())
    tracker.subscribe(sms)
    tracker.set_status("SHIPPED")
    tracker.unsubscribe(sms)
    tracker.set_status("DELIVERED")`,
    },
    related: ["mediator", "command", "chain-of-responsibility"],
    problems: ["notification-service-lld", "elevator-system", "library-management", "movie-ticket-booking"],
  },
  {
    id: "command",
    name: "Command",
    category: "behavioral",
    intent:
      "Encapsulate a request as an object, letting you parameterise clients with different requests, queue or log requests, and support undoable operations.",
    problem:
      "When the code that triggers an action (a button, a scheduler, an elevator panel) is hard-wired to the code that performs it, you cannot queue, log, retry or undo actions. Turning each request into an object decouples the invoker from the receiver.",
    whenToUse: [
      "You need undo/redo or an operation history.",
      "Requests should be queued, scheduled, retried or executed remotely.",
      "UI elements or triggers should be configurable with different actions.",
      "You want to log operations so they can be replayed after a crash.",
    ],
    whenNotToUse: [
      "Actions are simple direct calls with no need for queuing, logging or undo.",
      "A plain callback or lambda already provides enough decoupling.",
      "Creating a class per operation would bloat a small codebase.",
    ],
    uml: {
      classes: [
        { name: "Command", kind: "interface", attributes: [], methods: ["+ execute(): void", "+ undo(): void"] },
        { name: "LightOnCommand", kind: "class", attributes: ["- light: Light"], methods: ["+ execute(): void", "+ undo(): void"] },
        { name: "LightOffCommand", kind: "class", attributes: ["- light: Light"], methods: ["+ execute(): void", "+ undo(): void"] },
        { name: "Light", kind: "class", attributes: ["- room: String"], methods: ["+ on(): void", "+ off(): void"] },
        {
          name: "RemoteControl",
          kind: "class",
          attributes: ["- history: Deque<Command>"],
          methods: ["+ press(c: Command): void", "+ undoLast(): void"],
        },
      ],
      relations: [
        { from: "LightOnCommand", to: "Command", type: "realization" },
        { from: "LightOffCommand", to: "Command", type: "realization" },
        { from: "LightOnCommand", to: "Light", type: "association", label: "receiver" },
        { from: "LightOffCommand", to: "Light", type: "association", label: "receiver" },
        { from: "RemoteControl", to: "Command", type: "aggregation", label: "history" },
      ],
    },
    example:
      "A callable submitted to concurrent.futures.ThreadPoolExecutor is a command, and text editors implement undo/redo by keeping a stack of command objects. Elevator floor requests can be modelled as queued commands.",
    advantages: [
      "Decouples the object that invokes an operation from the one that performs it.",
      "Enables undo/redo, queuing, scheduling and logging of operations.",
      "Simple commands can be composed into macro commands.",
      "New commands can be added without changing existing code.",
    ],
    disadvantages: [
      "Adds a class for every operation, increasing code volume.",
      "Undo requires storing enough state to reverse each action, which can be complex.",
      "Indirection can make the control flow harder to follow.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class Light:
    """Receiver: knows how to do the actual work."""

    def __init__(self, room: str) -> None:
        self.room = room

    def on(self) -> None:
        print(self.room, "light ON")

    def off(self) -> None:
        print(self.room, "light OFF")


class LightOnCommand(Command):
    def __init__(self, light: Light) -> None:
        self.light = light

    def execute(self) -> None:
        self.light.on()

    def undo(self) -> None:
        self.light.off()


class LightOffCommand(Command):
    def __init__(self, light: Light) -> None:
        self.light = light

    def execute(self) -> None:
        self.light.off()

    def undo(self) -> None:
        self.light.on()


class RemoteControl:
    """Invoker: triggers commands and keeps a history for undo."""

    def __init__(self) -> None:
        self._history: list[Command] = []

    def press(self, command: Command) -> None:
        command.execute()
        self._history.append(command)

    def undo_last(self) -> None:
        if self._history:
            self._history.pop().undo()


if __name__ == "__main__":
    kitchen = Light("Kitchen")
    remote = RemoteControl()
    remote.press(LightOnCommand(kitchen))
    remote.press(LightOffCommand(kitchen))
    remote.undo_last()
    remote.undo_last()`,
    },
    related: ["strategy", "chain-of-responsibility", "observer"],
    problems: ["elevator-system", "chess", "tic-tac-toe"],
  },
  {
    id: "state",
    name: "State",
    category: "behavioral",
    intent:
      "Allow an object to alter its behaviour when its internal state changes, so the object appears to change its class.",
    problem:
      "Objects that behave differently per state (idle, has coin, sold out) often grow large switch statements repeated in every method, and adding a state means editing all of them. Moving each state's behaviour into its own class localises the rules and transitions.",
    whenToUse: [
      "An object's behaviour depends on its state and it has several well-defined states.",
      "Methods contain large conditionals that switch on the same state field.",
      "State transitions have rules that should be explicit and testable.",
      "Modelling finite state machines such as vending machines, elevators, ATMs or order lifecycles.",
    ],
    whenNotToUse: [
      "There are only two or three states with trivial behaviour; a simple enum and switch is clearer.",
      "States rarely change and transition rules are simple.",
      "The state machine is better expressed declaratively with a transition table.",
    ],
    uml: {
      classes: [
        {
          name: "VendingMachine",
          kind: "class",
          attributes: ["- state: State", "- stock: int"],
          methods: ["+ insertCoin(): void", "+ selectItem(): void", "+ setState(s: State): void", "+ releaseItem(): void"],
        },
        {
          name: "State",
          kind: "interface",
          attributes: [],
          methods: ["+ insertCoin(m: VendingMachine): void", "+ selectItem(m: VendingMachine): void"],
        },
        { name: "IdleState", kind: "class", attributes: [], methods: ["+ insertCoin(m: VendingMachine): void", "+ selectItem(m: VendingMachine): void"] },
        { name: "HasCoinState", kind: "class", attributes: [], methods: ["+ insertCoin(m: VendingMachine): void", "+ selectItem(m: VendingMachine): void"] },
        { name: "SoldOutState", kind: "class", attributes: [], methods: ["+ insertCoin(m: VendingMachine): void", "+ selectItem(m: VendingMachine): void"] },
      ],
      relations: [
        { from: "VendingMachine", to: "State", type: "association", label: "current" },
        { from: "IdleState", to: "State", type: "realization" },
        { from: "HasCoinState", to: "State", type: "realization" },
        { from: "SoldOutState", to: "State", type: "realization" },
        { from: "State", to: "VendingMachine", type: "dependency", label: "transitions" },
      ],
    },
    example:
      "A vending machine that accepts coins only when idle and dispenses only after payment, or a TCP connection that behaves differently when listening, established or closed.",
    advantages: [
      "Eliminates sprawling state conditionals.",
      "Each state's behaviour and transitions live in one class (Single Responsibility).",
      "New states can be added without modifying existing ones (Open/Closed).",
      "Makes transitions explicit and easy to test.",
    ],
    disadvantages: [
      "Increases the number of classes.",
      "Transition logic is spread across state classes, so the overall machine is harder to see at a glance.",
      "Overkill for a handful of simple states.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class State(ABC):
    @abstractmethod
    def insert_coin(self, m: "VendingMachine") -> None: ...

    @abstractmethod
    def select_item(self, m: "VendingMachine") -> None: ...


class IdleState(State):
    def insert_coin(self, m: "VendingMachine") -> None:
        print("Coin accepted")
        m.state = HasCoinState()

    def select_item(self, m: "VendingMachine") -> None:
        print("Insert a coin first")


class HasCoinState(State):
    def insert_coin(self, m: "VendingMachine") -> None:
        print("Coin already inserted")

    def select_item(self, m: "VendingMachine") -> None:
        m.release_item()
        m.state = IdleState() if m.stock > 0 else SoldOutState()


class SoldOutState(State):
    def insert_coin(self, m: "VendingMachine") -> None:
        print("Sold out, coin returned")

    def select_item(self, m: "VendingMachine") -> None:
        print("Sold out")


class VendingMachine:
    """Context: delegates behaviour to its current state object."""

    def __init__(self, stock: int) -> None:
        self.stock = stock
        self.state: State = IdleState() if stock > 0 else SoldOutState()

    def release_item(self) -> None:
        self.stock -= 1
        print("Item dispensed,", self.stock, "left")

    def insert_coin(self) -> None:
        self.state.insert_coin(self)

    def select_item(self) -> None:
        self.state.select_item(self)


if __name__ == "__main__":
    vm = VendingMachine(1)
    vm.select_item()
    vm.insert_coin()
    vm.select_item()
    vm.insert_coin()`,
    },
    related: ["strategy", "singleton", "command"],
    problems: ["vending-machine", "elevator-system", "atm", "coffee-machine"],
  },
  {
    id: "chain-of-responsibility",
    name: "Chain of Responsibility",
    category: "behavioral",
    intent:
      "Avoid coupling the sender of a request to its receiver by giving more than one object a chance to handle it. Handlers are linked in a chain and the request is passed along until handled or rejected.",
    problem:
      "A request must go through a series of checks or possible handlers (authentication, rate limiting, validation, log levels, banknote denominations), and hard-coding that sequence in one place makes it rigid. You want to add, remove or reorder steps independently.",
    whenToUse: [
      "Several objects may handle a request and the handler is not known in advance.",
      "A request must pass through an ordered pipeline of checks or processing steps.",
      "The set or order of handlers should be configurable at runtime.",
      "Examples: middleware, approval workflows, log-level filtering, ATM note dispensing.",
    ],
    whenNotToUse: [
      "There is a single handler, or the order never changes.",
      "Every request must be guaranteed a handler and silent drop-off would be dangerous.",
      "Long chains would add unacceptable latency or make debugging hard.",
    ],
    uml: {
      classes: [
        {
          name: "Handler",
          kind: "abstract",
          attributes: ["- next: Handler"],
          methods: ["+ setNext(h: Handler): Handler", "+ handle(req: Request): boolean"],
        },
        { name: "AuthHandler", kind: "class", attributes: [], methods: ["+ handle(req: Request): boolean"] },
        {
          name: "RateLimitHandler",
          kind: "class",
          attributes: ["- counts: Map<String, Integer>", "- limit: int"],
          methods: ["+ handle(req: Request): boolean"],
        },
        { name: "ValidationHandler", kind: "class", attributes: [], methods: ["+ handle(req: Request): boolean"] },
        { name: "Request", kind: "class", attributes: ["+ user: String", "+ token: String", "+ payload: String"], methods: [] },
      ],
      relations: [
        { from: "AuthHandler", to: "Handler", type: "inheritance" },
        { from: "RateLimitHandler", to: "Handler", type: "inheritance" },
        { from: "ValidationHandler", to: "Handler", type: "inheritance" },
        { from: "Handler", to: "Handler", type: "association", label: "next" },
        { from: "Handler", to: "Request", type: "dependency", label: "handles" },
      ],
    },
    example:
      "Django and WSGI middleware form a chain of responsibility, as do logging frameworks that pass a record from DEBUG to INFO to ERROR handlers. An ATM dispensing 100s, then 50s, then 20s is a classic exercise.",
    advantages: [
      "Decouples the sender from concrete handlers.",
      "Handlers can be added, removed or reordered without changing others (Open/Closed).",
      "Each handler has a single responsibility.",
    ],
    disadvantages: [
      "A request may reach the end of the chain unhandled.",
      "Debugging requires tracing the request through many objects.",
      "Long chains add latency, and misconfigured chains can create cycles.",
    ],
    code: {
      python: `from collections import defaultdict
from dataclasses import dataclass


@dataclass
class Request:
    user: str
    token: str
    payload: str


class Handler:
    def __init__(self) -> None:
        self._next: "Handler | None" = None

    def set_next(self, handler: "Handler") -> "Handler":
        self._next = handler
        return handler   # enables fluent chaining

    def handle(self, req: Request) -> bool:
        return self._next is None or self._next.handle(req)


class AuthHandler(Handler):
    def handle(self, req: Request) -> bool:
        if req.token != "secret":
            print("401 Unauthorized")
            return False
        return super().handle(req)


class RateLimitHandler(Handler):
    def __init__(self, limit: int) -> None:
        super().__init__()
        self.limit = limit
        self.counts: dict[str, int] = defaultdict(int)

    def handle(self, req: Request) -> bool:
        self.counts[req.user] += 1
        if self.counts[req.user] > self.limit:
            print("429 Too Many Requests")
            return False
        return super().handle(req)


class ValidationHandler(Handler):
    def handle(self, req: Request) -> bool:
        if not req.payload.strip():
            print("400 Bad Request")
            return False
        print("200 OK:", req.payload)
        return super().handle(req)


if __name__ == "__main__":
    chain = AuthHandler()
    chain.set_next(RateLimitHandler(2)).set_next(ValidationHandler())
    for token, payload in [("bad", "x"), ("secret", "order-1"), ("secret", ""), ("secret", "order-2")]:
        chain.handle(Request("alice", token, payload))`,
    },
    related: ["command", "decorator", "composite", "mediator"],
    problems: ["logger", "atm", "vending-machine"],
  },
  {
    id: "template-method",
    name: "Template Method",
    category: "behavioral",
    intent:
      "Define the skeleton of an algorithm in a base-class method, deferring some steps to subclasses. Subclasses redefine certain steps without changing the algorithm's structure.",
    problem:
      "Several classes implement nearly the same algorithm with small variations, leading to duplicated code that drifts apart over time. You want the invariant steps written once and only the varying steps overridden.",
    whenToUse: [
      "Multiple classes share an algorithm whose overall structure is fixed but some steps vary.",
      "You want to enforce the order of steps while allowing customisation.",
      "Frameworks need hooks where users plug in behaviour (setup, teardown, onStart).",
      "Game loops with a fixed turn sequence but game-specific rules.",
    ],
    whenNotToUse: [
      "The variations are large enough that the shared skeleton is mostly empty.",
      "Steps need to be swapped at runtime or combined freely (prefer Strategy and composition).",
      "Deep inheritance hierarchies already make the code hard to follow.",
    ],
    uml: {
      classes: [
        {
          name: "ReportGenerator",
          kind: "abstract",
          attributes: [],
          methods: [
            "+ generate(): String {final}",
            "# fetchData(): List<String[]>",
            "# header(): String {abstract}",
            "# formatRow(row: String[]): String {abstract}",
            "# footer(): String",
          ],
        },
        { name: "CsvReport", kind: "class", attributes: [], methods: ["# header(): String", "# formatRow(row: String[]): String"] },
        {
          name: "HtmlReport",
          kind: "class",
          attributes: [],
          methods: ["# header(): String", "# formatRow(row: String[]): String", "# footer(): String"],
        },
      ],
      relations: [
        { from: "CsvReport", to: "ReportGenerator", type: "inheritance" },
        { from: "HtmlReport", to: "ReportGenerator", type: "inheritance" },
      ],
    },
    example:
      "collections.abc.Sequence implements most list methods on top of your __getitem__() and __len__(), and unittest.TestCase's setUp/test/tearDown lifecycle is a template method. Board games share a play-turn loop with game-specific move rules.",
    advantages: [
      "Removes duplication by placing invariant steps in one place.",
      "Enforces a consistent algorithm structure.",
      "Hooks give controlled extension points.",
    ],
    disadvantages: [
      "Relies on inheritance, which couples subclasses tightly to the base class.",
      "Subclasses can only vary the steps the base class exposes.",
      "Can violate the Liskov Substitution Principle if a subclass suppresses a step.",
      "Following control flow between base and subclass can be confusing (the Hollywood principle).",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class ReportGenerator(ABC):
    def generate(self) -> list[str]:
        """Template method: the fixed skeleton. Subclasses do not override it."""
        lines = [self.header()]
        lines.extend(self.format_row(row) for row in self.fetch_data())
        footer = self.footer()
        if footer:
            lines.append(footer)
        return lines

    def fetch_data(self) -> list[tuple[str, int]]:   # shared step
        return [("Alice", 42), ("Bob", 17)]

    @abstractmethod
    def header(self) -> str: ...                     # required steps

    @abstractmethod
    def format_row(self, row: tuple[str, int]) -> str: ...

    def footer(self) -> str:                         # hook: optional override
        return ""


class CsvReport(ReportGenerator):
    def header(self) -> str:
        return "name,score"

    def format_row(self, row: tuple[str, int]) -> str:
        return f"{row[0]},{row[1]}"


class HtmlReport(ReportGenerator):
    def header(self) -> str:
        return "<table><tr><th>name</th><th>score</th></tr>"

    def format_row(self, row: tuple[str, int]) -> str:
        return f"<tr><td>{row[0]}</td><td>{row[1]}</td></tr>"

    def footer(self) -> str:
        return "</table>"


if __name__ == "__main__":
    for report in (CsvReport(), HtmlReport()):
        for line in report.generate():
            print(line)`,
    },
    related: ["factory-method", "strategy"],
    problems: ["tic-tac-toe", "snake-and-ladder", "coffee-machine"],
  },
  {
    id: "iterator",
    name: "Iterator",
    category: "behavioral",
    intent:
      "Provide a way to access the elements of an aggregate object sequentially without exposing its underlying representation.",
    problem:
      "Clients that traverse a collection by reaching into its internal array, list or tree become coupled to that structure. You also may want several traversal orders, or several traversals in progress at once.",
    whenToUse: [
      "A collection has a complex internal structure that clients should not depend on.",
      "You need multiple traversal strategies (forward, reverse, filtered, tree orders).",
      "Several independent traversals must run concurrently over the same collection.",
      "You want custom collections to work with the language's for-each loop.",
    ],
    whenNotToUse: [
      "The collection is a simple built-in list and its native iteration already suffices.",
      "Random access by index is the main access pattern.",
      "Writing a custom iterator class would duplicate what the language already provides (e.g. a generator).",
    ],
    uml: {
      classes: [
        { name: "Iterable", kind: "interface", attributes: [], methods: ["+ iterator(): Iterator"] },
        { name: "Iterator", kind: "interface", attributes: [], methods: ["+ hasNext(): boolean", "+ next(): String"] },
        {
          name: "Playlist",
          kind: "class",
          attributes: ["- songs: List<String>"],
          methods: ["+ add(song: String): void", "+ iterator(): Iterator", "+ reverseIterator(): Iterator"],
        },
        { name: "ForwardIterator", kind: "class", attributes: ["- index: int"], methods: ["+ hasNext(): boolean", "+ next(): String"] },
        { name: "ReverseIterator", kind: "class", attributes: ["- index: int"], methods: ["+ hasNext(): boolean", "+ next(): String"] },
      ],
      relations: [
        { from: "Playlist", to: "Iterable", type: "realization" },
        { from: "ForwardIterator", to: "Iterator", type: "realization" },
        { from: "ReverseIterator", to: "Iterator", type: "realization" },
        { from: "Playlist", to: "ForwardIterator", type: "dependency", label: "creates" },
        { from: "Playlist", to: "ReverseIterator", type: "dependency", label: "creates" },
      ],
    },
    example:
      "Python's for loop is built on it: __iter__ returns an iterator and __next__ yields items until StopIteration. Generators are the shortest way to write one.",
    advantages: [
      "Hides the collection's internal structure (encapsulation).",
      "Supports multiple traversal algorithms and simultaneous traversals.",
      "Gives a uniform interface for traversing different collections.",
      "Lets custom collections plug into language loops.",
    ],
    disadvantages: [
      "Overkill for simple collections with built-in iteration.",
      "Can be less efficient than direct indexed access.",
      "Modifying the collection during iteration needs explicit handling (fail-fast checks).",
    ],
    code: {
      python: `from collections.abc import Iterator


class ForwardIterator(Iterator):
    def __init__(self, songs: list[str]) -> None:
        self._songs = songs
        self._index = 0

    def __next__(self) -> str:
        if self._index >= len(self._songs):
            raise StopIteration
        song = self._songs[self._index]
        self._index += 1
        return song


class ReverseIterator(Iterator):
    def __init__(self, songs: list[str]) -> None:
        self._songs = songs
        self._index = len(songs) - 1

    def __next__(self) -> str:
        if self._index < 0:
            raise StopIteration
        song = self._songs[self._index]
        self._index -= 1
        return song


class Playlist:
    def __init__(self) -> None:
        self._songs: list[str] = []

    def add(self, song: str) -> None:
        self._songs.append(song)

    def __iter__(self) -> Iterator[str]:    # enables for-loops
        return ForwardIterator(self._songs)

    def reverse_iterator(self) -> Iterator[str]:
        return ReverseIterator(self._songs)


if __name__ == "__main__":
    playlist = Playlist()
    for title in ("Intro", "Verse", "Outro"):
        playlist.add(title)
    for song in playlist:
        print("Play", song)
    for song in playlist.reverse_iterator():
        print("Rewind", song)`,
    },
    related: ["composite", "factory-method"],
    problems: ["library-management", "snake-and-ladder"],
  },
  {
    id: "mediator",
    name: "Mediator",
    category: "behavioral",
    intent:
      "Define an object that encapsulates how a set of objects interact, promoting loose coupling by keeping objects from referring to each other explicitly.",
    problem:
      "When many components talk to each other directly, the web of references becomes a tangled many-to-many graph that is hard to change or reuse. Routing communication through a central mediator turns it into simple one-to-many links.",
    whenToUse: [
      "Many objects communicate in complex ways and direct references between them are tangled.",
      "You want to reuse components that would otherwise depend on many peers.",
      "Coordination logic (routing, matching, dispatching) should live in one place.",
      "Examples: chat rooms, air-traffic control, an elevator dispatcher, rider-driver matching.",
    ],
    whenNotToUse: [
      "Only two or three objects interact in simple ways.",
      "The mediator would absorb so much logic that it becomes a god object.",
      "Interactions are simple broadcasts that Observer handles more naturally.",
    ],
    uml: {
      classes: [
        {
          name: "ChatMediator",
          kind: "interface",
          attributes: [],
          methods: ["+ join(user: User): void", "+ send(message: String, sender: User): void"],
        },
        {
          name: "ChatRoom",
          kind: "class",
          attributes: ["- members: List<User>"],
          methods: ["+ join(user: User): void", "+ send(message: String, sender: User): void"],
        },
        {
          name: "User",
          kind: "class",
          attributes: ["- name: String", "- mediator: ChatMediator"],
          methods: ["+ send(message: String): void", "+ receive(message: String, from: String): void"],
        },
      ],
      relations: [
        { from: "ChatRoom", to: "ChatMediator", type: "realization" },
        { from: "ChatRoom", to: "User", type: "aggregation", label: "members" },
        { from: "User", to: "ChatMediator", type: "association", label: "talks via" },
      ],
    },
    example:
      "An air-traffic control tower coordinates planes so they never negotiate with each other directly. asyncio's event loop and MVC controllers coordinating views also act as mediators.",
    advantages: [
      "Reduces many-to-many coupling to one-to-many.",
      "Centralises interaction logic, making it easier to understand and change.",
      "Components become easier to reuse and test in isolation.",
    ],
    disadvantages: [
      "The mediator can grow into a complex god object.",
      "Becomes a single point of failure and potential bottleneck.",
      "Moves complexity rather than eliminating it.",
    ],
    code: {
      python: `from abc import ABC, abstractmethod


class ChatMediator(ABC):
    @abstractmethod
    def join(self, user: "User") -> None: ...

    @abstractmethod
    def send(self, message: str, sender: "User") -> None: ...


class ChatRoom(ChatMediator):
    def __init__(self) -> None:
        self._members: list[User] = []

    def join(self, user: "User") -> None:
        self._members.append(user)

    def send(self, message: str, sender: "User") -> None:
        # Routing logic lives here, not inside the users
        for member in self._members:
            if member is not sender:
                member.receive(message, sender.name)


class User:
    def __init__(self, name: str, mediator: ChatMediator) -> None:
        self.name = name
        self._mediator = mediator
        mediator.join(self)

    def send(self, message: str) -> None:
        self._mediator.send(message, self)   # talks only to the mediator

    def receive(self, message: str, sender: str) -> None:
        print(f"{self.name} got from {sender}: {message}")


if __name__ == "__main__":
    room = ChatRoom()
    alice, bob, carol = User("Alice", room), User("Bob", room), User("Carol", room)
    alice.send("Hi all")
    bob.send("Hey Alice")`,
    },
    related: ["observer", "facade", "command"],
    problems: ["elevator-system", "ride-sharing", "meeting-room-scheduler"],
  },
];
