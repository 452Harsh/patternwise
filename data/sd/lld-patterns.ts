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
    problem: "If your code creates objects directly, like EmailNotification(), it is tied to that exact class. To add SmsNotification, you must edit every place that creates notifications. Factory Method moves the creation into one method, so the rest of the workflow stays the same.",
    whenToUse: [
      "A class does not know in advance which exact object it will need to create.",
      "You want subclasses or plugins to decide which objects a framework creates.",
      "You want creation code kept apart from the code that uses the object.",
      "You expect to add new kinds of objects over time, like a new notification channel.",
    ],
    whenNotToUse: [
      "There is only one kind of object, and there will probably never be another.",
      "A normal constructor call or a simple helper function is clear enough.",
      "You would add a whole extra set of creator classes that cost more than they save.",
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
    example: "Python's __iter__() is a factory method. Each collection class returns its own iterator object. UI frameworks also use it, so each platform's dialog creates its own native buttons.",
    advantages: [
      "The calling code does not depend on the exact class being created.",
      "Follows the Open/Closed Principle (code is open to new features but closed to edits). You add new types by adding new creators, not by changing callers.",
      "Creation code lives in one place, so each class has one job (Single Responsibility).",
      "Frameworks can offer clear hooks that subclasses fill in.",
    ],
    disadvantages: [
      "You may end up with one creator subclass for every product class.",
      "It adds an extra step, which is too much for simple object creation.",
      "In Python, making a subclass just to change one created type is heavy. Passing a function or a class as an argument is often simpler.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Factory Method?",
        a: "I use it when a piece of code needs to create an object, but the exact type should be decided later. For example, a notifier class has a create_notification() method. EmailNotifier returns an email object and SmsNotifier returns an SMS object. The notify_user() logic stays the same for both.",
      },
      {
        q: "What is the difference between Factory Method and Abstract Factory?",
        a: "Factory Method creates one kind of product, and a subclass decides which version. Abstract Factory creates a whole family of related products, like a button and a checkbox that must match the same theme. You can think of an Abstract Factory as a group of factory methods that belong together.",
      },
      {
        q: "Is Factory Method the same as a simple factory function?",
        a: "Not exactly. A simple factory is one function with an if/else, like make_notification(kind), that returns the right object. Factory Method uses inheritance: a base class calls a method, and subclasses override it to pick the object. In Python, the simple factory or passing a class as an argument is often enough.",
      },
      {
        q: "Where have you seen Factory Method in Python?",
        a: "The __iter__() method is a good example. Each collection, like list or dict, returns its own iterator object. The for loop does not care which iterator class it gets, it just calls next() on it.",
      },
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
    problem: "Some systems use groups of objects that must match, like light theme buttons with light theme menus. If you create each class by hand everywhere, it is easy to mix a dark button with a light menu by mistake. Abstract Factory puts each matching group behind one factory, so you always get a consistent set.",
    whenToUse: [
      "Objects come in families that must always be used together.",
      "You want to swap a whole family (a theme, a platform, a vendor) with one config change.",
      "Your code should depend only on interfaces (a list of methods a class promises to have), not on exact classes.",
      "You are building a library and want to show users only the interfaces, not the real classes.",
    ],
    whenNotToUse: [
      "There is only one family, or the objects have nothing to do with each other.",
      "You add new kinds of products often. Each new kind forces a change to every factory.",
      "A single Factory Method or a plain constructor would do the job.",
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
    example: "Python's DB-API works like this. Each driver module (sqlite3, psycopg) gives you its own matching connection and cursor objects. Cross-platform UI toolkits use one factory per OS to create matching native widgets.",
    advantages: [
      "Objects from the same family always work well together.",
      "Your code never needs to name the exact classes it uses.",
      "Switching a whole family is a one-line change.",
      "All creation code for one family sits in one place.",
    ],
    disadvantages: [
      "Adding a new kind of product means changing the interface and every factory.",
      "It adds many interfaces and classes.",
      "It is over-engineering if you only have one family today.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Abstract Factory?",
        a: "I use it when I have families of objects that must match. For example, a LightThemeFactory makes a light button and a light menu, and a DarkThemeFactory makes the dark versions. The app gets one factory at startup and never mixes themes by mistake.",
      },
      {
        q: "What is the main downside of Abstract Factory?",
        a: "Adding a new kind of product is painful. If I add a create_slider() method, every factory must now implement it. So it works best when the list of product kinds is stable, but new families may be added.",
      },
      {
        q: "Abstract Factory vs Builder?",
        a: "Abstract Factory creates several related objects, usually in one call each. Builder creates one complex object step by step and returns it at the end. Use Abstract Factory for matching families, and Builder for one object with many options.",
      },
      {
        q: "Where have you seen Abstract Factory in Python?",
        a: "Database drivers that follow the DB-API are a good example. sqlite3.connect() gives a connection, and that connection gives a matching cursor. If you switch to psycopg, you get a different but matching connection and cursor pair. Your code just calls the same methods.",
      },
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
    problem: "Some objects have many optional settings, like a Pizza with size, crust, cheese and ten toppings. A constructor with ten arguments is hard to read, and setting fields one by one can leave a half-built object. Builder lets you set options step by step, check them, and then get one finished object.",
    whenToUse: [
      "A constructor would need many arguments, especially optional ones.",
      "You want the final object to be immutable (cannot change after creation) but built in steps.",
      "You need to check several fields together before the object is created.",
      "The same building steps should be able to produce different versions of the object.",
    ],
    whenNotToUse: [
      "The object has only two or three required fields.",
      "Python keyword arguments with default values already make the call easy to read.",
      "The object is simple and can safely change later, so plain attribute setting is fine.",
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
    example: "argparse.ArgumentParser is a builder: you add arguments step by step, then call parse_args(). SQLAlchemy's select(...).where(...).order_by(...) is also a builder.",
    advantages: [
      "Building code is easy to read, often with chained method calls.",
      "You get immutable objects without huge constructors.",
      "All validation happens in one place, the build() method.",
      "The same steps can produce different versions of the object.",
    ],
    disadvantages: [
      "You need an extra builder class, which often repeats the same fields.",
      "A missing required field is only caught when the code runs, unless the builder asks for it up front.",
      "It is too much for small objects.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Builder?",
        a: "I use it when an object has many optional parts and I want readable, safe creation. For example, QueryBuilder().select('name').where('age > 18').limit(10).build(). Each step is clear, and build() checks everything before returning the final object.",
      },
      {
        q: "Do you really need Builder in Python?",
        a: "Often no. Python has keyword arguments and default values, and dataclasses make simple objects easy. Builder is still useful when the object is built over several steps, needs validation across fields, or is assembled by different parts of the code.",
      },
      {
        q: "What is the telescoping constructor problem?",
        a: "It is when you add more and more constructor versions or arguments for optional fields. Calls end up like Pizza(12, True, False, True, None), and nobody knows what each value means. Builder fixes this by giving each option a named step.",
      },
      {
        q: "Builder vs Factory Method?",
        a: "Factory Method decides which class to create, usually in one call. Builder focuses on how to put together one complex object in many steps. You could even combine them, with a factory that returns the right builder.",
      },
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
    problem: "Some things should exist only once in a program, like a logger, a config registry, or a connection pool. If different parts of the code create their own copies, you waste resources or get settings that disagree. Singleton makes sure only one instance is ever created, and everyone shares it.",
    whenToUse: [
      "Exactly one object must control a shared resource, like a logger, config or connection pool.",
      "The object should be created lazily (only when first needed).",
      "You want tight control over global state instead of using a bare global variable.",
    ],
    whenNotToUse: [
      "You just want easy access. Passing one shared object into the classes that need it (dependency injection) is easier to test.",
      "The object holds data for one request or one user.",
      "Unit tests need to replace or reset the object easily.",
      "In distributed systems, one instance per process does not mean one instance across all servers.",
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
    example: "Python modules are singletons: a module is imported once and then cached in sys.modules. logging.getLogger(name) always returns the same logger for the same name. App-wide config objects are often singletons too.",
    advantages: [
      "There is only one instance, and everyone knows where to get it.",
      "Lazy creation means you only pay the cost when it is first used.",
      "It is safer than a raw global variable because creation is controlled.",
    ],
    disadvantages: [
      "It creates hidden global state. Classes secretly depend on it.",
      "It is hard to mock or reset in unit tests.",
      "With threads, you need care, like a lock, so two threads do not create two instances.",
      "It breaks the Single Responsibility Principle (one class, one job), because it does its own work and also controls its own creation.",
    ],
    interviewQuestions: [
      {
        q: "How do you make a Singleton in Python?",
        a: "The simplest way is a module, because Python imports a module only once. If you need a class, you can override __new__ to store and return one saved instance. With threads, wrap the first creation in a threading.Lock so two threads cannot both create it.",
      },
      {
        q: "Why is Singleton often called an anti-pattern?",
        a: "It acts like a global variable, so any code can change it from anywhere. Classes that use it hide that dependency, which makes the code harder to understand. It also makes tests hard, because state leaks from one test to the next.",
      },
      {
        q: "What would you use instead of a Singleton?",
        a: "Usually I create one object at startup and pass it to whoever needs it. This is called dependency injection. You still have only one instance, but tests can easily pass in a fake one.",
      },
      {
        q: "Is a Singleton thread-safe by default?",
        a: "No. If two threads check 'is there an instance yet?' at the same time, both may create one. You fix this with a lock around the creation, or by creating the instance eagerly at import time.",
      },
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
    problem: "Some objects are expensive to create, for example they load files or need lots of setup. Sometimes your code also does not know the exact class of the object it wants to duplicate. Prototype lets you make new objects by copying an existing, already set-up object.",
    whenToUse: [
      "Creating an object is costly (heavy setup, reading files) and copying is cheaper.",
      "You need many objects that differ only a little from a few preset versions.",
      "Your code must copy objects without knowing their exact classes.",
      "You want a registry (a lookup table) of ready-made templates that code can copy when needed.",
    ],
    whenNotToUse: [
      "Objects are cheap to create with a normal constructor.",
      "Objects hold things that cannot really be copied, like open sockets, file handles or threads.",
      "The objects point to each other in loops, which makes deep copying easy to get wrong.",
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
    example: "Python's copy.copy() and copy.deepcopy() exist for exactly this. Game engines copy pre-built enemy or particle templates instead of building each one from scratch.",
    advantages: [
      "You can copy objects without depending on their exact classes.",
      "You avoid repeating expensive setup.",
      "A few preset objects can replace many small subclasses that differ only in settings.",
      "New presets can be added while the program runs.",
    ],
    disadvantages: [
      "You must choose between shallow and deep copy carefully, or copies may share data they should not share.",
      "Copying objects with loops or outside resources is tricky.",
      "copy.deepcopy() can copy much more than you wanted and can be slow. A custom clone() method or __deepcopy__ is often better.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Prototype?",
        a: "I use it when building an object is slow or complex, and I need many similar ones. For example, in a game I set up one Goblin with its stats and images once. Then each new goblin is a copy, and I only change its position.",
      },
      {
        q: "What is the difference between a shallow copy and a deep copy?",
        a: "A shallow copy makes a new outer object, but the inner objects are shared. So if the copy has a list inside, changing that list also changes the original. A deep copy copies everything inside too, so the two objects are fully separate.",
      },
      {
        q: "How do you implement Prototype in Python?",
        a: "Usually with the copy module. copy.copy(obj) gives a shallow copy and copy.deepcopy(obj) gives a deep copy. If you need control, you can define a clone() method or __deepcopy__ to choose what gets copied.",
      },
      {
        q: "What are the risks of Prototype?",
        a: "The main risk is shared mutable data from a shallow copy, which causes confusing bugs. Another risk is copying things that should not be copied, like a database connection. Deep copies of big objects can also be slow.",
      },
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
    problem: "You want to use an existing class or third-party SDK, but its methods do not match what your code expects. For example, your code calls pay(amount), but the vendor SDK has make_payment(cents, currency). Adapter is a small wrapper that translates between the two, so you do not change either side.",
    whenToUse: [
      "You use a third-party or old component whose API you cannot change.",
      "Several vendors have different APIs and you want one common interface (a fixed set of methods your code calls).",
      "You are moving slowly from an old interface to a new one.",
    ],
    whenNotToUse: [
      "You own both sides and can just change one of them to match.",
      "The interfaces already match, so a wrapper adds nothing.",
      "You want to simplify a whole subsystem, not translate one interface. Use Facade for that.",
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
    example: "io.TextIOWrapper adapts a binary stream into a text stream. csv.reader adapts any iterable of text lines into rows.",
    advantages: [
      "You reuse existing code without changing it.",
      "Translation code stays separate from business logic, so each class has one job (Single Responsibility).",
      "You can add new adapters without touching the code that uses them (Open/Closed Principle: add new code instead of editing old code).",
    ],
    disadvantages: [
      "It adds one more class and one more layer to go through.",
      "If the two interfaces are very different, the adapter gets complex and may not hide all the differences.",
      "Too many adapters may hide the fact that the interfaces should be redesigned.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Adapter?",
        a: "I use it when I need to plug in code with the wrong shape. For example, my app expects a PaymentGateway with pay(amount). The Stripe SDK has a different method. I write StripeAdapter with pay(amount) that calls the Stripe method inside.",
      },
      {
        q: "Adapter vs Facade?",
        a: "Adapter changes one interface into another interface that the client already expects. Facade creates a new, simpler interface over many classes. Adapter is about making things fit, and Facade is about making things easy.",
      },
      {
        q: "Adapter vs Decorator?",
        a: "Both wrap an object. An adapter changes the interface but keeps the behaviour. A decorator keeps the same interface but adds new behaviour, like logging or caching.",
      },
      {
        q: "Where have you seen Adapter in Python?",
        a: "io.TextIOWrapper is a good example. It takes a binary stream that returns bytes and makes it look like a text stream that returns strings. Your code can then read text lines without caring about the bytes underneath.",
      },
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
    problem: "Imagine a coffee shop with extras like milk, caramel and extra shots. Making a subclass for every mix (MilkCaramelEspresso, DoubleMilkEspresso, and so on) creates far too many classes. Decorator lets you wrap the coffee in extras one by one, at runtime, without changing the original class.",
    whenToUse: [
      "Optional features must be mixed freely while the program runs.",
      "Using subclasses for every mix of features would create too many classes.",
      "You want to add general behaviour like logging, caching or compression around an object without the caller noticing.",
      "The class you want to extend comes from a library and you cannot or should not change it.",
    ],
    whenNotToUse: [
      "There is only one fixed extra. A subclass or a simple flag is clearer.",
      "The order of the wrappers changes behaviour in subtle, confusing ways.",
      "Callers need to know the exact type of the object, because wrapping hides it.",
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
    example: "Python's I/O stack uses decorators: io.BufferedReader(gzip.GzipFile(...)) wraps one stream in another. @functools.lru_cache and web middleware follow the same idea.",
    advantages: [
      "You add behaviour at runtime without changing or subclassing the original class.",
      "Features can be combined in any order and any number.",
      "Each decorator does just one job.",
      "You avoid a huge number of classes for every mix of features.",
    ],
    disadvantages: [
      "Many small wrapper objects make debugging and stack traces harder to read.",
      "Removing one wrapper from the middle of a stack is awkward.",
      "Behaviour can change depending on the wrapping order.",
      "Identity checks (is) fail because the wrapper is a different object from the original.",
    ],
    interviewQuestions: [
      {
        q: "When would you use the Decorator pattern?",
        a: "I use it when I want to add optional features to an object and mix them freely. For example, Milk(Caramel(Espresso())). Each wrapper adds its own cost and description, then calls the object inside. I can stack as many as I want.",
      },
      {
        q: "Is the Decorator pattern the same as a Python @decorator?",
        a: "They share the same idea but are not the same thing. A Python @decorator wraps a function to add behaviour, like @lru_cache adding caching. The design pattern wraps an object that has the same methods as the original. Both add behaviour without changing the original code.",
      },
      {
        q: "Decorator vs Proxy?",
        a: "Both wrap an object and keep the same interface. A decorator adds extra features, and you often stack several of them. A proxy controls access to the real object, for example lazy loading or permission checks, and usually there is just one.",
      },
      {
        q: "What are the downsides of Decorator?",
        a: "You end up with many small objects, which makes debugging harder. The order of wrappers can matter, for example compress then encrypt is different from encrypt then compress. Also, the wrapped object is no longer the same object, so identity checks fail.",
      },
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
    problem: "Placing an order might need calls to inventory, payment and shipping, in the right order. If every caller does this by hand, they all depend on those details and the order of calls. Facade gives one simple method, like place_order(), that hides all of that.",
    whenToUse: [
      "A common task needs several subsystem classes to be called in a specific order.",
      "You want callers to stay independent of a complex subsystem that changes often.",
      "You want clear entry points into each layer of your system.",
    ],
    whenNotToUse: [
      "The subsystem is already simple, so the facade would just pass calls through one by one.",
      "Callers often need detailed control that the facade would hide.",
      "The facade keeps collecting unrelated jobs and turns into a god object (one class that knows and does too much).",
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
    example: "The requests library is a facade: requests.get(url) hides connection pools, headers and retries handled by lower layers. A service method like place_order() is a facade over inventory, payment and shipping.",
    advantages: [
      "A complex subsystem becomes simple to use.",
      "Callers depend less on the subsystem's inner details (lower coupling, meaning less dependence between parts).",
      "The subsystem classes are still available when someone needs advanced control.",
    ],
    disadvantages: [
      "It can grow into a god object that depends on every class in the app.",
      "It is one more layer that must be updated when the subsystem changes.",
      "It may hide useful features if it is the only way in.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Facade?",
        a: "I use it when callers need to coordinate many classes to do one common task. For example, an OrderService.place_order() checks stock, charges the card and schedules shipping. The caller makes one call instead of three, and does not need to know the right order.",
      },
      {
        q: "Facade vs Adapter?",
        a: "Facade makes a new, simpler interface over many classes. Adapter makes one existing class fit an interface the client already expects. So Facade is for simplifying, and Adapter is for translating.",
      },
      {
        q: "Can a Facade become a problem?",
        a: "Yes. If you keep adding unrelated methods, it becomes a god object that touches everything. Then any change in the system means changing the facade. Keep each facade focused on one area, and still allow direct access to the subsystem when needed.",
      },
      {
        q: "Where have you seen Facade in Python?",
        a: "The requests library is a good example. requests.get(url) hides sessions, connection pools, encoding and redirects. Most users never touch the lower layers, but they are still there if you need them.",
      },
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
    problem: "Sometimes using an object directly is a problem. It may be slow to load, live on another server, or need permission checks, caching or logging. Proxy is a stand-in object with the same methods that adds this control, without changing the real object or its callers.",
    whenToUse: [
      "Virtual proxy: wait to create a heavy object until it is really needed.",
      "Protection proxy: check permissions before passing a call on.",
      "Remote proxy: stand in for an object that lives in another process or on another machine.",
      "Caching or logging proxy: add caching or logging around calls without callers noticing.",
    ],
    whenNotToUse: [
      "The real object is cheap and needs no access control.",
      "The extra delay from one more layer is not acceptable in very hot, performance-critical code.",
      "You need to stack many optional features. Decorator fits better.",
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
    example: "SQLAlchemy lazy-loads related rows behind proxy attributes. unittest.mock.Mock stands in for real objects in tests, and xmlrpc.client.ServerProxy is a remote proxy.",
    advantages: [
      "It controls access to the real object without callers noticing.",
      "It makes lazy loading, caching, access control and remote calls possible.",
      "The real object can be swapped or managed on its own (Open/Closed Principle: add new code instead of editing old code).",
    ],
    disadvantages: [
      "It adds one more layer and can add delay.",
      "Results may come late or fail in surprising places, for example an error when lazy loading happens.",
      "More classes to maintain.",
    ],
    interviewQuestions: [
      {
        q: "What are the common types of Proxy?",
        a: "A virtual proxy delays creating a heavy object until it is used. A protection proxy checks permissions before passing calls on. A remote proxy hides the fact that the real object is on another machine. A caching proxy saves results so repeated calls are fast.",
      },
      {
        q: "Proxy vs Decorator?",
        a: "Both wrap an object with the same interface. A proxy is about controlling access, like lazy loading or security, and it often manages the real object itself. A decorator is about adding features, and you usually stack several of them.",
      },
      {
        q: "Give an example of a Proxy you would write.",
        a: "Say an ImageProxy has the same display() method as a real Image. The proxy stores only the file path at first. When display() is called the first time, it loads the real image and then forwards the call. Code that never displays the image never pays the loading cost.",
      },
      {
        q: "Where have you seen Proxy in Python?",
        a: "unittest.mock.Mock is a stand-in that records calls instead of doing real work. xmlrpc.client.ServerProxy lets you call methods that actually run on a remote server. SQLAlchemy's lazy relationships load data from the database only when you first access them.",
      },
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
    problem: "Some data is naturally a tree, like folders that hold files and other folders. Without a shared interface, your code is full of checks like 'is this a file or a folder?'. Composite gives files and folders the same methods, such as size(), so the code can treat any node the same way.",
    whenToUse: [
      "Your data is a part-whole tree, like file systems, org charts, UI widgets or menus.",
      "Callers should handle single items and groups through one interface.",
      "Operations like size, price or render naturally repeat over the children.",
    ],
    whenNotToUse: [
      "The structure is flat, or always just one or two levels deep.",
      "Single items and groups behave so differently that one shared interface would be misleading.",
      "You need strict rules about which children each node may have.",
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
    example: "In Tkinter, a Frame holds other widgets and is also a widget itself. Python's ast module (a Module node that holds statement nodes) and the browser DOM are composites too.",
    advantages: [
      "Callers treat single items and groups the same way, so code is simpler.",
      "It is easy to add new node types (Open/Closed Principle: add new code instead of editing old code).",
      "Recursive operations over the tree become natural and short.",
    ],
    disadvantages: [
      "The shared interface can be too general. For example, a file may have an add() method that makes no sense for it.",
      "It is hard to limit which items can be children of which.",
      "In deep trees, recursive operations can be slow unless you cache results.",
    ],
    interviewQuestions: [
      {
        q: "When would you use Composite?",
        a: "I use it when data forms a tree and I want to treat one item and a group the same way. For example, File and Folder both have size(). File returns its own size. Folder returns the sum of size() for all its children, so the caller just calls size() on anything.",
      },
      {
        q: "What is the difference between a leaf and a composite?",
        a: "A leaf is a single item with no children, like a file. A composite is a container that holds children, like a folder. Both share the same interface, and the composite usually passes the work down to its children.",
      },
      {
        q: "What is the main trade-off in Composite?",
        a: "You choose between safety and simplicity. If add() is on the shared interface, callers are simple, but a leaf has a useless add() method. If add() is only on the composite, it is safer, but callers must check the type before adding children.",
      },
      {
        q: "Composite vs Decorator?",
        a: "Both use objects that hold other objects with the same interface. Composite holds many children and combines their results, like a folder summing sizes. Decorator wraps exactly one object and adds behaviour to it.",
      },
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
    problem: "Sometimes a class changes in two separate ways at once. For example, you have remote types (basic, advanced) and device types (TV, radio). With inheritance alone you need a class for every pair, like BasicTVRemote and AdvancedRadioRemote, and the number of classes keeps multiplying. Bridge splits the two into separate groups and links them with a reference, so each group can grow on its own.",
    whenToUse: [
      "A class changes in two or more ways that do not depend on each other.",
      "You want to switch the implementation (the part that does the real work) while the program runs.",
      "You want to add new subclasses on either side without breaking the other side.",
      "You want to hide platform-specific details from the code that uses the class.",
    ],
    whenNotToUse: [
      "There is only one implementation and only one way the class changes.",
      "The two parts are closely linked and always change together.",
      "Simply passing in a strategy object already solves the problem.",
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
    example: "Python's DB-API works like a bridge. Your code always calls connect(), cursor() and execute(), and each database driver does the real work behind them. Sending different message types (alert, daily digest) over different channels (email, SMS) is another common case.",
    advantages: [
      "Stops the class explosion you get from combining two dimensions.",
      "Both sides can grow on their own. This follows the Open/Closed Principle (code is open to new features but closed to edits).",
      "You can swap the implementation while the program runs.",
      "The code that uses the class does not see the implementation details.",
    ],
    disadvantages: [
      "Adds extra classes and an extra layer when there is only one dimension.",
      "You must spot the two independent dimensions early in the design.",
      "The shared implementation interface (the list of methods every implementation must have) may shrink to only what all platforms can support.",
    ],
    interviewQuestions: [
      {
        q: "When would you use the Bridge pattern?",
        a: "I use it when a class varies in two separate directions. For example, shapes (circle, square) and renderers (vector, raster). Without Bridge I would need a class for every pair, like VectorCircle and RasterSquare. With Bridge, a Shape holds a Renderer object, so I add new shapes or new renderers on their own.",
      },
      {
        q: "What is the difference between Bridge and Adapter?",
        a: "Adapter fixes a mismatch after the fact. You have two existing classes that do not fit, and you add a wrapper so they can work together. Bridge is planned up front. You split a design into two parts on purpose so both parts can grow independently. They look similar in code, but the goal is different.",
      },
      {
        q: "How is Bridge different from Strategy?",
        a: "Both use composition, which means one object holds another and calls it. Strategy is about swapping one algorithm inside a class. Bridge is about splitting a whole class hierarchy into two hierarchies. In Bridge, the abstraction side also has its own subclasses, not just the implementation side.",
      },
      {
        q: "What are the downsides of Bridge?",
        a: "It adds an extra layer and more classes. If there is really only one dimension of change, that extra layer is just noise. Also, the shared implementation interface can end up very basic, because it can only include what every implementation supports.",
      },
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
    problem: "A class that picks an algorithm with a long if/elif chain gets harder to change and test every time you add an option. For example, a parking lot price function with branches for hourly, flat and weekend pricing. Strategy puts each algorithm in its own class or function with the same method, so you can add or swap them without touching the main class.",
    whenToUse: [
      "There are several versions of an algorithm (pricing, sorting, routing, matching), and more may come.",
      "The algorithm must be chosen or changed while the program runs.",
      "You want to replace if/elif chains that choose behaviour with separate classes that share a method.",
      "You want to test each algorithm on its own, away from the class that uses it.",
    ],
    whenNotToUse: [
      "There are only one or two algorithms, and they rarely change.",
      "Passing a simple function or lambda is enough, and extra classes would only add noise.",
      "The caller should not need to know about, or pick from, the different options.",
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
    example: "The key= function you pass to sorted() is a strategy. A parking lot that switches between hourly, flat and weekend pricing, or a ride app that picks a fare or matching algorithm, are classic uses.",
    advantages: [
      "You can swap the algorithm while the program runs, without changing the main class.",
      "Removes long if/elif chains that choose behaviour.",
      "New strategies are added without editing old code. This follows the Open/Closed Principle (open to new features, closed to edits).",
      "Each algorithm lives on its own and is easy to test.",
    ],
    disadvantages: [
      "The caller must know the different strategies to pick the right one.",
      "Adds more classes, even for tiny algorithms.",
      "A strategy may need data from the main class, so you may end up passing a lot of arguments.",
    ],
    interviewQuestions: [
      {
        q: "When would you use the Strategy pattern?",
        a: "I use it when I have several ways to do the same job and want to pick one at runtime. A good example is payment: card, UPI or wallet. Each one is a separate strategy with a pay() method. The checkout code just calls strategy.pay(amount) and does not care which one it is.",
      },
      {
        q: "Strategy vs State: what is the difference?",
        a: "The code structure looks almost the same. In Strategy, the caller picks the algorithm and it usually stays fixed. In State, the object changes its own state object as things happen, like a vending machine moving from idle to has-coin. So Strategy is about choosing how to do something, and State is about behaviour that changes as the object moves through stages.",
      },
      {
        q: "Do you need classes for Strategy in Python?",
        a: "Not always. Python functions are objects, so you can just pass a function. For example, sorted(items, key=lambda x: x.price) uses a function as the strategy. I use classes only when the strategy needs its own data or several methods.",
      },
      {
        q: "What are the downsides of Strategy?",
        a: "You get more small classes or functions to manage. The caller must also know which strategy to choose, so that choice logic has to live somewhere, often in a factory. For just two simple options, a plain if statement is usually clearer.",
      },
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
    problem: "Several objects need to react when one object changes. For example, when an order status changes, you must send an email, an SMS and a push notice. If the order class calls each of these directly, it is tightly coupled (strongly tied) to all of them, and every new reaction means editing the order class. Checking for changes in a loop (polling) wastes work.",
    whenToUse: [
      "A change in one object must update many other objects, and that list can grow.",
      "Listeners should be able to subscribe or unsubscribe while the program runs.",
      "The main object should not need to know the exact classes of its listeners.",
      "You are building event systems, UI updates or notification fan-out (one event sent to many places).",
    ],
    whenNotToUse: [
      "There is exactly one fixed listener. A direct call is simpler.",
      "The order of notifications or guaranteed delivery matters. Use a queue or explicit steps instead.",
      "Listeners would trigger other listeners in chains that are hard to follow and debug.",
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
    example: "GUI callbacks (Tkinter's bind, addEventListener in the browser), Django signals and libraries like RxPY are built on Observer. A typical LLD case is an order status change that is sent to email, SMS and push notifiers.",
    advantages: [
      "Loose coupling (objects are only lightly tied). The subject only knows that listeners have an update method.",
      "New listeners can be added without changing the subject. This follows the Open/Closed Principle (open to new features, closed to edits).",
      "Listeners can subscribe and unsubscribe at runtime.",
      "A natural fit for event-driven designs.",
    ],
    disadvantages: [
      "The order in which listeners are told is usually not defined.",
      "If you forget to unsubscribe, old listeners stay in memory. This is a memory leak, called the lapsed listener problem.",
      "Chains or loops of updates between listeners can be hard to debug.",
      "If notifications run one after another, one slow listener holds up all the others.",
    ],
    interviewQuestions: [
      {
        q: "Explain the Observer pattern with an example.",
        a: "One object, called the subject, keeps a list of listeners, called observers. When something changes, it loops over the list and calls each observer's update method. For example, a YouTube channel notifies all subscribers when a new video is uploaded. The channel does not care who the subscribers are.",
      },
      {
        q: "Observer vs Pub/Sub: what is the difference?",
        a: "In Observer, the subject holds direct references to its observers and calls them itself. In Pub/Sub, there is a message broker in the middle, like Kafka or Redis. Publishers and subscribers do not know about each other at all. Pub/Sub is often asynchronous and works across services, while Observer is usually in one program.",
      },
      {
        q: "What problems can Observer cause?",
        a: "Memory leaks are common if observers never unsubscribe, because the subject keeps them alive. The order of notifications is not guaranteed. Also, if notifications are synchronous, one slow observer delays all the others. In Python, a weakref.WeakSet can help with the memory leak issue.",
      },
      {
        q: "Where have you seen Observer in Python?",
        a: "Django signals like post_save are Observer. You connect a receiver function, and Django calls it every time a model is saved. GUI event handlers in Tkinter and reactive libraries like RxPY also follow this pattern.",
      },
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
    problem: "When the code that starts an action is wired straight to the code that does it, you cannot queue, log, retry or undo that action. For example, a text editor button that calls document.delete() directly has no way to undo the delete. Command turns each request into an object, so it can be stored, passed around and reversed.",
    whenToUse: [
      "You need undo/redo or a history of operations.",
      "Requests should be queued, scheduled, retried or run on another machine.",
      "Buttons or triggers should be set up with different actions.",
      "You want to log operations so you can replay them after a crash.",
    ],
    whenNotToUse: [
      "Actions are simple direct calls with no need for queuing, logging or undo.",
      "A plain callback or lambda already keeps things separate enough.",
      "Making one class per operation would bloat a small codebase.",
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
    example: "A function you submit to concurrent.futures.ThreadPoolExecutor is a command. Text editors do undo/redo by keeping a stack of command objects. Elevator floor requests can be modelled as a queue of commands.",
    advantages: [
      "Separates the object that starts an action from the object that does the work.",
      "Makes undo/redo, queuing, scheduling and logging possible.",
      "Small commands can be combined into a bigger macro command.",
      "New commands can be added without changing existing code.",
    ],
    disadvantages: [
      "You add a class for every operation, so there is more code.",
      "Undo needs enough saved data to reverse each action, which can get complex.",
      "The extra layer can make the flow of the program harder to follow.",
    ],
    interviewQuestions: [
      {
        q: "How would you implement undo/redo with the Command pattern?",
        a: "Each command has execute() and undo() methods. When a command runs, I push it on an undo stack. To undo, I pop it, call undo(), and push it on a redo stack. Any new command clears the redo stack. For example, an InsertTextCommand remembers the position and text so its undo can remove them.",
      },
      {
        q: "Command vs Strategy: what is the difference?",
        a: "Both wrap behaviour in an object. Strategy is about how to do one job, with interchangeable algorithms for the same task. Command is about what to do, as a request object that can be stored, queued or undone. A command usually holds its receiver and arguments, ready to run later.",
      },
      {
        q: "Do you need Command classes in Python?",
        a: "For simple cases, no. A function or functools.partial already works as a command you can store and call later. I use command classes when I need extra things like undo(), a name for logging, or saved state.",
      },
      {
        q: "What are the main parts of the Command pattern?",
        a: "There is the Command with an execute method. The Receiver is the object that does the real work. The Invoker is what triggers the command, like a button or a queue. The Client creates the command and connects it to the receiver. This split lets the invoker run any command without knowing what it does.",
      },
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
    problem: "Some objects behave differently in each state. A vending machine can be idle, have a coin, or be sold out. Often every method gets a big if/elif on the state, and adding a new state means editing all of them. State moves each state's behaviour into its own class, so the rules for each state live in one place.",
    whenToUse: [
      "An object's behaviour depends on its state, and it has several clear states.",
      "Many methods have big if/elif blocks that check the same state field.",
      "The rules for moving between states should be clear and testable.",
      "You are modelling state machines (systems that move between fixed stages), like vending machines, elevators, ATMs or order lifecycles.",
    ],
    whenNotToUse: [
      "There are only two or three states with simple behaviour. An enum with a few if checks is clearer.",
      "States rarely change and the rules for moving between them are simple.",
      "A transition table (a lookup of state plus event to next state) describes the machine better.",
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
    example: "A vending machine that takes coins only when idle, and gives a product only after payment. A TCP connection that acts differently when listening, open or closed is another example.",
    advantages: [
      "Removes big if/elif blocks that check the state.",
      "Each state's behaviour and moves live in one class. This follows the Single Responsibility Principle (each class has one job).",
      "New states can be added without editing old ones. This follows the Open/Closed Principle (open to new features, closed to edits).",
      "State changes are clear and easy to test.",
    ],
    disadvantages: [
      "Adds more classes.",
      "The rules for moving between states are spread across many classes, so the whole machine is harder to see at once.",
      "Too much for a few simple states.",
    ],
    interviewQuestions: [
      {
        q: "When would you use the State pattern?",
        a: "I use it when an object has clear stages and acts differently in each one. A vending machine is the classic case: idle, has coin, dispensing, sold out. Each state is a class with methods like insert_coin() and select_item(). The machine just forwards calls to its current state object.",
      },
      {
        q: "State vs Strategy: what is the difference?",
        a: "The structure is almost the same: a context holds an object and forwards calls to it. In Strategy, the client usually picks the strategy once. In State, the state objects switch the context to the next state themselves. Also, states usually know about each other, while strategies are independent.",
      },
      {
        q: "Who should change the state, the context or the state classes?",
        a: "Both work. If the state classes change it, each state knows its own next step, which keeps rules local but spreads them out. If the context changes it, all rules sit in one place, which is easier to read. For interviews, letting state classes call context.set_state() is the common answer.",
      },
      {
        q: "What are the downsides of the State pattern?",
        a: "You get one class per state, so small machines become heavy. The transition rules are scattered, so it is hard to see the whole machine at once. For simple cases, an Enum plus a dict that maps (state, event) to the next state is often cleaner.",
      },
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
    problem: "A request often has to pass through a series of checks, like login check, rate limit and input validation. If you hard-code that sequence in one big function, it is hard to change. Chain of Responsibility puts each check in its own handler and links them, so you can add, remove or reorder steps easily.",
    whenToUse: [
      "Several objects might handle a request, and you do not know which one ahead of time.",
      "A request must pass through an ordered list of checks or processing steps.",
      "The handlers or their order should be set up while the program runs.",
      "Examples include web middleware, approval workflows, log-level filtering and ATM note dispensing.",
    ],
    whenNotToUse: [
      "There is only one handler, or the order never changes.",
      "Every request must be handled, and a request silently falling off the end would be dangerous.",
      "A long chain would be too slow or too hard to debug.",
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
    example: "Django and WSGI middleware form a chain of responsibility. So do logging tools that pass a record through DEBUG, INFO and ERROR handlers. An ATM that pays out 100s, then 50s, then 20s is a classic exercise.",
    advantages: [
      "The sender does not need to know which handler deals with the request.",
      "Handlers can be added, removed or reordered without changing the others. This follows the Open/Closed Principle (open to new features, closed to edits).",
      "Each handler does one job.",
    ],
    disadvantages: [
      "A request may reach the end of the chain without being handled.",
      "Debugging means following the request through many objects.",
      "Long chains add delay, and a badly set up chain can loop forever.",
    ],
    interviewQuestions: [
      {
        q: "Explain Chain of Responsibility with an example.",
        a: "Each handler has a reference to the next handler. It either handles the request, stops it, or passes it on. For example, in a leave approval system, a team lead approves up to 2 days, a manager up to 10, and a director anything more. The request moves up the chain until someone can approve it.",
      },
      {
        q: "Where do you see this pattern in real Python code?",
        a: "Django middleware is the best known example. Each middleware gets the request, can reject it or change it, and then calls the next one. Python's logging module also passes records to handlers and up to parent loggers.",
      },
      {
        q: "What happens if no handler handles the request?",
        a: "By default it just falls off the end, which can hide bugs. A good design adds a final default handler at the end of the chain. That handler can return an error, raise an exception or log a warning.",
      },
      {
        q: "Chain of Responsibility vs Decorator: what is the difference?",
        a: "They look similar because both link objects together. A decorator always passes the call on and adds extra behaviour around it. A chain handler can decide to stop the request and not pass it on. So the chain is about who handles a request, while a decorator is about adding features.",
      },
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
    problem: "Sometimes several classes run almost the same steps with small differences. For example, CSV, JSON and XML report exporters all open a file, write a header, write rows and close the file. Copying that flow into each class leads to duplicate code that slowly drifts apart. Template Method writes the shared steps once in a base class, and subclasses only fill in the steps that differ.",
    whenToUse: [
      "Several classes share the same overall steps, but some steps differ.",
      "You want to force a fixed order of steps but still allow changes to some of them.",
      "A framework needs hooks (empty methods that users can override), like setup, teardown or on_start.",
      "Game loops that have a fixed turn order but rules that differ per game.",
    ],
    whenNotToUse: [
      "The differences are so big that the shared outline is almost empty.",
      "Steps need to be swapped while the program runs, or mixed freely. Prefer Strategy and composition (holding objects instead of inheriting).",
      "Deep inheritance trees already make the code hard to follow.",
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
    example: "collections.abc.Sequence gives you most list methods once you write __getitem__() and __len__(). The setUp, test and tearDown lifecycle in unittest.TestCase is also a template method. Board games share a play-turn loop but have their own move rules.",
    advantages: [
      "Removes duplicate code by putting the shared steps in one place.",
      "Keeps the order of steps the same in every subclass.",
      "Hooks give safe, controlled places to add custom behaviour.",
    ],
    disadvantages: [
      "It depends on inheritance, so subclasses are tightly tied to the base class.",
      "Subclasses can only change the steps the base class allows.",
      "It can break the Liskov Substitution Principle (a subclass should work anywhere its parent works) if a subclass skips a step.",
      "The flow jumps between base class and subclass, which can be confusing. This is called the Hollywood principle: do not call us, we will call you.",
    ],
    interviewQuestions: [
      {
        q: "Explain the Template Method pattern.",
        a: "The base class has one method that runs the steps in a fixed order. Some steps are written in the base class. Others are left for subclasses to fill in. For example, a DataExporter.export() method calls open(), write_header(), write_rows() and close(), and a CSVExporter only overrides write_header and write_rows.",
      },
      {
        q: "Template Method vs Strategy: which would you choose?",
        a: "Template Method uses inheritance, and you pick the behaviour by choosing a subclass. Strategy uses composition, and you pass in an object that can be swapped at runtime. I prefer Strategy when the varying part must change at runtime or be mixed and matched. Template Method is fine when the outline is fixed and there are only a few variants.",
      },
      {
        q: "What is a hook method?",
        a: "A hook is a step in the template that has a default, often empty, version in the base class. Subclasses can override it if they want, but they do not have to. For example, setUp() in unittest.TestCase does nothing by default, but you can override it to prepare test data.",
      },
      {
        q: "Where is Template Method used in Python?",
        a: "unittest.TestCase is a common example: the framework calls setUp, then your test method, then tearDown. collections.abc classes like Sequence also use it. You write __getitem__ and __len__, and you get methods like __contains__, index and count for free.",
      },
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
    problem: "If code loops over a collection by reaching into its inner list, array or tree, that code breaks when the inner structure changes. For example, if a Playlist stores songs in a list and you later switch to a linked list, every loop must change. You may also want different ways to walk the data, or several loops running at the same time. Iterator gives one standard way to walk through items without seeing how they are stored.",
    whenToUse: [
      "A collection has a complex inner structure that other code should not depend on.",
      "You need several ways to walk the data (forward, reverse, filtered, tree orders).",
      "Several separate loops must run over the same collection at the same time.",
      "You want your own collection classes to work in a normal Python for loop.",
    ],
    whenNotToUse: [
      "The collection is a simple built-in list, and normal looping is enough.",
      "You mostly need to jump to items by index.",
      "A full iterator class would just repeat what Python already gives you, such as a generator.",
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
    example: "Python's for loop is built on this pattern. __iter__ returns an iterator, and __next__ gives items one by one until it raises StopIteration. Generators (functions that use yield) are the shortest way to write one.",
    advantages: [
      "Hides how the collection stores its data. This is called encapsulation.",
      "Supports different ways to walk the data, and several walks at the same time.",
      "Gives one common way to loop over different kinds of collections.",
      "Lets your own collections work with Python's for loop.",
    ],
    disadvantages: [
      "Too much for simple collections that already support looping.",
      "Can be slower than reading items directly by index.",
      "Changing the collection while looping over it needs special care, such as checks that raise an error right away.",
    ],
    interviewQuestions: [
      {
        q: "How does iteration work in Python?",
        a: "A for loop first calls iter() on the object, which calls __iter__ and returns an iterator. Then it calls next() again and again, which calls __next__. When there are no more items, __next__ raises StopIteration and the loop ends. Any object that follows these rules works in a for loop.",
      },
      {
        q: "What is the difference between an iterable and an iterator?",
        a: "An iterable is something you can loop over, like a list. It has __iter__ and can give you a fresh iterator each time. An iterator is the object that keeps track of the current position and has __next__. A list is iterable but not an iterator, while a generator is both.",
      },
      {
        q: "Why use a generator instead of an iterator class?",
        a: "A generator is much shorter. You write a function with yield, and Python creates __iter__ and __next__ for you. It also saves memory, because it produces items one at a time instead of building a full list. For example, reading a huge file line by line with a generator uses very little memory.",
      },
      {
        q: "What happens if you change a collection while iterating over it?",
        a: "It can cause bugs, like skipped items. In Python, changing the size of a dict during a loop raises RuntimeError. A list does not raise an error, but removing items while looping can skip elements. The safe way is to loop over a copy, or build a new collection.",
      },
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
    problem: "When many objects talk to each other directly, every object holds references to many others. This creates a tangled web that is hard to change or reuse. For example, in a chat app, if each user sends messages straight to every other user, adding one user touches everyone. Mediator puts one central object in the middle, so each object only talks to the mediator.",
    whenToUse: [
      "Many objects talk to each other in complex ways, and the direct links are tangled.",
      "You want to reuse objects that would otherwise depend on many others.",
      "Coordination logic (routing, matching, dispatching) should live in one place.",
      "Examples include chat rooms, air-traffic control, an elevator dispatcher and matching riders with drivers.",
    ],
    whenNotToUse: [
      "Only two or three objects interact in simple ways.",
      "The mediator would take on so much logic that it becomes a god object (one huge class that does everything).",
      "The objects only need simple broadcasts, which Observer handles more naturally.",
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
    example: "An air-traffic control tower guides planes, so planes never talk to each other directly. Python's asyncio event loop and MVC controllers that coordinate views also act as mediators.",
    advantages: [
      "Turns many-to-many links into simple one-to-many links.",
      "Puts the interaction logic in one place, so it is easier to understand and change.",
      "Objects become easier to reuse and to test on their own.",
    ],
    disadvantages: [
      "The mediator can grow into a complex god object (one huge class that does everything).",
      "It becomes a single point of failure and can slow things down if everything goes through it.",
      "It moves complexity to one place rather than removing it.",
    ],
    interviewQuestions: [
      {
        q: "Explain the Mediator pattern with an example.",
        a: "Instead of objects talking to each other directly, they all talk to one central mediator. A chat room is a good example. A user calls room.send(message), and the room decides who receives it. Users do not need references to each other, so adding or removing a user is easy.",
      },
      {
        q: "Mediator vs Observer: what is the difference?",
        a: "Observer is one-way: a subject broadcasts changes to listeners that it does not really know. Mediator is two-way coordination: objects send messages to the mediator, and it decides what to do and who to call. A mediator usually contains real logic, like matching a rider to a driver. In practice a mediator is often built using Observer inside.",
      },
      {
        q: "Mediator vs Facade: what is the difference?",
        a: "A Facade gives the outside world one simple entry point to a complex subsystem, and the parts inside do not know about it. A Mediator sits between peer objects, and those objects do know about it and talk through it. So Facade simplifies access from outside, while Mediator organises communication between parts.",
      },
      {
        q: "What are the risks of using a Mediator?",
        a: "The biggest risk is that the mediator becomes a god object that knows and does everything. It can also become a bottleneck or a single point of failure. To limit this, keep the mediator focused on coordination only, and leave the real business logic in the components.",
      },
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
