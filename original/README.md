# Lines - Original Java Implementation

This is the original Java implementation of the Lines game.

## Building

To build the project, run:

```bash
mvn clean compile
```

## Running

To run the game, use:

```bash
mvn exec:java -Dexec.mainClass="eu.janschupke.lines.Lines"
```

Or build a JAR and run it:

```bash
mvn package
java -jar target/lines-1.0.jar
```

## Development

This is a Maven project using Java 21. The main class is `eu.janschupke.lines.Lines`.

## Resources

- Graphics and resources are in `src/main/resources/`
- Development resources (launch4j config, etc.) are in `devres/` 