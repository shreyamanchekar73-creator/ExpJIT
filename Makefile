CC ?= gcc
CFLAGS ?= -std=c11 -Wall -Wextra -Werror -O2
CPPFLAGS += -Iinclude

.PHONY: all test clean

all: expjit

expjit: src/expjit.o src/main.o
	$(CC) $(CFLAGS) -o $@ $^ -lm

src/expjit.o: src/expjit.c include/expjit.h
	$(CC) $(CFLAGS) $(CPPFLAGS) -c -o $@ src/expjit.c

src/main.o: src/main.c include/expjit.h
	$(CC) $(CFLAGS) $(CPPFLAGS) -c -o $@ src/main.c

tests/test_expjit: tests/test_expjit.c src/expjit.c include/expjit.h
	$(CC) $(CFLAGS) $(CPPFLAGS) -o $@ tests/test_expjit.c src/expjit.c -lm

test: tests/test_expjit
	./tests/test_expjit

clean:
	rm -f expjit src/*.o tests/test_expjit
