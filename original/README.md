# Lines - Original Java Implementation

This is the original Java implementation of the Lines game, a puzzle game where players connect colored balls to form lines.

## Package Structure

The project uses the package structure `io.schupke.lines.*` with the following organization:

- **`io.schupke.lines.actions`** - Game action handlers and logic
- **`io.schupke.lines.config`** - Configuration management
- **`io.schupke.lines.file`** - File I/O operations
- **`io.schupke.lines.gui`** - User interface components
  - **`io.schupke.lines.gui.dialogs`** - Dialog windows
  - **`io.schupke.lines.gui.menu`** - Menu components
- **`io.schupke.lines.model`** - Game data models
- **`io.schupke.lines.time`** - Timer and time management

## Building

To build the project, run:

```bash
mvn clean compile
```

## Running

To run the game, use:

```bash
mvn exec:java -Dexec.mainClass="io.schupke.lines.Lines"
```

Or build a JAR and run it:

```bash
mvn package
java -jar target/lines-1.0.jar
```

## Testing

To run the test suite:

```bash
mvn test
```

The project includes comprehensive unit tests for the model classes.

## Development

This is a Maven project using Java 21. The main class is `io.schupke.lines.Lines`.

### Key Components

- **Game Logic**: Core game mechanics in `model/` package
- **GUI**: Swing-based user interface in `gui/` package
- **Configuration**: Settings management in `config/` package
- **File Operations**: Save/load functionality in `file/` package

## Resources

- **Graphics and resources** are in `src/main/resources/`
- **Development resources** (launch4j config, etc.) are in `devres/`
- **Documentation** is generated in `target/docs/`

## Dependencies

- **JUnit 4.6** - For unit testing
- **Java 21** - Runtime and compilation target 
