# LLD (Low-Level Design)

Part of the [System Design module](system-design.md). Track id: `"lld"`.

## Concepts: 23 in 3 categories (`data/sd/lld-concepts.ts`)

| Category id | Name |
|---|---|
| `oop` | Object-Oriented Programming |
| `principles` | Design Principles (SOLID, DRY, KISS, …) |
| `uml-design` | UML & Class Design |

LLD concepts share the `SDConcept` shape with HLD concepts. They may also include a short code `example` (Java, Python, TypeScript or C++), which is rendered by `components/code-block.tsx`.

## Design patterns: 19 GoF patterns (`data/sd/lld-patterns.ts`)

The 19 patterns, by category:
- **Creational:** Factory Method, Abstract Factory, Builder, Singleton, Prototype.
- **Structural:** Adapter, Decorator, Facade, Proxy, Composite, Bridge.
- **Behavioral:** Strategy, Observer, Command, State, Chain of Responsibility, Template Method, Iterator, Mediator.

Each `LLDPattern` has the following fields:
- `intent`
- `problem`
- `whenToUse` and `whenNotToUse`
- a `uml` spec (`UMLSpec`: classes and relations)
- a real-world `example`
- `advantages` and `disadvantages`
- `code` in Java and Python
- `related` patterns and linked `problems`

The page is `components/sd/sd-pattern-detail.tsx`.

## Problems: 17 (`data/sd/lld-problems.ts`)

The 17 problems:
- parking lot
- elevator system
- ATM
- vending machine
- coffee machine
- chess
- tic-tac-toe
- snake and ladder
- library management
- hotel management
- car rental
- movie ticket booking
- Splitwise
- logger
- notification service
- meeting room scheduler
- ride sharing

Each `LLDProblem` has the following fields:
- `statement`
- `functional` requirements
- `actors`
- hint `entities`
- candidate `patterns`
- `extensions` (follow-ups an interviewer may add)
- linked `concepts`

## LLD problem workspace (`components/sd/lld-workspace.tsx`)

The workspace is saved into `SDEntry.workspace` (`LLDWorkspaceData`; `lldDefaults` seeds it). Its sections (`LLD_SECTIONS`) are:

1. **Requirements:** assumptions and scope, then functional requirements.
2. **Actors and use cases:** a table of actors and their actions.
3. **Classes and interfaces:** names, kinds, attributes and methods.
4. **Relationships:** from, to and kind (inheritance, realization, composition, aggregation, association or dependency).
5. **UML class diagram:** generated from the classes and relationships by `toUML`. It's rendered by `components/sd/uml-diagram.tsx` and its nodes can be dragged.
6. **Design patterns:** attach patterns from the library.
7. **Code:** in Java, C++, Python or TypeScript.
8. **Design review:** a self-check list (`REVIEW_CHECKLIST`) plus "What I'd improve".

## UML renderer (`components/sd/uml-diagram.tsx`)

The renderer is SVG with standard UML arrowheads: a hollow triangle for inheritance and realization, a filled diamond for composition, a hollow diamond for aggregation, and a dashed line for dependency.

The layout comes from `autoLayout`, a simple level-based algorithm. Parallel relations between the same two classes are offset so they don't overlap. Users can drag nodes. The `/system-design/uml` page lists the class diagrams from patterns and problems.
