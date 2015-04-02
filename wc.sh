#! /usr/bin/bash

DIR=src/main/java/eu/janschupke/lines
TESTDIR=src/test/java/eu/janschupke/lines

wc -l\
 $DIR/*.java\
 $DIR/actions/*.java\
 $DIR/config/*.java\
 $DIR/file/*.java\
 $DIR/gui/*.java\
 $DIR/gui/dialogs/*.java\
 $DIR/gui/menu/*.java\
 $DIR/model/*.java

echo ""

wc -l\
 $TESTDIR/model/*.java
