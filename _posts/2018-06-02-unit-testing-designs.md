---
layout: post
title:  "How Unit Testing Can Help Write Better Designs"
author: theo
tags:
- testing
team: ios
---



## Definition of unit testing
> Unit testing is a software testing method by which **individual units of source code**, sets of one or more computer program modules together with associated control data, usage procedures, and operating procedures, **are tested to determine whether they are fit for use**.¹

## Why would I test individual units of source code?

When I started to write unit tests, I remember wondering: why should I only test individual units of code at a time? Wouldn’t it be more efficient to test several components all together, and see if it works at a macro level? There is no straight answer to these questions, but from my experience, I would say; mostly no.

To get more insights about this, it’s important to remember that testing is mostly useful to prevent regressions. When a new feature is introduced, or a part of the codebase is being refactored, unit tests are there to ensure the program still works as expected. Determining if a program works is no easy task. Too often, unit tests are not accurate and reveal false negatives or worst, false positives. They can also be too sensitive and stop compiling because of trivial changes in the codebase. Or they can all turn red because of one buggy component. I worked on a project where the tests were broken so often that developers even stopped looking at them. All these problems mostly come from one single mistake developers usually do when writing unit tests; they forget to test one isolated unit of code at a time. It may seem simple, but it’s not, and that’s what I’d like to demonstrate in this article.

## What should I unit test?

The primary concern is to figure out what needs to be unit tested. In my opinion, the most interesting part to test in an application is its **business logic**.

For example, testing the views or the lifecycle of a controller is possible, but these are visual and can be tested with integration, UI tests or even manually, so it’s not very useful. Business logic however is harder to test manually because many non related factors could disrupt the test. For example, some factors could be a bad connection, a partially downed server, or a non related UI bug could prevent the test from completing.

Also, because business logic represents the purpose of an application, making sure it won’t break in the future is a good precaution.

## How can I bring unit tests into my project?

### Refactoring, refactoring, refactoring…

In short, refactoring is the key. Most of the time, when a project starts suffering from regressions, developers think that starting to write unit tests will solve their issues. It’s not entirely true and even though it could help, it’s most likely not enough. Unit tests are only efficient if the codebase is written in a certain way. To get to that point, rework the code until unit testing is made straightforward is essential.

Although a [test driven development approach (TDD)](https://en.wikipedia.org/wiki/Test-driven_development) might be preferable for a brand new project, most of the time, developers are working on legacy codebases, which is why I prefer to describe how to rework a project which already exists.

### (1) — Identify where the business logic code is, and what it does.

The business logic of a project is often spread all over the place, making it hard to identify. I like to think that business logic is **every bit of code that doesn’t directly depend on the project’s technical stack**. A good example is the presentation of a view. Let’s say that tapping a button presents a view. In that scenario, the code deciding which view to present is part of the business logic. This piece of code doesn’t care what technology is used to show the view. It could be on iOS, Android, or in a Web Application, it doesn’t matter, the code does the same thing either way.

Also very important, identify which interfaces the business logic should expose based on what it does. This will be a great help to **understand and unit test the interactions between each pieces of business logic**.

### (2) — Isolate the business logic.

A common mistake is to try to test the business logic in its technical environment. As said above, even though it could work, it would not be only testing the business logic, it would also be testing the project’s technical stack. At the end of the day, **a good unit test should only care about what the code is doing, not how it’s running**.

To isolate a piece of code, it’s most of the time convenient to **encapsulate it into an object with a name based on its responsibly**. Having difficulties when naming these types of objects often means that responsibilities are not clear enough. Maybe it does too much, or maybe it’s not being used properly in the application, making its implementation obsolete. In any case, naming should be kind of obvious, and if it’s not, figuring out why rather than naming it poorly is always better.

### (3) — Make assumptions on the abstractions, not the technical stack.

I like to think that **unit testing is about making the right assumptions**. It’s about protecting software against future regressions, and doing so requires making assumptions on how the code will look like in the future.

It’s quite hard to know what the technical stack of a project will look like few years, or even only few months from now. It’s constantly changing for unpredictable reasons. For example, it could need to follow the product’s needs to run faster, scale better or meet users’ new expectations. **To think that a project will use the same technologies forever is a huge mistake. It will move on, so it’s up to us, as developers, to not write code that depends too much on its current state.**

On the other hand, **a good abstraction doesn’t evolve that much**. For example, the audio player interface has pretty much not changed since its creation. Nowadays, everybody knows how to use an audio player and that’s because they all work the same way. Why that? Because manufacturers all use the same pattern (abstraction); play, pause, stop, etc.. For an audio player application, it would make sense to write the business logic based on this well known abstraction since it’s most likely not going to change soon. It would make the code able to switch between different audio player libraries without changing any of the application’s business logic, and thus without rewriting any unit test. This is why **betting on a good abstraction is always less risky than betting on a technology**, even if it’s the most trendy at the moment.

Though, too often, developers try to reinvent the wheel when it comes to abstractions. **Integrating a bad abstraction in a project can harm the codebase more badly than you could imagine**. Not only it can make it technically less flexible, but it can also make developers less polyvalent. Imagine working on a project with obscure abstractions for every concept? Each developer in the team would probably have a tendency to specialize in only one part of the application. The knowledges would be harder to transfer, and thus, the project would loose traction. Also, since abstractions are often exposed between multiple layers of the application, they spread fast over the codebase, making them hard to eradicate later. My advice would be; don’t got too fast! **Take the time to look for the right abstraction, try to use known design patterns as much as possible and think simple**.

### (4) — Inject abstract dependencies into the business logic.

Once the business logic has a panel of beautiful abstractions to use, the matter is to inject them properly in a way that allows the unit tests to observe how they are being used.

Rather than instantiating a dependency and use it directly, it’s better to get it as an input from the call site. For example, to test an object, its abstract dependencies can be passed down through its initializer, or via a setter. For a function, they can be passed down as parameters. Doing so makes it very easy to inject fake implementations of the abstractions, and observe how they are being used in the tests.

A known downside of this technique is its tendency to make initializers and function prototypes too long. Firstly, if that’s the case, the question to ask is; isn’t the code too complex? Maybe it can be broken down in several pieces which could be unit tested separately. Let’s be careful when doing this, though, creating poor abstractions for this purpose is probably not worth it. There’s a pattern which solves this problem; the dependency container. It allows to group all the needed dependencies in one place. Same thing here, making a *god *dependency container shared through the entire project is most likely not a good idea either.

### (5) — Unit test the business logic.

At that point, the business logic code is identified, it exposes clear interfaces and is entirely decoupled from the technical stack of the project. In other words, it’s ready to use in a testing environment.

To write unit tests, I always try to respect these rules:

* Tests must run **fast.**

* Tests must be **isolated** from each other.

* Tests must be **repeatable**.

* Tests must be **self-verifying**.

These are four of the five [**FIRST properties](https://pragprog.com/magazines/2012-01/unit-tests-are-first)** of unit tests. If you’re not familiar with them, I strongly recommend giving it a look.

This might seem tough, but don’t worry, if the code has been refactored by following the first four steps of this process, it shouldn’t be that bad.

## How does this help write better designs?

Well, the process I just described implies to **rewrite several parts of an application**. Some developers and product owners might see that as a problem since it’s taking time, and doesn’t create direct value. It’s true, but **it’s a very good problem to have and solving it helps in a lot of ways**. And that’s the trick, the value it creates is actually tremendous, but indirect.

Let’s review each steps and their potential benefits on a project:

1. Identify where the business logic code is, and what it does — this helps to **identify what are the responsibilities of each piece of code and what interface it implements**. This makes me think of [the interface segregation principle of SOLID](https://en.wikipedia.org/wiki/Interface_segregation_principle).

1. Isolate the business logic — this implies to create **new objects with single responsibilities**, following [the single responsibility principle of SOLID](https://en.wikipedia.org/wiki/Single_responsibility_principle).

1. Make assumptions on the abstractions, not the technical stack — this implies to identify and **use good abstractions so the technical stack can evolve without any business logic nor unit tests changes needed**. This makes me think of [the open/closed principle of SOLID](https://en.wikipedia.org/wiki/Open/closed_principle).

1. Inject abstract dependencies into the business logic — this makes me think of [the dependency inversion of SOLID](https://en.wikipedia.org/wiki/Dependency_inversion_principle).

1. Unit test the business logic — well, this was the whole point, writing unit tests to prevent future regressions that could harm your company’s business.

At the end of this unit testing journey, the business logic code naturally follows almost all the [SOLID](https://en.wikipedia.org/wiki/SOLID_(object-oriented_design)) principles.

Even better, the most valuable part of the codebase (business logic) is secured against many regressions. Even though a bug can still happen, it is now very easy to write a test to reproduce it and then fix the code, ensuring it it won’t happen again. Also, **implementing new features can now be done using more fun methodologies, like [test driven development (TDD)](https://en.wikipedia.org/wiki/Test-driven_development)**.

But most of all, the developers writing or maintaining these beautifully isolated and unit tested bits of code are usually more confident and proud of their work..

## How am I supposed to believe this without an example?

Ok I get it, all the above is great, but it’s only the theory. Let’s demonstrate how these five steps can help with an example.

**Initial code
**The following code is what I called a MovieManager. It does several things, like fetching movies, caching them, deserialzing them, etc..

![[View on Gist](https://gist.github.com/trupin/145ec11a40e3f814399c8c802e225f51)](https://cdn-images-1.medium.com/max/4760/1*G-0urjANNlutYATOHvRDJg.png)*[View on Gist](https://gist.github.com/trupin/145ec11a40e3f814399c8c802e225f51)*

### (1) — Identify where the business logic code is, and what it does.

What lines of code in the above are implementing the business logic? Remember, the goal is to** identify bits of code which don’t depend on the technical stack** of the project. I can identify three elements of the technical stack;* Core Data*, the *HTTP *protocol and the *JSON* format.

Knowing that, it’s easier to identify what really matters here:

1. The paths — ”/movies/popular” and ”/movies/\(movieID)”.

1. The caching logic — createOrUpdateIfExists(in:) and if let storedMovie = storedMovies.first { … }.

1. The results of typeMovie,[Movie] or MovieManagerError.

### (2) — Isolate the business logic.

The following protocol is the interface exposed to other components. It describes what MovieManager is able to do. It also encapsulates the business logic we just identified in the first step.

![[View on Gist](https://gist.github.com/trupin/51fa324385c9435860a70387d54c9e65)](https://cdn-images-1.medium.com/max/4736/1*jss_arY0p6xtzrUNTNAWlg.png)*[View on Gist](https://gist.github.com/trupin/51fa324385c9435860a70387d54c9e65)*

### (3) — Make assumptions on the abstractions, not the technical stack.

Let’s abstract the technical components used by the MovieManager.

* Core Data is able to set and retrieve a value for its key. Its abstraction could look like this:

![[View on Gist](https://gist.github.com/trupin/643f034bea0edeba9d29f5ab2b5dc142)](https://cdn-images-1.medium.com/max/4996/1*b7NIewaAff-c66xreJjhfA.png)*[View on Gist](https://gist.github.com/trupin/643f034bea0edeba9d29f5ab2b5dc142)*

* HTTPClient is able to perform an http request and retrieve a response from a server. Its abstraction could look like this:

![[View on Gist](https://gist.github.com/trupin/ecce9a3e4077c1e666fe9410972104de)](https://cdn-images-1.medium.com/max/3912/1*7vy2RKJwWXKjV7PD2Ei1Ig.png)*[View on Gist](https://gist.github.com/trupin/ecce9a3e4077c1e666fe9410972104de)*

* How could I improve ClientProtocol to make it abstract the *JSON* parsing as well?

![[View on Gist](https://gist.github.com/trupin/1c68332458e313f33639ea1f6a746b64)](https://cdn-images-1.medium.com/max/4300/1*heaLxmfmBm6gA6fD1rN0lA.png)*[View on Gist](https://gist.github.com/trupin/1c68332458e313f33639ea1f6a746b64)*

* The generic Model can be used by the client to determinate how to parse it. For example I could take advantage of Decodable and extend ClientProtocol like so:

![[View on Gist](https://gist.github.com/trupin/31304d5b568d0ee3b0a81983c2334654)](https://cdn-images-1.medium.com/max/5392/1*wXMqLX8HBoMJf8u8FTsijw.png)*[View on Gist](https://gist.github.com/trupin/31304d5b568d0ee3b0a81983c2334654)*

### (4) — Inject abstract dependencies into the business logic.

Rather than instanciating and using dependencies directly, let’s inject them.

**Refactored code**

![[View on Gist](https://gist.github.com/trupin/92b3e7b6c3b1a52a848dd7fcb58bf03c)](https://cdn-images-1.medium.com/max/4828/1*yVzQNHY_6lZG17aajDGmvQ.png)*[View on Gist](https://gist.github.com/trupin/92b3e7b6c3b1a52a848dd7fcb58bf03c)*

Note how MovieManager now takes a ClientProtocol and a KeyValueStoring at initialization and hold them privately.

Also note how error handling is respecting domains. Because each abstraction has one responsibility, it’s pretty easy to wrap errors and pass them down or write a recovery strategy.

### (5) — Unit test the business logic.

That’s it, testing this manager should be an easy task. Let’s show how easy it can be, even without using any testing frameworks like Mockito or OCMocks.

But first, let’s take a quick look at the necessary tools for this task. In order to run the MovieManager and observe what it’s doing, I will need a series of [Test Doubles](https://en.wikipedia.org/wiki/Test_double). A Test Double is a very simplistic implementation of an abstraction able to fake its behavior, observe how it’s being used, setup expectations, etc..

In this example, I will use the two following doubles:
-** Stub **— Real implementation initialized with fake arbitrary (but valid) values. Mainly used for data structures.
- **Spy **— Lightweight implementation of an abstraction which records how its interface is being used. Its records are used to assert after the tested code executed.

Note that a spy is not to confuse with a mock. A mock has internal expectations and thus, is responsible of failing the unit test when they are not met. On the contrary, a spy only records, and expectations are written in the unit test implementation itself, making it the only responsible for reporting a failure. That’s actually why I prefer to use spies most of the time. I think it makes unit tests easier to read and maintain.

The following shows how the spies for theKeyValueStore and the Client would look like.

![[View on Gist](https://gist.github.com/trupin/9e304958670581c4064129bc4302654d)](https://cdn-images-1.medium.com/max/5088/1*ItoG6YcMFplhrEH5LFNgJw.png)*[View on Gist](https://gist.github.com/trupin/9e304958670581c4064129bc4302654d)*

The implementation is kept as simple as possible. Actually, the lighter a double is, the less chances it has to introduce false negatives/positives. Also, from my experience, the above implementation is good enough, most of the time.

Finally, with the tools I described above, this is how the unit tests can be written:

![[View on Gist](https://gist.github.com/trupin/b272531e437acd919aa27f446db0bd99)](https://cdn-images-1.medium.com/max/5132/1*CQDpR71ZCxfxwh4EFSXs2Q.png)*[View on Gist](https://gist.github.com/trupin/b272531e437acd919aa27f446db0bd99)*

## Further Reading

All along the article, I talked about a bunch of programming principles and terms you can read more about in the following articles:

* [Mocks Aren’t Stubs](https://www.martinfowler.com/articles/mocksArentStubs.html).

* [IOC container solves a problem you might have but its a nice problem to have](http://kozmic.net/2012/10/23/ioc-container-solves-a-problem-you-might-not-have-but-its-a-nice-problem-to-have/).

* [Unit Tests are FIRST](https://pragprog.com/magazines/2012-01/unit-tests-are-first).

Also, you might want to checkout this article I wrote about Weaver, a dependency injection framework I created: [Weaver: A Painless Dependency Injection Framework For Swift](https://medium.com/scribd-data-science-engineering/weaver-a-painless-dependency-injection-framework-for-swift-7c4afad5ef6a).

That’s it, you’ve made it! Thanks for reading. I hope you enjoyed this journey and that you’ll be able to reuse these information productively for your projects.

Cheers!

**If you want to work on changing how the world reads, come join us! [www.scribd.com/careers](https://www.scribd.com/careers)**

### References

1. (Kolawa, Adam; Huizinga, Dorota (2007). [*Automated Defect Prevention: Best Practices in Software Management](http://www.wiley.com/WileyCDA/WileyTitle/productCd-0470042125.html)*. Wiley-IEEE Computer Society Press. p. 75. [ISBN](https://en.wikipedia.org/wiki/International_Standard_Book_Number) [0–470–04212–5](https://en.wikipedia.org/wiki/Special:BookSources/0-470-04212-5).)
