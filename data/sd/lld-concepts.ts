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
    why: "It keeps an object's data safe. Outside code cannot put the object into a broken state, like a bank account with a negative balance. You can also change the inside of the class later without breaking the code that uses it.",
    whenToUse: [
      "Any class whose data has rules, for example a balance that must never go below zero.",
      "When you may want to change how data is stored later, without touching the code that uses the class.",
      "Core objects in LLD problems, such as Account, ParkingSpot or Order.",
    ],
    howItWorks: [
      "Keep fields private. In Python, start the name with an underscore, like self._balance. Use @property to let others read a value but not change it.",
      "Give the class action methods, like deposit and withdraw. Do not just give a setter for every field.",
      "Check the input inside those methods. This keeps the invariant (a rule that must always be true, like 'balance is never negative') safe.",
      "When you return an internal list, return a copy or a tuple. Then callers cannot change your data by accident.",
    ],
    pros: [
      "The rules are checked in one place only.",
      "You can change how the data is stored inside, and callers do not notice.",
      "The public part of the class is small and easy to understand.",
      "Debugging is easier, because data only changes through a few known methods.",
    ],
    cons: [
      "A getter and setter for every field adds extra code and protects nothing.",
      "Returning a real internal list lets callers change it. This quietly breaks encapsulation.",
      "Hiding too much can make testing hard, if tests have no way to set up or check state.",
    ],
    interviewQuestions: [
      {
        q: "How is encapsulation different from abstraction?",
        a: "Encapsulation is about protecting data. It hides the fields and only lets you change them through safe methods. Abstraction is about hiding complexity. It shows only what something does, not how it does it. For example, a BankAccount hides its balance field, which is encapsulation. A Notifier with just a send method hides whether it uses email or SMS, which is abstraction.",
      },
      {
        q: "Why is a public setter for every field considered a bad sign?",
        a: "If every field has a setter, anyone can put any value in, so the rules are not protected. It is almost the same as making the fields public, just with more code. It is better to have methods that describe real actions, like withdraw(amount), which can check that the balance stays positive.",
      },
      {
        q: "How would you stop callers from changing a list returned by a getter?",
        a: "Do not return the internal list itself. Return a copy, or better, a tuple, which cannot be changed. For example, a history property can return tuple(self._history). Then the caller can read the items, but the object's real list stays safe.",
      },
      {
        q: "Python has no private keyword. How do _name, __name and @property give you encapsulation?",
        a: "A single underscore, like _balance, is a convention that means 'internal, please do not touch'. A double underscore, like __balance, triggers name mangling, so the name becomes _ClassName__balance and is harder to reach by accident. @property lets you expose a read-only value, or add checks when a value is set. None of these are strict, but together they make the intended public API clear.",
      },
      {
        q: "What does encapsulation look like in a parking lot design?",
        a: "A ParkingSpot keeps its vehicle in a private field. Other code calls park(vehicle) and unpark() instead of setting the field directly. The park method checks that the spot is free and that the vehicle fits. So a spot can never hold two cars at once.",
      },
    ],
    related: ["abstraction", "high-cohesion", "class-design", "low-coupling"],
    example: {
      language: "python",
      code: `class BankAccount:
    def __init__(self) -> None:
        self._balance_cents = 0              # hidden state (by convention)
        self._history: list[str] = []

    def deposit(self, cents: int) -> None:
        if cents <= 0:
            raise ValueError("must be positive")
        self._balance_cents += cents
        self._history.append(f"deposit {cents}")

    def withdraw(self, cents: int) -> None:
        if cents > self._balance_cents:
            raise ValueError("insufficient funds")
        self._balance_cents -= cents
        self._history.append(f"withdraw {cents}")

    @property
    def balance(self) -> int:               # read-only from outside
        return self._balance_cents

    @property
    def history(self) -> tuple[str, ...]:
        return tuple(self._history)          # no leaking mutable state`,
    },
  },
  {
    id: "abstraction",
    track: "lld",
    category: "oop",
    name: "Abstraction",
    summary: "Exposing only the essential behavior of a thing while hiding how it is implemented, typically via interfaces or abstract classes.",
    why: "Callers only need to know what something does, not how it does it. This makes code easier to think about. It also lets you swap one implementation for another without changing the callers.",
    whenToUse: [
      "When there are several ways to do the same job, like many payment gateways or storage backends.",
      "When you want to hide a complex part of the system behind a few simple methods.",
      "When you draw the borders between modules in an LLD design.",
      "When you want to test code using fake or mock objects.",
    ],
    howItWorks: [
      "Find the behavior the caller really needs, for example 'send a message'.",
      "Write that behavior as an abstract base class (abc.ABC) or a typing.Protocol. This is the interface (a list of methods a class promises to have).",
      "Write concrete classes, like EmailNotifier and SmsNotifier, that do the real work and hide the details.",
      "Make the caller accept the abstract type, like Notifier, not a specific class.",
    ],
    pros: [
      "Caller code becomes simpler.",
      "You can swap the implementation without changing the caller.",
      "Testing is easier, because you can pass in a fake object.",
    ],
    cons: [
      "Adding an abstraction when there is only one implementation just adds extra layers.",
      "A leaky abstraction still forces callers to know the hidden details.",
      "A wrong abstraction is expensive to fix once many parts of the code use it.",
    ],
    interviewQuestions: [
      {
        q: "What is the difference between abstraction and encapsulation?",
        a: "Abstraction decides what to show. It gives a simple view, like a Notifier with only a send method. Encapsulation decides what to protect. It hides the data inside an object and controls how it changes. They often work together, but abstraction is about design of the interface, and encapsulation is about guarding state.",
      },
      {
        q: "When would you choose an abc.ABC over a typing.Protocol?",
        a: "Use an ABC when you want classes to clearly inherit from a base, and you want Python to stop you creating an object that misses a method. An ABC can also share common code with its children. Use a Protocol when you want duck typing (if it has the right methods, it fits), with no inheritance needed. A Protocol is good for classes you do not own, like a third party client.",
      },
      {
        q: "What is a leaky abstraction? Give an example.",
        a: "A leaky abstraction is one where the hidden details still affect the caller. For example, a Storage interface hides whether data is in memory or in a remote database. But if the remote version is slow or can throw network errors, the caller must still handle that. So the details 'leak' through the simple interface.",
      },
      {
        q: "How do you decide the right level of abstraction for a module?",
        a: "Start from what the callers actually need, not from what the implementation can do. Keep the interface small, with methods named in business terms, like charge(order) instead of post_http_request. Add an abstraction when you have, or clearly expect, more than one implementation, or when you need it for testing. If there is only one implementation and no real need, keep it simple.",
      },
      {
        q: "Give an example of abstraction in a payment system.",
        a: "I would define a PaymentGateway with one method, pay(amount). Then StripeGateway and PayPalGateway implement it. The checkout code only calls gateway.pay(amount). It does not know which company handles the payment, so adding a new gateway needs no change to checkout.",
      },
    ],
    related: ["encapsulation", "interface-design", "dependency-inversion", "polymorphism"],
    example: {
      language: "python",
      code: `from abc import ABC, abstractmethod


# Clients only know "a notifier can send a message"
class Notifier(ABC):
    @abstractmethod
    def send(self, user_id: str, message: str) -> None: ...


class EmailNotifier(Notifier):
    def send(self, user_id: str, message: str) -> None:
        email = lookup_email(user_id)        # SMTP details hidden
        smtp_client.send(email, message)


class SmsNotifier(Notifier):
    def send(self, user_id: str, message: str) -> None:
        sms_gateway.post(lookup_phone(user_id), message)


# Caller code is unaware of SMTP or SMS gateways
def alert(notifier: Notifier, user_id: str) -> None:
    notifier.send(user_id, "Your order has shipped")`,
    },
  },
  {
    id: "inheritance",
    track: "lld",
    category: "oop",
    name: "Inheritance",
    summary: "A mechanism where a subclass acquires the fields and behavior of a parent class, modeling an \"is-a\" relationship.",
    why: "A child class can reuse the code of a parent class. The child can also be used anywhere the parent is expected, which is the base of polymorphism.",
    whenToUse: [
      "When there is a real and stable 'is-a' link, for example a SavingsAccount is an Account.",
      "When a base class defines the main steps, and child classes fill in some steps (the template method idea).",
      "When a framework gives you a base class that is meant to be extended.",
    ],
    howItWorks: [
      "Write a base class with the shared data and behavior.",
      "Write child classes using class Child(Parent). Add new methods or override (replace) existing ones.",
      "Call super().__init__() or super().method() to reuse the parent's code.",
      "Use a child object anywhere the parent type is expected.",
    ],
    pros: [
      "Reusing code is simple and direct.",
      "It fits natural family trees of types, like Vehicle, Car and Bike.",
      "It enables polymorphism, so one call can run different code for each type.",
    ],
    cons: [
      "Parent and child are tightly linked. A small change in the parent can break the children. This is called the fragile base class problem.",
      "Deep chains of inheritance are hard to read and hard to change.",
      "A child can break the promises of its parent. This breaks the Liskov Substitution Principle (a child must work anywhere the parent works).",
      "Python allows multiple inheritance, but it is easy to misuse. The MRO (the order Python searches classes for a method) can get confusing.",
    ],
    interviewQuestions: [
      {
        q: "What is the fragile base class problem?",
        a: "It happens when a change to a parent class breaks its child classes, even though the children were not touched. Children often depend on how the parent works inside, not just its public methods. For example, if the parent's add_all starts calling add, a child that counts items in add may now count them twice. That is why deep inheritance is risky.",
      },
      {
        q: "When is inheritance the right choice over composition?",
        a: "Use inheritance when there is a true and stable 'is-a' link, and the child can be used everywhere the parent is used without surprises. A Car is a Vehicle is a good case. If you only want to reuse some code, or the behavior may change at runtime, composition is usually better. A common rule is to prefer composition and use inheritance only when the is-a link is clear.",
      },
      {
        q: "How does Python's method resolution order (MRO) solve the diamond problem?",
        a: "The diamond problem is when class D inherits from B and C, and both inherit from A. Python builds one fixed search order using the C3 algorithm, for example D, B, C, A, object. Each class appears only once, so A's method is not run twice. You can see the order with D.__mro__, and super() follows this order.",
      },
      {
        q: "Is making Square a subclass of Rectangle a good design?",
        a: "Usually not. A Rectangle lets you set width and height separately. A Square must keep them equal, so setting the width also changes the height. Code that sets width to 5 and height to 2 and expects area 10 will get the wrong answer with a Square. This breaks the Liskov Substitution Principle, so it is better to make them separate shapes.",
      },
      {
        q: "What is the difference between overriding and calling super()?",
        a: "Overriding means the child writes its own version of a parent method, which replaces the parent's version. Calling super() inside that method lets the child also run the parent's version. For example, a child __init__ often calls super().__init__(plate) first and then sets its own extra fields.",
      },
    ],
    related: ["polymorphism", "composition-over-inheritance", "liskov-substitution", "composition"],
    example: {
      language: "python",
      code: `from abc import ABC, abstractmethod


class Vehicle(ABC):
    def __init__(self, plate: str) -> None:
        self.plate = plate

    @abstractmethod
    def wheels(self) -> int: ...

    def describe(self) -> str:
        return f"{type(self).__name__} {self.plate} with {self.wheels()} wheels"


class Car(Vehicle):
    def wheels(self) -> int:
        return 4


class Motorcycle(Vehicle):
    def wheels(self) -> int:
        return 2`,
    },
  },
  {
    id: "polymorphism",
    track: "lld",
    category: "oop",
    name: "Polymorphism",
    summary: "The ability for one interface to have many implementations, so the same call dispatches to different behavior depending on the runtime type.",
    why: "It removes long if/else chains that check an object's type. To add new behavior you add a new class, instead of editing old code.",
    whenToUse: [
      "When you see if/else chains that check a type field, like if vehicle.type == 'car'.",
      "When one task has many variations, like different pricing rules or payment methods.",
      "When you want to handle a list of different objects in the same way.",
    ],
    howItWorks: [
      "Define a common base class or interface (a set of methods that all types promise to have), like Shape with an area method.",
      "Each concrete class writes its own version of that method.",
      "The caller treats every object as the common type and just calls the method.",
      "When the program runs, Python calls the method of the real object's class. Python checks this at runtime, and there is no compile-time overloading like in some languages.",
    ],
    pros: [
      "No more type checking with if/else.",
      "It supports the Open/Closed Principle (add new code without changing old code).",
      "Caller code stays short and the same for every type.",
    ],
    cons: [
      "The logic is spread across many classes, so it is harder to follow.",
      "It is too much when there are only two cases that will never grow.",
      "A bad override can behave differently from what callers expect, and break code.",
    ],
    interviewQuestions: [
      {
        q: "Explain compile-time vs runtime polymorphism.",
        a: "Compile-time polymorphism, also called overloading, means picking a function by its argument types before the program runs. Python does not have this. A later def with the same name just replaces the earlier one, so we use default arguments or functools.singledispatch instead. Runtime polymorphism means the method is chosen while the program runs, based on the real object. In Python, shape.area() runs Circle.area or Rect.area depending on the object.",
      },
      {
        q: "How does Python decide which method to call at runtime?",
        a: "Python looks at the object's actual class and searches for the method along the MRO (the method resolution order, the list of classes to search). The first match wins. Python also uses duck typing: it does not care about the declared type, only whether the object has the method. So any object with an area method works in sum(s.area() for s in shapes).",
      },
      {
        q: "How would you refactor an if/else on vehicle type to use polymorphism?",
        a: "Suppose code says: if type is car, fee is 20; if bike, fee is 10. I would create a Vehicle base class with a parking_fee method. Car and Bike each override it with their own fee. Then the caller just calls vehicle.parking_fee(). Adding a Truck means adding one new class, with no change to the caller.",
      },
      {
        q: "Can static methods be overridden in Python?",
        a: "A child class can define a static method with the same name, and calling it through the child or its instance runs the child's version. But a static method gets no self or cls, so it cannot use the object to choose behavior. Also, code that calls Parent.method() directly always runs the parent's version. So static methods do not give real polymorphism. Use a normal method or a classmethod for that.",
      },
      {
        q: "What is duck typing and how does it relate to polymorphism?",
        a: "Duck typing means 'if it walks like a duck and quacks like a duck, it is a duck'. Python does not check the class, only that the object has the method you call. So two classes with no shared parent can both be used, as long as both have, say, a send method. This is polymorphism without inheritance, and typing.Protocol lets you describe it for type checkers.",
      },
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
    why: "You build a big object from smaller parts, and the big object passes work to them. This is more flexible than a rigid tree of parent and child classes.",
    whenToUse: [
      "When the parts make no sense without their owner. For example, an Order owns its OrderLines.",
      "When you want to build behavior by combining small helper objects.",
      "When you want to choose or swap inner parts when the object is created.",
    ],
    howItWorks: [
      "The owner creates its parts and keeps them as its own fields.",
      "The owner delegates (hands off) work to its parts, for example the order asks each line for its subtotal.",
      "The parts are not shared with any other owner.",
      "When the owner is deleted, its parts go away with it.",
    ],
    pros: [
      "It is clear who owns what, and how long each part lives.",
      "It is flexible. You can change a part without changing the owner's class.",
      "It encourages small classes that each do one job.",
    ],
    cons: [
      "You write more small methods that just pass calls to parts.",
      "Many tiny objects can make the design feel scattered.",
      "Mixing up composition and aggregation can lead to wrong handling of when objects are created or removed.",
    ],
    interviewQuestions: [
      {
        q: "What is the difference between composition and aggregation?",
        a: "Both are 'has-a' links. In composition the whole owns the parts, and the parts die with it. An Order and its OrderLines is an example. In aggregation the parts live on their own and can be shared. A Team and its Players is an example, because a player still exists after leaving the team.",
      },
      {
        q: "How is composition shown in a UML class diagram?",
        a: "It is a line between the two classes with a filled (black) diamond on the side of the owner. For example, Order with a filled diamond, connected to OrderLine. You can also add numbers like 1 and 1..* to show that one order has one or more lines.",
      },
      {
        q: "Give an example of composition in a parking lot design.",
        a: "A ParkingLot owns its Floors, and each Floor owns its ParkingSpots. The lot creates the floors and the floors create the spots. A spot does not exist without its floor, and if the lot is removed, its floors and spots go too. Vehicles are not composition, because they come and go on their own.",
      },
      {
        q: "Why do people say 'prefer composition over inheritance'?",
        a: "Inheritance locks behavior in at class definition and ties the child closely to the parent. Composition lets an object hold a helper and swap it, even at runtime. For example, a Duck can hold a FlyBehavior object instead of having many subclasses for each way of flying. This keeps classes smaller and changes safer.",
      },
      {
        q: "How do you show composition in Python code?",
        a: "The owner creates the part inside itself, usually in __init__ or in a method like add_item. It keeps the part in a private field and does not give it out to be shared. For example, Order.add_item creates a new OrderLine and appends it to self._lines. Python's garbage collector frees the lines once nothing refers to the order.",
      },
    ],
    related: ["aggregation", "association", "composition-over-inheritance", "uml-class-diagrams"],
    example: {
      language: "python",
      code: `from dataclasses import dataclass


@dataclass(frozen=True)
class _OrderLine:                            # private to the order
    sku: str
    qty: int
    price_cents: int

    def subtotal(self) -> int:
        return self.qty * self.price_cents


class Order:
    # Order owns its lines; lines do not exist outside an order
    def __init__(self) -> None:
        self._lines: list[_OrderLine] = []

    def add_item(self, sku: str, qty: int, price_cents: int) -> None:
        self._lines.append(_OrderLine(sku, qty, price_cents))  # created by the owner

    def total(self) -> int:
        return sum(line.subtotal() for line in self._lines)`,
    },
  },
  {
    id: "association",
    track: "lld",
    category: "oop",
    name: "Association",
    summary: "A general structural relationship where one object knows about and uses another, with independent lifecycles.",
    why: "It shows how objects are linked in the real world, like a Driver drives a Car. It does not mean one owns the other.",
    whenToUse: [
      "When objects refer to each other but each can live on its own.",
      "When you need to show multiplicity (how many on each side), like one-to-many or many-to-many.",
      "When you need to move from one object to related ones, like from a Student to their Courses.",
    ],
    howItWorks: [
      "One object holds a reference, or a list of references, to the other object.",
      "Choose the direction. Unidirectional means only one side knows the other. Bidirectional means both sides know each other.",
      "Write the multiplicity, for example 1..* (one or more) or 0..1 (zero or one).",
      "If both sides know each other, update both sides together so they always match.",
    ],
    pros: [
      "It shows real world links directly in code.",
      "Neither object controls when the other is created or deleted.",
      "Multiplicity makes the rules clear, like 'a patient has at least one doctor'.",
    ],
    cons: [
      "Two-way links can easily get out of sync, if one side is updated and the other is not.",
      "Too many links create a tangled web of objects.",
      "A vague link can hide whether one object was meant to own the other.",
    ],
    interviewQuestions: [
      {
        q: "How do association, aggregation and composition differ?",
        a: "Association is the general link: one object knows and uses another, and both live on their own, like Doctor and Patient. Aggregation is a weak 'has-a': a container groups parts that can live on their own, like Team and Players. Composition is a strong 'has-a': the owner controls the parts, and they die with it, like Order and OrderLines. So from weakest to strongest: association, aggregation, composition.",
      },
      {
        q: "When would you make an association bidirectional?",
        a: "Only when both sides really need to find each other often. For example, a doctor needs their patients, and a patient needs their doctors. If only one side needs it, keep it one way, because it is simpler. Two-way links need extra code to keep both sides in sync.",
      },
      {
        q: "How do you represent a many-to-many association in code?",
        a: "The simple way is for each side to hold a set of the other, like doctor._patients and patient._doctors. One method updates both sides, so they stay in sync. If the link has its own data, like an appointment date, create a separate class such as Appointment that refers to both a doctor and a patient.",
      },
      {
        q: "How is association drawn in UML?",
        a: "It is a plain solid line between two classes. An arrow at one end shows that only that direction is navigable. You can write the multiplicity at each end, like 1 and 0..*, and add a label like 'drives'.",
      },
      {
        q: "Give an example of association in a parking lot design.",
        a: "A Ticket refers to a Vehicle and a ParkingSpot. The vehicle and spot exist before the ticket and still exist after it is closed. The ticket just knows about them. That is association, not ownership.",
      },
    ],
    related: ["aggregation", "composition", "dependency", "uml-class-diagrams"],
    example: {
      language: "python",
      code: `class Doctor:
    def __init__(self, name: str) -> None:
        self.name = name
        self._patients: set["Patient"] = set()

    def add_patient(self, p: "Patient") -> None:
        if p not in self._patients:
            self._patients.add(p)
            p._add_doctor(self)              # keep both sides in sync


class Patient:
    def __init__(self, name: str) -> None:
        self.name = name
        self._doctors: set[Doctor] = set()

    def _add_doctor(self, d: Doctor) -> None:
        self._doctors.add(d)

# Many-to-many; each exists independently of the other`,
    },
  },
  {
    id: "aggregation",
    track: "lld",
    category: "oop",
    name: "Aggregation",
    summary: "A weak \"has-a\" relationship where a whole groups parts that can exist independently and may be shared.",
    why: "It shows that a container holds parts but does not own them. If the container is removed, the parts still exist.",
    whenToUse: [
      "A Team has Players, and a player can move to another team.",
      "A Library has Books, and a book exists apart from any one shelf.",
      "When you group objects that are created and managed somewhere else.",
    ],
    howItWorks: [
      "The container holds references to parts that are passed in from outside.",
      "The parts are created on their own first, and then given to the container.",
      "Removing the container leaves the parts untouched.",
      "One part can belong to several containers at the same time.",
    ],
    pros: [
      "It correctly shows shared membership.",
      "The same part can be reused in many containers.",
      "The lives of the container and the parts are not tied together.",
    ],
    cons: [
      "In code it often looks exactly like association, so the difference can be unclear.",
      "A shared part can be changed by another container, which may surprise you.",
      "It can be unclear who should clean up the parts.",
    ],
    interviewQuestions: [
      {
        q: "Give an example of aggregation and composition in the same domain.",
        a: "Take a university. A Department has Professors, and a professor can move to another department or exist without one. That is aggregation. A University has its Departments, and the departments do not exist without the university. That is composition.",
      },
      {
        q: "How is aggregation drawn in UML?",
        a: "It is a line between the classes with an empty (white) diamond on the container's side. For example, Team with an empty diamond, connected to Player. Composition uses a filled diamond instead.",
      },
      {
        q: "Does the difference between aggregation and composition matter in Python, which has garbage collection?",
        a: "Memory is freed automatically, so you do not delete parts by hand. But the difference still matters for design. It tells you who creates the parts, who is allowed to change them, and whether they can be shared. For example, deleting an order should also remove its lines from the database, but deleting a team should not delete its players.",
      },
      {
        q: "How can you tell aggregation from composition by reading Python code?",
        a: "Look at who creates the part. If the part is passed in from outside, like team.sign(player), it is usually aggregation. If the owner creates the part itself and keeps it private, like order.add_item creating an OrderLine, it is usually composition. Also check if the same part can be in two containers.",
      },
      {
        q: "Give an example of aggregation in a parking lot design.",
        a: "A ParkingLot can keep a list of Attendants who work there. The attendants are created as separate objects and can work at another lot too. If the lot closes, the attendants still exist. So the lot aggregates them but does not own them.",
      },
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
    why: "Every class you depend on is one more reason your class may need to change. Seeing these links clearly helps you keep them few and simple.",
    whenToUse: [
      "When a class needs another class only during one method call.",
      "When you pass a helper object as a method argument instead of saving it as a field.",
      "When you study how a change in one class will affect others (coupling, meaning how tightly classes depend on each other).",
    ],
    howItWorks: [
      "The class uses the other type only in a method's parameters, return type or body.",
      "It does not keep a long-lived field pointing to it.",
      "If the used class changes its methods, the class that uses it may need to change too.",
      "In UML it is drawn as a dashed arrow pointing to the class being used.",
    ],
    pros: [
      "It is the lightest kind of coupling between classes.",
      "The helpers are visible right in the method signature.",
      "It is easy to test, because you can just pass a fake object as the argument.",
    ],
    cons: [
      "Hidden dependencies, like creating objects inside a method or calling global modules, make testing hard.",
      "A class that depends on many others is probably doing too many jobs (low cohesion).",
      "Depending on concrete classes instead of abstract ones means changes spread further.",
    ],
    interviewQuestions: [
      {
        q: "How is a dependency different from an association?",
        a: "In an association, the object keeps a reference to the other as a field, so the link lasts. In a dependency, the object only uses the other for a short time, like a method argument or a local variable. For example, a Driver who has a car field is associated with Car. An InvoicePrinter that gets an Invoice only in its print method depends on Invoice.",
      },
      {
        q: "What is a hidden dependency and why is it harmful?",
        a: "A hidden dependency is one you cannot see from the class's constructor or method signature. For example, a method that creates EmailClient() inside itself, or calls a global database module. You cannot easily swap it for a fake in tests, and readers do not know the class needs it. Passing it in as an argument, which is dependency injection, fixes this.",
      },
      {
        q: "How do you show a dependency in a UML class diagram?",
        a: "Draw a dashed line with an open arrow from the class that uses to the class being used. For example, InvoicePrinter with a dashed arrow to Invoice. It is the weakest relationship in UML, weaker than association.",
      },
      {
        q: "How do you reduce the impact of dependencies?",
        a: "Depend on abstractions, like an abc.ABC or typing.Protocol, instead of concrete classes. Pass dependencies in through the constructor or method arguments. Keep the number of dependencies small, so each class has one clear job. For example, a checkout service can take any PaymentGateway, so switching providers does not change it.",
      },
      {
        q: "What is the difference between dependency injection and dependency inversion?",
        a: "Dependency injection is a technique: you pass the objects a class needs from outside, instead of creating them inside. Dependency inversion is a principle: high level code should depend on abstractions, not on low level details. They work well together. For example, OrderService depends on a Notifier abstraction, and an EmailNotifier is injected when the app starts.",
      },
    ],
    related: ["association", "dependency-injection", "dependency-inversion", "low-coupling"],
    example: {
      language: "python",
      code: `class InvoicePrinter:
    # Depends on Invoice and Formatter only for the duration of the call
    def print(self, invoice: "Invoice", formatter: "Formatter") -> str:
        parts = [formatter.header(invoice.id)]
        for item in invoice.items:
            parts.append(formatter.line(item))
        return "".join(parts)

# UML: InvoicePrinter - - -> Invoice, InvoicePrinter - - -> Formatter`,
    },
  },

  // ───────────────────────────── Principles ─────────────────────────────
  {
    id: "single-responsibility",
    track: "lld",
    category: "principles",
    name: "Single Responsibility Principle (SRP)",
    summary: "A class should have one reason to change, meaning it should serve a single actor or concern.",
    why: "When one class does many jobs, a change for one job can break another job. If each class has one job, a change stays in one place. Testing also becomes easier.",
    whenToUse: [
      "A class mixes business rules with saving to a database, formatting, or reading files.",
      "A class keeps getting bigger, and people edit it for unrelated reasons.",
      "To test one small behavior, you must set up many unrelated things.",
    ],
    howItWorks: [
      "List the reasons the class might change. Think about who asks for each change.",
      "Group the methods by those reasons.",
      "Move each group into its own small class with a clear name.",
      "Let a coordinator class, or the caller, use these small classes together.",
    ],
    pros: [
      "Classes are small, focused, and easy to read.",
      "A change touches only one place.",
      "Unit tests are simpler to write.",
    ],
    cons: [
      "Splitting too much creates many tiny classes. You must jump between files to follow the logic.",
      "What counts as one responsibility is a matter of opinion. Teams can argue about it.",
      "A simple feature can end up spread across too many files.",
    ],
    interviewQuestions: [
      {
        q: "What does \"one reason to change\" really mean?",
        a: "It means one group of people, or one concern, should drive changes to the class. For example, the finance team changes tax rules and the design team changes the report layout. If both live in one Report class, two different groups edit the same code. So I split them into a calculator class and a formatter class.",
      },
      {
        q: "Find the SRP problems in a class that validates, saves, and emails a user.",
        a: "That class has three reasons to change. Validation rules can change, the database can change, and the email text or provider can change. I would split it into UserValidator, UserRepository, and WelcomeEmailSender. A small UserService can call them in order.",
      },
      {
        q: "How do you avoid applying SRP too much?",
        a: "I split a class only when I see real, different reasons to change. If two methods always change together, they belong together. I also avoid making classes with only one tiny method and no real purpose. The goal is easier change, not the most classes.",
      },
      {
        q: "How does SRP relate to cohesion?",
        a: "Cohesion (how closely the parts of a class belong together) is high when all methods serve one purpose. SRP is a way to get high cohesion. If a class has one responsibility, its methods and data naturally fit together. A class with many jobs has low cohesion.",
      },
      {
        q: "Is SRP only about classes?",
        a: "No, it applies at every level. A function should do one thing, and a module or service should have one clear purpose. For example, a function named validate_and_save is a hint that it does two jobs. The same idea of one reason to change works everywhere.",
      },
    ],
    related: ["high-cohesion", "open-closed", "class-design", "low-coupling"],
    example: {
      language: "python",
      code: `# Before: one class handles calculation, persistence, and formatting
class ReportBad:
    def calculate_total(self) -> float: ...
    def save_to_db(self) -> None: ...
    def to_html(self) -> str: ...


# After: each class has a single reason to change
class ReportCalculator:
    def total(self, report: "Report") -> float: ...      # business rules


class ReportRepository:
    def save(self, report: "Report") -> None: ...        # persistence


class HtmlReportFormatter:
    def format(self, report: "Report") -> str: ...       # presentation`,
    },
  },
  {
    id: "open-closed",
    track: "lld",
    category: "principles",
    name: "Open/Closed Principle (OCP)",
    summary: "Software entities should be open for extension but closed for modification: add new behavior by adding code, not editing working code.",
    why: "Editing old, tested code to add a feature can break things that already worked. If the code has extension points (places where new code can plug in), you add new behavior by writing new classes instead.",
    whenToUse: [
      "You have an if/elif chain on a type, and it grows with every new feature.",
      "Rules that keep changing, like pricing, discounts, payment methods, or notification channels.",
      "Libraries or frameworks that other teams use and cannot edit.",
    ],
    howItWorks: [
      "Find the part of the code that keeps changing. For example, the type of discount.",
      "Create an abstraction (a common shape, like a Protocol or abc.ABC base class) for that part.",
      "Put each variant in its own class. For example, NoDiscount and VipDiscount.",
      "Make the main code use only the abstraction. To add a new variant, write a new class and pass it in.",
    ],
    pros: [
      "You can add features with little risk to existing code.",
      "It leads to designs that are pluggable and easy to test.",
      "It works well with patterns like Strategy and Decorator.",
    ],
    cons: [
      "If you guess future changes wrongly, you build abstractions nobody needs.",
      "There are more classes and more layers to follow.",
      "You cannot predict every change. Sometimes editing existing code is the right choice.",
    ],
    interviewQuestions: [
      {
        q: "Refactor a discount calculator that uses an if/elif on customer type to follow OCP.",
        a: "I create a DiscountPolicy Protocol with one method, apply(amount). Each customer type becomes its own class, like RegularDiscount and VipDiscount. The Checkout class takes a policy and just calls policy.apply(amount). To add a StudentDiscount, I write a new class and never touch Checkout.",
      },
      {
        q: "Which design patterns help achieve OCP?",
        a: "Strategy is the most common one, because you swap behavior by passing a different object. Decorator lets you add behavior by wrapping an object. Template Method, Observer, and Factory also help. They all let you add new classes instead of editing old ones.",
      },
      {
        q: "Can code be fully closed for modification? Why not?",
        a: "No. You can only be closed against the kinds of change you planned for. If a totally new kind of requirement arrives, you may have to edit the code. The goal is to protect against the changes that happen often, not every possible change.",
      },
      {
        q: "What does \"open for extension, closed for modification\" mean in simple words?",
        a: "Open for extension means you can add new behavior. Closed for modification means you do not edit code that already works. For example, a notification system can support SMS by adding an SmsSender class. The NotificationService code stays the same.",
      },
      {
        q: "How does polymorphism help with OCP?",
        a: "Polymorphism (different classes answering the same method call in their own way) is what makes OCP work. The main code calls policy.apply() without knowing the exact class. Any new class with an apply method can be passed in. So the main code does not need new if/elif branches.",
      },
    ],
    related: ["polymorphism", "single-responsibility", "dependency-inversion", "interface-design", "yagni"],
    example: {
      language: "python",
      code: `from typing import Protocol

# Before: every new type means editing this function
# def discount(kind): if kind == "VIP": ... elif kind == ...


# After: add a new DiscountPolicy class; Checkout never changes
class DiscountPolicy(Protocol):
    def apply(self, amount: float) -> float: ...


class NoDiscount:
    def apply(self, amount: float) -> float:
        return amount


class VipDiscount:
    def apply(self, amount: float) -> float:
        return amount * 0.8


class Checkout:
    def __init__(self, policy: DiscountPolicy) -> None:
        self._policy = policy

    def total(self, amount: float) -> float:
        return self._policy.apply(amount)`,
    },
  },
  {
    id: "liskov-substitution",
    track: "lld",
    category: "principles",
    name: "Liskov Substitution Principle (LSP)",
    summary: "Objects of a subtype must be usable anywhere the base type is expected without breaking correctness.",
    why: "If a subclass behaves differently from what its parent promised, code that uses the parent can break. Then callers must check the exact type, and polymorphism is no longer safe.",
    whenToUse: [
      "You design any inheritance hierarchy, or several classes that share one interface (a set of methods that callers rely on).",
      "A subclass raises NotImplementedError for a method it inherited.",
      "Callers use isinstance checks to treat some subclasses specially.",
    ],
    howItWorks: [
      "Do not make a subclass stricter about its inputs. If the parent accepts any positive amount, the child must too.",
      "Do not make a subclass give weaker results. Also keep the parent's invariants (rules that must always be true, like balance never below zero).",
      "Do not raise new, surprising errors from overridden methods.",
      "If a subclass cannot keep the parent's promises, change the design. Split the interface or use composition (holding another object instead of inheriting).",
    ],
    pros: [
      "Polymorphism is safe and predictable.",
      "You no longer need isinstance checks for special cases.",
      "Your class hierarchy matches reality more closely.",
    ],
    cons: [
      "The parent's promises are often not written down, so problems are hard to spot.",
      "Fixing a problem may mean reshaping the whole class hierarchy.",
      "It can lead to many small interfaces.",
    ],
    interviewQuestions: [
      {
        q: "Why does Square extending Rectangle break LSP?",
        a: "A Rectangle lets you set width and height separately. Code may set width to 5 and height to 2, then expect area 10. A Square must keep both sides equal, so setting the height also changes the width. The area becomes 4, which surprises the caller, so a Square cannot safely replace a Rectangle.",
      },
      {
        q: "Why does Penguin extending Bird with fly() break LSP, and how do you fix it?",
        a: "Bird promises that every bird can fly, but a penguin cannot. So Penguin.fly() must raise an error, and code that loops over birds and calls fly() will crash. The fix is to move fly() into a FlyingBird subclass. Sparrow extends FlyingBird, and Penguin extends only Bird.",
      },
      {
        q: "How do preconditions and postconditions relate to LSP?",
        a: "A precondition is what must be true before a method runs, like amount must be positive. A postcondition is what the method guarantees after it runs, like the balance goes up by amount. A subclass may accept more inputs, but not fewer. It may promise more, but not less.",
      },
      {
        q: "How does LSP relate to interface segregation?",
        a: "Many LSP problems come from fat interfaces that force a class to promise things it cannot do. Splitting the interface into smaller ones, as ISP says, fixes this. Each class then only promises what it can really do. In the Bird example, a separate Flyable role removes the broken fly() method from Penguin.",
      },
      {
        q: "How can you tell, in code, that LSP is being broken?",
        a: "Common signs are overridden methods that raise NotImplementedError or do nothing. Another sign is caller code full of isinstance checks. A third sign is tests that pass for the parent but fail for a subclass. For example, a ReadOnlyAccount whose withdraw() always raises an error breaks code written for Account.",
      },
    ],
    related: ["inheritance", "polymorphism", "interface-segregation", "composition-over-inheritance"],
    example: {
      language: "python",
      code: `from abc import ABC, abstractmethod

# Violation: Penguin cannot honour Bird.fly()
# class Bird:
#     def fly(self): ...
# class Penguin(Bird):
#     def fly(self): raise NotImplementedError


# Compliant: only birds that can fly promise to fly
class Bird(ABC):
    @abstractmethod
    def eat(self) -> None: ...


class FlyingBird(Bird):
    @abstractmethod
    def fly(self) -> None: ...


class Sparrow(FlyingBird):
    def eat(self) -> None: ...
    def fly(self) -> None: ...


class Penguin(Bird):
    def eat(self) -> None: ...

# Any FlyingBird can be substituted safely wherever fly() is called`,
    },
  },
  {
    id: "interface-segregation",
    track: "lld",
    category: "principles",
    name: "Interface Segregation Principle (ISP)",
    summary: "Clients should not be forced to depend on methods they do not use; prefer several small, role-specific interfaces over one fat interface.",
    why: "A big interface (a set of methods a class must provide) forces classes to write fake versions of methods they do not need. It also ties callers to changes they do not care about.",
    whenToUse: [
      "Classes leave some methods empty or raise NotImplementedError.",
      "Different callers use completely different parts of the same interface.",
      "An interface keeps growing with methods that are not related.",
    ],
    howItWorks: [
      "Group the interface's methods by the kind of caller that uses them.",
      "Split them into small interfaces, each named for its role. For example, Printer, Scanner, and Fax.",
      "Let each class provide only the interfaces it really supports.",
      "Make each caller depend on the smallest interface it needs.",
    ],
    pros: [
      "No fake or empty method implementations.",
      "Callers are protected from changes to methods they do not use.",
      "Each interface is clear, and it is easier to create test doubles (fake objects for tests).",
    ],
    cons: [
      "Too many tiny interfaces make the API feel scattered.",
      "It can be harder to see everything a class can do.",
      "Splitting too much adds extra names and wiring to manage.",
    ],
    interviewQuestions: [
      {
        q: "Split a Machine interface with print, scan, and fax for a basic printer.",
        a: "I create three small interfaces: Printer with print, Scanner with scan, and Fax with fax. In Python I can use typing.Protocol for each. BasicPrinter only provides print, so it matches Printer. An OfficeMachine provides all three, and a function that only prints asks for a Printer.",
      },
      {
        q: "How does ISP help with LSP problems?",
        a: "LSP breaks when a class cannot keep a promise from its interface, like a basic printer that cannot fax. With small interfaces, the class simply does not promise fax at all. So there is no method that raises an error. Each class can fully keep every promise it makes.",
      },
      {
        q: "What is the difference between ISP and SRP?",
        a: "SRP is about the class itself. It says a class should have one reason to change. ISP is about what callers see. It says a caller should not depend on methods it does not use. A class can follow SRP but still expose a big interface, or follow ISP through several small interfaces.",
      },
      {
        q: "How do you apply ISP in Python, which has no interface keyword?",
        a: "I use typing.Protocol or abc.ABC to describe small roles. With Protocol, a class matches just by having the right methods, so no inheritance is needed. A function that needs only reading can ask for a Readable protocol instead of a whole File class. This keeps each dependency small.",
      },
      {
        q: "What is a fat interface, and why is it bad?",
        a: "A fat interface has many methods that different callers use for different jobs. For example, a Worker interface with work(), eat(), and sleep() is fat. A RobotWorker would have to fake eat() and sleep(). It also means a change to one method can affect every class and caller.",
      },
    ],
    related: ["interface-design", "liskov-substitution", "single-responsibility", "low-coupling"],
    example: {
      language: "python",
      code: `from typing import Protocol

# Before: one fat interface forces stubs
# class Machine(ABC): print(), scan(), fax() all abstract


# After: role interfaces
class Printer(Protocol):
    def print(self, doc: "Doc") -> None: ...


class Scanner(Protocol):
    def scan(self, doc: "Doc") -> None: ...


class Fax(Protocol):
    def fax(self, doc: "Doc") -> None: ...


class BasicPrinter:                      # satisfies Printer only
    def print(self, doc: "Doc") -> None: ...


class OfficeMachine:                     # satisfies all three
    def print(self, doc: "Doc") -> None: ...
    def scan(self, doc: "Doc") -> None: ...
    def fax(self, doc: "Doc") -> None: ...`,
    },
  },
  {
    id: "dependency-inversion",
    track: "lld",
    category: "principles",
    name: "Dependency Inversion Principle (DIP)",
    summary: "High-level modules should not depend on low-level modules; both should depend on abstractions, and abstractions should be owned by the high-level policy.",
    why: "Business logic should not depend on details like a specific database or email provider. If both depend on a shared abstraction (a simple description of what is needed, without the details), you can change the details without touching the core logic.",
    whenToUse: [
      "Business logic directly creates a database client or HTTP client inside itself.",
      "You need to swap the infrastructure. For example, MySQL to Postgres, or one email provider to another.",
      "You want to unit test the core logic without a real database or network.",
    ],
    howItWorks: [
      "Define an interface in the words the business code needs. For example, OrderRepository with a save method.",
      "Make the high-level class (the one with business rules, like OrderService) depend only on that interface.",
      "Write a low-level class (the one that does the technical work) that implements it. For example, SqlOrderRepository.",
      "Choose and connect the real class in one setup place, usually by passing it in through the constructor (dependency injection).",
    ],
    pros: [
      "Business rules are separate from technical details.",
      "Testing is easy, because you can pass in a fake object.",
      "You can replace the database or other infrastructure without changing business code.",
    ],
    cons: [
      "Creating an interface for everything adds extra layers.",
      "If the interface just copies the low-level library's methods, it does not really help.",
      "Connecting all the objects can get complicated in big apps.",
    ],
    interviewQuestions: [
      {
        q: "What is being \"inverted\" in DIP?",
        a: "Normally, high-level code depends on low-level code, like OrderService using MySQLClient directly. With DIP, the high-level code defines an interface, and the low-level code implements it. So the low-level code now depends on something the high-level side owns. The direction of the dependency is flipped.",
      },
      {
        q: "How is DIP different from dependency injection?",
        a: "DIP is a design principle about which way dependencies point. Both sides should depend on an abstraction. Dependency injection is a technique where you pass an object in, for example through __init__, instead of creating it inside. DI is a common way to follow DIP, but they are not the same thing.",
      },
      {
        q: "Who should own the interface: the high-level or the low-level module?",
        a: "The high-level module should own it. The interface should be written in business terms, like save(order), not database terms. Then the business code never needs to know about SQL. If the database library defined the interface, business code would still depend on database details.",
      },
      {
        q: "Apply DIP to a NotificationService that uses an email client directly.",
        a: "I create a MessageSender Protocol with a send(to, text) method. NotificationService takes a MessageSender in its __init__ and only calls send. EmailSender and SmsSender implement it. In tests I pass a FakeSender that just stores the messages.",
      },
      {
        q: "How does DIP make testing easier?",
        a: "The class does not create its database or network client itself. It receives an object that follows an interface. In a test I pass a simple fake, like an in-memory list that acts as a repository. So the test is fast and needs no real database.",
      },
    ],
    related: ["dependency-injection", "abstraction", "low-coupling", "open-closed"],
    example: {
      language: "python",
      code: `from typing import Protocol


# Abstraction owned by the business layer
class OrderRepository(Protocol):
    def save(self, order: "Order") -> None: ...


# High-level policy depends only on the abstraction
class OrderService:
    def __init__(self, repo: OrderRepository) -> None:
        self._repo = repo

    def place(self, order: "Order") -> None:
        order.validate()
        self._repo.save(order)


# Low-level detail implements the abstraction
class SqlOrderRepository:
    def save(self, order: "Order") -> None:
        ...  # SQL insert`,
    },
  },
  {
    id: "dry",
    track: "lld",
    category: "principles",
    name: "DRY (Don't Repeat Yourself)",
    summary: "Every piece of knowledge should have a single, authoritative representation in the system.",
    why: "When the same logic is copied in many places, the copies slowly become different. Someone fixes a bug in one copy but forgets another, and subtle bugs appear.",
    whenToUse: [
      "The same business rule is written in several places.",
      "Validation or formatting code was copied and pasted.",
      "The same constant, like a tax rate, is typed directly in many places as a magic number.",
    ],
    howItWorks: [
      "Look for repeated knowledge, not just code that looks similar.",
      "Move it into one function, class, or constant with a clear name.",
      "Replace every copy with a call to that one place.",
      "If you are unsure the repetition is real, wait until it appears a third time (the rule of three).",
    ],
    pros: [
      "You fix a bug once, and it is fixed everywhere.",
      "Behavior is the same across the whole codebase.",
      "There is less code to maintain.",
    ],
    cons: [
      "Merging code that only looks similar by accident creates bad coupling (one part depending too much on another).",
      "Extracting too early leads to helpers with many flags that are hard to read.",
      "Shared utility files can become a dumping ground for unrelated code.",
    ],
    interviewQuestions: [
      {
        q: "Is all repeated code a DRY violation? Explain accidental vs real duplication.",
        a: "No. Real duplication is the same knowledge, like the tax rule, written twice. Accidental duplication is code that looks the same today but means different things. For example, two checks that both say len(x) > 8, one for passwords and one for usernames. They may change for different reasons, so I keep them separate.",
      },
      {
        q: "What is the rule of three?",
        a: "It is a simple guideline for when to remove repetition. The first time, you just write the code. The second time, you may copy it but notice it. The third time, you extract it into a shared function, because now you clearly understand the common pattern.",
      },
      {
        q: "How can applying DRY too much increase coupling?",
        a: "If you merge two pieces of code that only look alike, they now share one function. When one caller needs a change, you add a flag or a branch. Soon the shared function is full of if statements, and a change for one caller can break the other. Both callers are now tied together.",
      },
      {
        q: "Is DRY only about code?",
        a: "No, it is about any piece of knowledge. It also covers config values, database schemas, and documentation. For example, if a max order size is set in both the backend and a config file, they can disagree. Keeping one source of truth avoids that.",
      },
      {
        q: "Give a simple example of fixing a DRY violation.",
        a: "Say both the invoice and cart preview multiply the total by 1.18 for tax. If the tax rate changes, someone may update only one place. I create a TAX_RATE constant and a with_tax(amount) function. Both places call with_tax, so the rule lives in one place.",
      },
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
    why: "Simple code is easier to read, debug, and change. In interviews, a simple design also shows that you think clearly.",
    whenToUse: [
      "You must choose between a straightforward solution and a clever one.",
      "Early in an LLD interview, before you add design patterns.",
      "Code reviews where there are more abstractions than real use cases.",
    ],
    howItWorks: [
      "Start with the most direct solution that meets the requirements.",
      "Use the standard library and common Python idioms instead of building your own tools.",
      "Add abstractions only when a real need appears.",
      "When the code grows complex, refactor it to make it simpler again.",
    ],
    pros: [
      "New team members understand the code quickly, and it is easier to maintain.",
      "Fewer bugs and fewer edge cases.",
      "You deliver faster.",
    ],
    cons: [
      "People may use \"keep it simple\" as an excuse to skip structure the code really needs.",
      "A very simple design may need to be reworked when requirements grow.",
      "Different teams have different ideas of what simple means.",
    ],
    interviewQuestions: [
      {
        q: "How do you balance KISS with designing for extensibility?",
        a: "I start simple and add extension points only where change is likely or already known. For example, in a parking lot I might add a PricingStrategy because pricing rules often change. But I would not add a factory for every class. I mention in the interview where I could extend later.",
      },
      {
        q: "Give an example where a design pattern made code worse.",
        a: "Imagine a ParityCheckerFactory that creates an EvenChecker strategy just to check if a number is even. That adds several classes for one line of logic. A simple function like n % 2 == 0 is clearer and has fewer places for bugs. Patterns should solve a real problem.",
      },
      {
        q: "How are KISS and YAGNI different?",
        a: "KISS is about how you build something: choose the simplest way that works. YAGNI (You Aren't Gonna Need It) is about what you build: do not add features until they are needed. They often go together. For example, YAGNI says skip the export feature, and KISS says use a dict instead of a custom cache class.",
      },
      {
        q: "How do you apply KISS in an LLD interview?",
        a: "I first list the core requirements and design the main classes for them. I use clear names and simple relationships, like a ParkingLot that holds a list of floors. Then I add patterns only if the requirements need them, and I explain why. This keeps the design easy to follow in limited time.",
      },
      {
        q: "Does simple mean short or clever code?",
        a: "No. Simple means easy to understand, not the fewest lines. A one-line trick with nested comprehensions may be short but hard to read. A few clear lines with good names are simpler. The goal is that another person can read it and quickly know what it does.",
      },
    ],
    related: ["yagni", "dry", "high-cohesion", "class-design"],
    example: {
      language: "python",
      code: `# Over-engineered: factory + strategy just to check even numbers
# ParityCheckerFactory.create(ParityType.EVEN).check(n)


# Simple and clear
def is_even(n: int) -> bool:
    return n % 2 == 0


# Prefer the standard library over hand-rolled loops
def max_of(xs: list[int]) -> int:
    return max(xs)`,
    },
  },
  {
    id: "yagni",
    track: "lld",
    category: "principles",
    name: "YAGNI (You Aren't Gonna Need It)",
    summary: "Do not build functionality or abstractions until there is an actual, present need for them.",
    why: "Features built just in case take time and make the code more complex. When the real need finally comes, the guess is often wrong anyway.",
    whenToUse: [
      "You want to add settings or a plugin system just in case someone needs it later.",
      "You are about to create an interface (a contract that says which methods a class must have) but you can only think of one class that will use it.",
      "You are deciding how much to build in an LLD interview. Build what was asked for, not more.",
    ],
    howItWorks: [
      "Build only what is needed today and has been confirmed.",
      "Keep the code clean and tested. Then it is cheap to extend later.",
      "Mention possible future features out loud or in notes. Do not write code for them yet.",
      "Add a general solution when a second real use case shows up. For example, add a second exporter only when someone really asks for JSON export.",
    ],
    pros: [
      "Less code to write, read, and maintain.",
      "Real, useful features are delivered faster.",
      "The design follows real needs, not guesses.",
    ],
    cons: [
      "If you ignore a need you already know is coming soon, you may have to redo a lot of work.",
      "Some things are hard to change later, like a public API or a database schema. These deserve some thinking up front.",
      "People sometimes use YAGNI as an excuse for messy, badly structured code.",
    ],
    interviewQuestions: [
      {
        q: "How can YAGNI and the Open/Closed Principle both be true?",
        a: "The Open/Closed Principle says code should be easy to extend without editing old code. YAGNI says do not build things before you need them. They fit together because I keep the code clean so it is easy to extend, but I only add the extension point when a real second case appears. For example, I write one CSV exporter now and add an Exporter interface only when JSON export is really needed.",
      },
      {
        q: "When is it worth designing for future requirements anyway?",
        a: "When the change is very expensive to make later. Public APIs, database schemas, and data formats that other teams use are good examples. It also makes sense when the future need is already confirmed and coming soon, not just a guess. In those cases a little design up front saves a lot of rework.",
      },
      {
        q: "How would you talk about extensibility in an interview without over-building?",
        a: "I build the design for the stated requirements first. Then I say out loud where it could grow, for example: if we later need monthly passes, I would add a new PricingPolicy class. This shows I am thinking ahead. But it keeps the code small and focused on what the interviewer asked.",
      },
      {
        q: "How is YAGNI different from KISS?",
        a: "KISS means keep the solution you build as simple as possible. YAGNI means do not build features you do not need yet. KISS is about how you build something, and YAGNI is about whether you should build it at all. They often work together to keep code small.",
      },
      {
        q: "Can you give an example of breaking YAGNI?",
        a: "Say the requirement is to export orders to CSV. Someone writes a plugin registry with options for compression, encryption, and cloud upload. None of that was asked for, and it all needs testing and maintenance. Following YAGNI, I would write one simple export_csv function.",
      },
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
    why: "When related code lives together in one class, the class is easy to understand. It is also easier to reuse and safer to change.",
    whenToUse: [
      "You are deciding which class a new method should go in.",
      "A class called Manager, Helper, or Utils keeps collecting methods that have nothing to do with each other.",
      "You want to split one big class into smaller classes that each make sense.",
    ],
    howItWorks: [
      "Check each method. Does it use the class's own data? If not, it may belong somewhere else.",
      "Put methods together when they work on the same data and the same idea.",
      "If a method mostly uses another class's data, move it into that other class.",
      "Give classes exact names, like ParkingSpot. A vague name like Utils is often a sign of low cohesion.",
    ],
    pros: [
      "Classes are easier to read and to find your way around.",
      "A change usually stays inside one class.",
      "It naturally leads to low coupling (classes depending less on each other).",
    ],
    cons: [
      "Chasing perfect cohesion can give you too many tiny classes.",
      "You need judgment to decide what belongs together. There is no exact rule.",
      "Moving code around in a large codebase to improve cohesion can be risky and disruptive.",
    ],
    interviewQuestions: [
      {
        q: "What is the relationship between cohesion and coupling?",
        a: "Cohesion is how well the parts inside one class belong together. Coupling is how much classes depend on each other. We want high cohesion and low coupling. They usually go together: when related code sits in one place, other classes need to reach into it less often.",
      },
      {
        q: "How do you spot low cohesion in a class?",
        a: "I look for methods that do not use the class's own fields. I also look for a vague name like Utils or Manager. Another sign is that the class changes for many unrelated reasons. For example, a Utils class with send_email, parse_date, and compute_tax has low cohesion.",
      },
      {
        q: "How does the Single Responsibility Principle relate to high cohesion?",
        a: "The Single Responsibility Principle says a class should have only one reason to change. If a class follows it, all its parts serve one purpose, so it has high cohesion. You can think of SRP as one practical way to get high cohesion.",
      },
      {
        q: "Can you give an example of a highly cohesive class?",
        a: "A ParkingSpot class with is_free, fits, park, and vacate. Every method is about whether this one spot is taken. All of them use the same field, the vehicle that is parked there. Nothing unrelated, like sending emails, is mixed in.",
      },
      {
        q: "How would you fix a class with low cohesion?",
        a: "I group its methods by the data and idea they work on. Then I split each group into its own class with a clear name. For example, a big OrderManager could become Order, PaymentService, and InvoiceSender. Each new class now has one clear job.",
      },
    ],
    related: ["low-coupling", "single-responsibility", "encapsulation", "class-design"],
    example: {
      language: "python",
      code: `# Low cohesion: unrelated responsibilities in one bag
# class Utils: send_email(), parse_date(), compute_tax(), resize_image()


# High cohesion: everything here is about a ParkingSpot's occupancy
class ParkingSpot:
    def __init__(self, spot_id: str, size: "SpotSize") -> None:
        self.id = spot_id
        self.size = size
        self._parked: "Vehicle | None" = None

    def is_free(self) -> bool:
        return self._parked is None

    def fits(self, v: "Vehicle") -> bool:
        return self.is_free() and v.size <= self.size

    def park(self, v: "Vehicle") -> None:
        if not self.fits(v):
            raise ValueError("spot unavailable")
        self._parked = v

    def vacate(self) -> None:
        self._parked = None`,
    },
  },
  {
    id: "low-coupling",
    track: "lld",
    category: "principles",
    name: "Low Coupling",
    summary: "Modules depend on each other as little as possible, and only through narrow, stable interfaces.",
    why: "When classes depend heavily on each other, one change forces changes in many places. Low coupling keeps changes small and lets you test each class on its own.",
    whenToUse: [
      "Changing one class forces you to edit many other classes.",
      "Code reaches through long chains of objects, like ticket.spot.floor.rate_card.hourly().",
      "You want to test or deploy parts of the system separately.",
    ],
    howItWorks: [
      "Depend on an interface (a contract that lists methods, like a typing.Protocol), not on a specific class.",
      "Pass helper objects in from outside instead of creating them inside the class.",
      "Follow the Law of Demeter. An object should only talk to the objects it directly holds, not to their inner parts.",
      "Use events or callbacks so the code that sends a message does not need to know who receives it.",
    ],
    pros: [
      "Changes stay in one place, so fewer things break.",
      "Unit tests are easier because you can pass in fake objects.",
      "Parts can be reused in other projects or features.",
    ],
    cons: [
      "Too many layers in between make the code harder to follow.",
      "With events, it is hard to see what happens next just by reading the code.",
      "Some coupling is always needed. Objects must talk to each other, so you cannot remove it fully.",
    ],
    interviewQuestions: [
      {
        q: "What is the Law of Demeter?",
        a: "It says an object should only talk to its direct friends. Those are its own fields, the arguments passed to its method, and objects it creates. It should not dig into a friend's friends. So instead of ticket.spot.floor.rate_card.hourly(), I would ask a pricing object for the fee directly.",
      },
      {
        q: "How do you recognize tight coupling?",
        a: "A small change in one class forces changes in many other classes. Classes create their own dependencies inside them, so you cannot swap them in tests. You also see long chains of calls into other objects. A simple check is: can I unit test this class without a real database or network? If not, it is probably tightly coupled.",
      },
      {
        q: "How does dependency injection reduce coupling?",
        a: "With dependency injection, a class gets its helpers from outside instead of creating them. The class only knows the interface of the helper, not the exact class. So I can pass a real EmailSender in production and a fake one in tests. The class does not need to change at all.",
      },
      {
        q: "Describe the trade-off between low coupling and simplicity.",
        a: "Removing coupling usually means adding interfaces, injected objects, or events. Each one adds a layer, and too many layers make the code hard to follow. So I decouple where things are likely to change or need testing, like payment or notifications. For simple, stable code, a direct call is fine.",
      },
      {
        q: "What is the difference between coupling and cohesion?",
        a: "Coupling is about the links between classes. Cohesion is about how well the parts inside one class fit together. Good design aims for low coupling and high cohesion. For example, a ParkingSpot class that only handles its own parking state, and talks to pricing through one small interface, has both.",
      },
    ],
    related: ["high-cohesion", "dependency-injection", "dependency-inversion", "interface-design"],
    example: {
      language: "python",
      code: `from datetime import datetime, timedelta
from typing import Protocol

# Tight: knows the internals of three classes
# fee = ticket.spot.floor.rate_card.hourly() * hours


# Loose: ask the collaborator, depend on an interface
class PricingPolicy(Protocol):
    def fee_for(self, ticket: "Ticket", parked: timedelta) -> int: ...


class ExitGate:
    def __init__(self, pricing: PricingPolicy) -> None:
        self._pricing = pricing

    def checkout(self, ticket: "Ticket", exit_time: datetime) -> int:
        parked = exit_time - ticket.entry_time
        return self._pricing.fee_for(ticket, parked)`,
    },
  },
  {
    id: "dependency-injection",
    track: "lld",
    category: "principles",
    name: "Dependency Injection (DI)",
    summary: "A technique where an object receives its collaborators from the outside (constructor, setter, or method) rather than creating them itself.",
    why: "It makes a class's dependencies (the other objects it needs) visible and easy to replace. This is the practical way to write code that is easy to test and does not depend on specific classes.",
    whenToUse: [
      "A class creates its own database connection, API client, or clock inside itself.",
      "You need unit tests that use fake or mock objects instead of real ones.",
      "Different environments need different versions, like a real email sender in production and a fake one in tests.",
    ],
    howItWorks: [
      "List the dependencies as constructor (__init__) parameters. Type them with an interface, like a typing.Protocol.",
      "Save them on the object and do not reassign them later.",
      "Create and connect all the objects in one place, called the composition root. This is usually main or app startup code.",
      "In tests, pass in fake objects instead of real ones.",
    ],
    pros: [
      "You can see what a class needs just by looking at its constructor.",
      "Testing becomes very easy.",
      "You can swap implementations per environment without changing the class.",
    ],
    cons: [
      "A constructor with many parameters shows the class may be doing too much. A DI framework can hide this problem.",
      "DI frameworks (tools that create and wire objects for you) add hidden behavior and can fail only at runtime.",
      "Injecting simple data objects, like a Money value, adds noise for no real benefit.",
    ],
    interviewQuestions: [
      {
        q: "Compare constructor, setter, and field injection.",
        a: "Constructor injection passes dependencies into __init__. The object is complete from the start, so this is usually the best choice. Setter injection sets them later through a method or property, which is useful for optional dependencies but the object may be used before it is ready. Field injection means a framework sets attributes directly; it hides dependencies, so I avoid it.",
      },
      {
        q: "How is dependency injection related to the Dependency Inversion Principle?",
        a: "The Dependency Inversion Principle is the goal: high-level code should depend on abstractions, not on concrete classes. Dependency injection is a technique to reach that goal. For example, OrderService depends on a PaymentGateway protocol, and we inject a StripeGateway from outside. So DIP is the idea and DI is one way to do it.",
      },
      {
        q: "What is a composition root?",
        a: "It is the one place in the app where all objects are created and connected together. Usually it is main or the app startup code. Everywhere else, classes just receive what they need. This keeps the wiring in one spot and keeps the rest of the code clean.",
      },
      {
        q: "Is a Service Locator the same as dependency injection?",
        a: "No. With a Service Locator, a class asks a global registry for its dependencies, like registry.get(\"db\"). The dependencies are hidden inside the code, so you cannot see them from the constructor. With DI, dependencies are passed in, so they are visible and easy to replace in tests.",
      },
      {
        q: "How does dependency injection help with testing?",
        a: "Because the class does not create its own dependencies, a test can pass in fake ones. For example, a TokenService takes a clock function. In a test I pass a clock that always returns the same time. Now the expiry check gives the same result every run, with no waiting.",
      },
    ],
    related: ["dependency-inversion", "low-coupling", "dependency", "abstraction"],
    example: {
      language: "python",
      code: `from datetime import datetime, timedelta, timezone
from typing import Callable

Clock = Callable[[], datetime]


class TokenService:
    # Dependencies injected via the constructor
    def __init__(self, clock: Clock, ttl: timedelta) -> None:
        self._clock = clock
        self._ttl = ttl

    def is_expired(self, issued_at: datetime) -> bool:
        return self._clock() > issued_at + self._ttl


# Composition root
prod = TokenService(lambda: datetime.now(timezone.utc), timedelta(hours=1))

# Test: fixed clock, deterministic result
fixed = datetime(2024, 1, 1, 2, tzinfo=timezone.utc)
test = TokenService(lambda: fixed, timedelta(hours=1))`,
    },
  },

  // ───────────────────────────── UML & Class Design ─────────────────────────────
  {
    id: "uml-class-diagrams",
    track: "lld",
    category: "uml-design",
    name: "UML Class Diagrams",
    summary: "A static diagram showing classes, their attributes and methods, and the relationships between them (inheritance, realization, association, aggregation, composition, dependency).",
    why: "A class diagram shows a design quickly and clearly. It is often the first thing you produce in an LLD interview.",
    whenToUse: [
      "At the start of an LLD interview, right after you have clarified the requirements.",
      "When you review a design with teammates before writing code.",
      "When you want to record how classes are related and how many of each there are.",
    ],
    howItWorks: [
      "Draw each class as a box with three parts: the name, the attributes, and the methods. Mark visibility with + for public, - for private, and # for protected.",
      "Label interfaces and abstract classes (classes that cannot be created directly, like an abc.ABC) so they stand out.",
      "Use a solid line with a hollow triangle for inheritance (Car is a Vehicle). Use a dashed line with a hollow triangle for realization (a class implements an interface).",
      "Use a filled diamond for composition (the part dies with the whole). Use a hollow diamond for aggregation (the part can live on its own). Use a plain line for association and a dashed arrow for dependency (one class only uses another briefly).",
      "Write multiplicity (how many objects are linked) on the lines, like 1, 0..1, 1..*, or *.",
    ],
    pros: [
      "Everyone understands the same standard symbols.",
      "It shows too much coupling (classes depending heavily on each other) and missing abstractions early.",
      "It is quick to draw and easy to change.",
    ],
    cons: [
      "If you keep it as long-term documentation, it can drift away from the real code.",
      "Too much detail makes the diagram cluttered and hard to read.",
      "It only shows structure, not what happens over time. Use a sequence diagram for that.",
    ],
    interviewQuestions: [
      {
        q: "Draw the arrows for inheritance, realization, composition, and aggregation.",
        a: "Inheritance is a solid line with a hollow triangle pointing to the parent, like Car to Vehicle. Realization is a dashed line with a hollow triangle pointing to the interface. Composition is a solid line with a filled diamond at the owner's end, like ParkingLot owns Floors. Aggregation is the same but with a hollow diamond, like a Team that has Players who can exist without the team.",
      },
      {
        q: "How do you show multiplicity between a ParkingLot and its Floors?",
        a: "I draw a composition line with a filled diamond on the ParkingLot side. I write 1 next to ParkingLot and 1..* next to Floor. That reads as: one parking lot has one or more floors. Each floor belongs to exactly one parking lot.",
      },
      {
        q: "How much detail should a class diagram have in a 45-minute interview?",
        a: "Only the main classes, their key attributes and methods, and the relationships between them. I skip getters, setters, and small helper classes. The goal is to show the structure clearly in about 10 minutes. I can add detail later if the interviewer asks.",
      },
      {
        q: "What is the difference between composition and aggregation in UML?",
        a: "Both mean one object contains others. In composition, shown by a filled diamond, the parts cannot live without the whole. If a House is deleted, its Rooms go too. In aggregation, shown by a hollow diamond, the parts can exist on their own, like Players who stay when a Team is deleted.",
      },
      {
        q: "What is the difference between a class diagram and a sequence diagram?",
        a: "A class diagram shows the static structure: which classes exist and how they are related. A sequence diagram shows what happens over time: which object calls which method, in what order. For a parking lot, the class diagram shows ParkingLot, Floor, and Spot. The sequence diagram shows the steps when a car enters and gets a ticket.",
      },
    ],
    related: ["class-design", "composition", "aggregation", "association", "interface-design"],
    example: {
      language: "python",
      code: `# UML (text form) for a parking lot:
#   ParkingLot  <>------ 1..*  Floor          (composition, filled diamond)
#   Floor       <>------ 1..*  ParkingSpot    (composition)
#   ParkingSpot ------- 0..1   Vehicle        (association)
#   Car --|> Vehicle                          (inheritance)
#   HourlyPricing ..|> PricingPolicy          (realization)
from abc import ABC, abstractmethod


class Vehicle(ABC):
    def __init__(self, plate: str) -> None:
        self.plate = plate


class Car(Vehicle): ...


class PricingPolicy(ABC):
    @abstractmethod
    def fee(self, ticket: "Ticket") -> int: ...


class HourlyPricing(PricingPolicy):
    def fee(self, ticket: "Ticket") -> int:
        return 0


class ParkingSpot:
    def __init__(self) -> None:
        self.parked: Vehicle | None = None


class Floor:
    def __init__(self) -> None:
        self.spots: list[ParkingSpot] = []


class ParkingLot:
    def __init__(self) -> None:
        self.floors: list[Floor] = []`,
    },
  },
  {
    id: "class-design",
    track: "lld",
    category: "uml-design",
    name: "Class Design",
    summary: "The process of identifying entities, their responsibilities, state, and collaborations, then shaping them into clean classes.",
    why: "Where you draw the lines between classes decides how easy the system is to extend and test. This is the main skill LLD interviews check.",
    whenToUse: [
      "Turning written requirements into a code structure.",
      "Breaking a god class (one huge class that does everything) into smaller classes that work together.",
      "Deciding if something should be an entity, a value object, or a service class.",
    ],
    howItWorks: [
      "Pick out the nouns in the requirements as possible classes, and the verbs as possible methods. For a library: Book, Member, Loan; borrow, return.",
      "Give each job to the class that holds the data needed for it.",
      "Separate three kinds of classes. An entity has its own identity, like a Book with an ISBN. A value object is unchangeable and compared by value, like Money. A service holds no state and coordinates other objects, like LoanService.",
      "Decide how classes are related and how many of each there are. Keep each class's public methods few.",
      "Check the design by walking through the main use cases step by step, like a member borrowing a book.",
    ],
    pros: [
      "Requirements map clearly to code.",
      "You can add features without rewriting existing code.",
      "It is clear which class owns which job and which data.",
    ],
    cons: [
      "Turning every noun into a class can give you useless classes, or classes with data but no behavior.",
      "Too many classes slow you down and confuse the interviewer.",
      "Early class boundaries may need changing when requirements change.",
    ],
    interviewQuestions: [
      {
        q: "Walk through how you would find the classes for a library management system.",
        a: "First I clarify the requirements, like borrowing, returning, and late fees. Then I pick out the nouns: Book, Member, Loan, Library, Fine. The verbs become methods: borrow, return_book, calculate_fine. I give each method to the class that owns the data, then walk through a borrow and a return to check it works.",
      },
      {
        q: "What is an anemic domain model, and why is it criticized?",
        a: "It is a design where classes only hold data, with no real behavior. All the logic lives in separate service classes. This is criticized because the data and its rules are split apart, so any code can put an object into a bad state. For example, Book should have its own checkout method that stops it being borrowed twice.",
      },
      {
        q: "When should a class be immutable?",
        a: "When it represents a value rather than something with an identity, like Money, a date range, or a coordinate. Immutable objects cannot change after creation, so they are safe to share and easy to reason about. They also work safely across threads. In Python I would use a dataclass with frozen=True.",
      },
      {
        q: "Entity vs value object: how do you decide?",
        a: "Ask whether identity matters. An entity is tracked by an ID and changes over time, like a bank Account or a Book with an ISBN. A value object is defined only by its values, like Money with 10 dollars. Two 10 dollar Money objects are equal and interchangeable, but two accounts with the same balance are still different accounts.",
      },
      {
        q: "What is a god class and how do you fix it?",
        a: "A god class is one huge class that knows and does too much, like a ParkingLotManager that handles spots, payments, tickets, and display boards. It is hard to read, test, and change. I fix it by grouping its methods by the data they use. Then I move each group into its own class, like ParkingSpot, Ticket, and PaymentService.",
      },
    ],
    related: ["uml-class-diagrams", "encapsulation", "high-cohesion", "single-responsibility", "interface-design"],
    example: {
      language: "python",
      code: `from dataclasses import dataclass


# Value object: immutable, equality by value
@dataclass(frozen=True)
class Money:
    cents: int
    currency: str

    def plus(self, other: "Money") -> "Money":
        if self.currency != other.currency:
            raise ValueError("currency mismatch")
        return Money(self.cents + other.cents, self.currency)


# Entity: has identity and lifecycle, owns its rules
class Book:
    def __init__(self, isbn: str) -> None:
        self.isbn = isbn
        self._on_loan = False

    def checkout(self) -> None:
        if self._on_loan:
            raise ValueError("already on loan")
        self._on_loan = True


# Service: stateless coordination across entities
class LoanService:
    def lend(self, book: Book, member: "Member") -> None:
        book.checkout()
        member.add_loan(book)`,
    },
  },
  {
    id: "interface-design",
    track: "lld",
    category: "uml-design",
    name: "Interface Design",
    summary: "Defining small, intention-revealing contracts that describe what a component does, independent of how it does it.",
    why: "Good interfaces are the points where you can swap one part for another. This makes testing easier and lets teams work on different parts at the same time.",
    whenToUse: [
      "There are, or will clearly be, more than one implementation, like card and UPI payments.",
      "You are drawing a line between business logic and infrastructure (databases, external APIs, email services).",
      "You are sharing a module with other teams or other parts of the code.",
    ],
    howItWorks: [
      "Name the interface after the role it plays. PaymentProcessor is good. PaymentHelper is vague.",
      "Keep the methods few and closely related. Follow the Interface Segregation Principle: do not force classes to have methods they do not need.",
      "Use your own domain types (classes from your problem, like Money or PaymentRequest) in method signatures, not plain strings or a vendor's classes.",
      "Write down the contract: what the input must be, what the result means, and what errors can happen.",
    ],
    pros: [
      "It allows polymorphism (different classes used the same way) and dependency inversion (depending on abstractions, not specific classes).",
      "Mocking and testing become simple.",
      "A stable contract means the code that uses it rarely has to change.",
    ],
    cons: [
      "An interface with only one implementation may just be extra code with no benefit.",
      "If implementation details leak into method signatures, callers become tied to that implementation.",
      "Changing an interface that many places use is expensive.",
    ],
    interviewQuestions: [
      {
        q: "Design the interface for a pluggable payment processor.",
        a: "I would make a PaymentProcessor protocol with two methods: charge(request) and refund(payment_id, amount). The request is a small dataclass with order_id, amount as Money, and an idempotency key so a retry does not charge twice. charge returns a clear result, Approved or Declined, instead of a magic value. Each provider, like CardProcessor, implements it and hides its vendor SDK inside.",
      },
      {
        q: "abc.ABC vs typing.Protocol: when do you pick each?",
        a: "abc.ABC needs explicit inheritance, and Python refuses to create a subclass object that has not implemented the abstract methods. It also lets me share common code in the base class. typing.Protocol uses structural typing: any class with the right methods fits, with no inheritance needed, and a type checker like mypy checks it. I pick Protocol for light contracts or third-party classes, and ABC when I want shared code or a runtime check.",
      },
      {
        q: "What changes when an ABC has normal methods with code next to the abstract ones?",
        a: "Subclasses get that shared code for free and only implement the abstract parts. This is useful, for example a base Notifier could have a send_all method that calls the abstract send for each user. But now subclasses depend on the base class's code. If that code changes, every subclass can be affected, so it is more coupling than a pure contract.",
      },
      {
        q: "What makes a good interface?",
        a: "It is small and focused on one role. It has a clear name, like NotificationSender. It uses domain types like Money instead of raw floats, and it does not show how it works inside. Its behavior and errors are clearly defined, so any implementation can be swapped in.",
      },
      {
        q: "Should every class have an interface?",
        a: "No. If there is only one implementation and no real need to swap it or fake it in tests, an interface just adds extra code. I add one when there are several implementations, or at a boundary like a database or an external API. In Python a Protocol can be added later without changing the existing class.",
      },
    ],
    related: ["interface-segregation", "abstraction", "dependency-inversion", "polymorphism"],
    example: {
      language: "python",
      code: `from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class PaymentRequest:
    order_id: str
    amount: "Money"
    idempotency_key: str


# Explicit outcomes instead of exceptions or magic values
@dataclass(frozen=True)
class Approved:
    payment_id: str


@dataclass(frozen=True)
class Declined:
    reason: str


PaymentResult = Approved | Declined


# Role-named, minimal, uses domain types
class PaymentProcessor(Protocol):
    def charge(self, request: PaymentRequest) -> PaymentResult: ...
    def refund(self, payment_id: str, amount: "Money") -> "RefundResult": ...


# Implementations hide vendor SDKs behind the contract
class CardProcessor:
    def charge(self, request: PaymentRequest) -> PaymentResult:
        return Approved("p1")        # vendor call

    def refund(self, payment_id: str, amount: "Money") -> "RefundResult": ...`,
    },
  },
  {
    id: "composition-over-inheritance",
    track: "lld",
    category: "uml-design",
    name: "Composition over Inheritance",
    summary: "Prefer building behavior by combining objects (has-a) over extending classes (is-a), reserving inheritance for true, stable subtyping.",
    why: "With inheritance, the number of subclasses can explode, and subclasses get tied to their parent. With composition, each behavior can change on its own, even while the program is running.",
    whenToUse: [
      "Behaviors change in several independent ways, like how a duck flies and how it quacks.",
      "You see too many subclasses with combined names, like FlyingSwimmingRobotDuck.",
      "An object's behavior must change while the program runs.",
      "You want to reuse the same code in classes that are not related to each other.",
    ],
    howItWorks: [
      "Find the behaviors that change independently, like flying and quacking.",
      "Turn each behavior into a small interface with small classes that implement it, like FlyWithWings and NoFly.",
      "Let the main class hold these behavior objects as attributes. A Duck has a fly behavior and a quack behavior.",
      "The main class passes the work to them, for example perform_fly calls self.fly_behavior.fly(). You can pass them in or swap them at any time.",
    ],
    pros: [
      "No deep, fragile class trees.",
      "Mix and match behaviors without writing new subclasses.",
      "Behavior can change at runtime, and testing is easier.",
      "It is the base of the Strategy, Decorator, and State design patterns.",
    ],
    cons: [
      "More small objects, and more code that just passes calls along.",
      "It is harder to see everything one object does in a single place.",
      "Too much for a simple, stable is-a relationship, like Car is a Vehicle.",
    ],
    interviewQuestions: [
      {
        q: "Why is composition often preferred over inheritance?",
        a: "Inheritance ties a subclass tightly to its parent, so a change in the parent can break every child. It also leads to many subclasses when behaviors combine. With composition, a class holds small behavior objects and passes work to them. I can mix behaviors freely and even swap them at runtime.",
      },
      {
        q: "Refactor a Duck class tree with flying and non-flying ducks using composition.",
        a: "I create a FlyBehavior protocol with a fly method, and classes FlyWithWings and NoFly. I do the same for quacking, with Quack and Squeak. Duck takes a fly behavior and a quack behavior in its constructor and calls them. A rubber duck is just Duck(NoFly(), Squeak()), with no new subclass needed.",
      },
      {
        q: "When is inheritance still the better choice?",
        a: "When there is a true, stable is-a relationship and the child can be used anywhere the parent is expected. For example, SavingsAccount is an Account and follows all its rules. It is also fine for shallow hierarchies, like subclassing an abc.ABC to fill in abstract methods. If the tree stays one or two levels deep and rarely changes, inheritance is simpler.",
      },
      {
        q: "Which design patterns rely on composition?",
        a: "Strategy holds a swappable algorithm object, like different pricing rules for a parking lot. Decorator wraps an object to add behavior, like adding logging around a notifier. State holds a state object that changes, like an order moving from Placed to Shipped. Adapter and Composite also use composition.",
      },
      {
        q: "What is the difference between is-a and has-a?",
        a: "Is-a means inheritance: a Car is a Vehicle, so Car extends Vehicle. Has-a means composition: a Car has an Engine, so Car holds an Engine object. A quick test is to say the sentence out loud. If is-a sounds wrong or might change later, use has-a.",
      },
    ],
    related: ["composition", "inheritance", "liskov-substitution", "polymorphism", "low-coupling"],
    example: {
      language: "python",
      code: `from typing import Protocol

# Instead of RubberDuck, WoodenDuck, RobotFlyingDuck subclasses...


class FlyBehavior(Protocol):
    def fly(self) -> str: ...


class QuackBehavior(Protocol):
    def quack(self) -> str: ...


class FlyWithWings:
    def fly(self) -> str:
        return "flap"


class NoFly:
    def fly(self) -> str:
        return "..."


class Squeak:
    def quack(self) -> str:
        return "squeak"


class Duck:
    def __init__(self, fly: FlyBehavior, quack: QuackBehavior) -> None:
        self.fly_behavior = fly              # can change at runtime
        self._quack = quack

    def perform_fly(self) -> str:
        return self.fly_behavior.fly()       # delegate

    def perform_quack(self) -> str:
        return self._quack.quack()


rubber = Duck(NoFly(), Squeak())`,
    },
  },
];
