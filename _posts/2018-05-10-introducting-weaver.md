---
layout: post
title:  "Weaver: A Painless Dependency Injection Framework for Swift"
author: theo
tags:
- swift
- weaver
- dependency injection
team: iOS
---

A few months ago, I started developing a framework named [Weaver](https://github.com/scribd/Weaver) with one idea in mind; improve how we do Dependency Injection in our iOS application at [Scribd](https://www.scribd.com).

**[Dependency Injection](https://en.wikipedia.org/wiki/Dependency_injection)** basically means **“giving an object its instance variables”** ¹. *It seems like it’s not such a big deal, but as soon as a project gets bigger, it gets tricky. Initializers become too complex, passing down dependencies through several layers becomes time consuming and just figuring out where to get a dependency from can be hard enough to give up and finally use a singleton.

However, **Dependency Injection is a fundamental aspect of software architecture, and there is no good reason not to do it properly**. In this article, I’ll discuss how Weaver makes it easy.

## What is Weaver?

![](https://cdn-images-1.medium.com/max/2000/1*H6AKytS1L0DD2prmvtTrSA.jpeg)

In short, **Weaver is a lightweight Dependency Injection framework that is able to generate the necessary boilerplate code to inject dependencies into Swift types, based on annotations.**

For example, the annotation // weaver: movieManager <- MovieManaging in the code below makes Weaver generate the protocol MoviesViewControllerDependencyResolver with a computed property movieManager so it can be used out of the box in the class implementation.

<script src="https://gist.github.com/trupin/c9f72645c001c754f759fadacb3edc37.js"></script>

*Note: Of course, Weaver also generates the mechanic abstracted by this protocol but I won’t explain it here. For more information, I suggest cheking the project on [Github](https://github.com/scribd/Weaver).*

Weaver doesn’t stop here. Its command line tool also **analyzes the dependency graph of a project and outputs a nice Xcode error saying what’s wrong at compile time**.

Pretty exciting right? Well I hope you are excited because I’m about to tell you how good Weaver could be for your next project, so stay with me.

## Dependency Injection Containers.

![](https://cdn-images-1.medium.com/max/2000/1*C0Dhdr0pkAs1ioFDRtfOFw.jpeg)
*[Photo: James Martin/CNET](https://www.cnet.com/pictures/amazons-automated-attendants-pictures/4/)*

A Dependency Injection Container (or DI Container) is basically **an object able to instantiate, retain, and resolve other objects’ dependencies** for them.

In the example shown above, MoviesViewControllerDependencyResolver is a protocol, exposing only the generatedMoviesViewController’s DI Container’s resolution capabilities.

Weaver includes a very lightweight DI Container library with the same kind of features as [Swinject](http://github swinject). The boilerplate code that Weaver generates is actually based on this library.

### Why is using Dependency Injection Containers helpful?

* It allows N dependencies to be injected into an object by adding only one parameter to its initializer.

* It can resolve dependencies on N layers and apply different instantiation logic based on the context.

* With the right interfaces, setting up unit tests becomes much more efficient.

* It’s a great way to achieve the [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) principle, making the code more modular.

## The downsides of Dependency Injection Containers. In other words, how Weaver’s got your back.

![](https://cdn-images-1.medium.com/max/2000/1*zEW7Dr2ktR-0ONg3J0DMuQ.png)

DI Containers also have several considerable disadvantages. I’ll describe below the ones I think are the most important, and how Weaver helps facing them.

### (1) — Dependency Injection Containers can crash at runtime.

When injecting dependencies manually, if a type mismatches or one is missing, the code won’t compile. **With DI Containers, since the dependencies are resolved at runtime, these errors happen at runtime as well**. For example, a missing dependency registration in the AppDelegate of an application could make another object crash while trying to access to this same dependency later on.

Swinject does not really solve this issue. It considers all dependencies as optional which spreads optionality over the project for dependencies that could be non optional, leading to confusing interfaces. That’s how it pushes developers to implicitly unwrap the dependencies, exposing the code to runtime crashes.

**Weaver has a better approach. It ensures the dependency graph is correct at compile time, allowing dependencies to be declared as non-optional.**

### (2) — Unit tests need to setup their own Dependency Injection Containers, which makes them less stable and harder to maintain.

When it comes to unit testing, a fake Dependency Injection Container is needed to inject into the object to be tested. **Writing a container for production and testing is tedious, error prone and makes the unit tests less stable and less maintainable**.

Weaver generates a Resolver protocol implemented by each generated DI container. This protocol only exposes dependencies that the container can resolve. Not only does this **make it obvious what the dependencies of an object are, but it also allows the creation of a fake resolver that can be injected when unit testing**. As soon as a new dependency is added to the resolver protocol, the tests, which are supposed to fake the dependency, won’t compile anymore. This makes the tests easier to maintain because instead of crashing at runtime due to a DI Container malfunction, it would give an error at complie time. It also means that unit tests don’t depend on Weaver at all, which is a non-negligible additional advantage.

### (3) — Dependency Injection Containers are hard to learn.

I think developers who are new to DI Containers or Dependency Injection in general, will find it hard to learn for several reasons.

First of all, Dependency Injection and [Inversion of Control](https://en.wikipedia.org/wiki/Inversion_of_control) are all about using the right interfaces at the right places. This is a fundamental skill useful for many aspects of software architecture. So **yes, writing good abstractions is hard, but it’s hard even without the use of DI Containers**. I’d even say that Dependency Injection and DI Containers push developers to write abstractions, which is good practice.

From my experience, **the real difficulty when dealing with DI Containers, is getting to know what dependencies are available where**. Most of the time this is not documented, and for a large project, getting an exhaustive list of the dependencies available for an object can get tricky.

Since Weaver requires developers to declare dependencies through annotations, this problem is naturally solved. In doing this, **reading the code becomes sufficient to know what dependencies are available for an object**, making it all easier to maintain.

## This is only the start.

![[Source](https://salemnet.vo.llnwd.net/media/cms/CW/faith/34624-start-startover-startingline.1200w.tn.jpg)](https://cdn-images-1.medium.com/max/2400/1*YUgV-gA2IIUR9EJfimMpLw.jpeg)*[Source](https://salemnet.vo.llnwd.net/media/cms/CW/faith/34624-start-startover-startingline.1200w.tn.jpg)*

**Coupled with other great tools like [SwiftGen](https://github.com/SwiftGen/SwiftGen) or [Sourcery](https://github.com/krzysztofzablocki/Sourcery/tree/master/Sourcery), Weaver could help provide a robust structure for iOS/macOS projects of any size**.

Still, this is not all. I plan on doing more and I hope a community of developers will help down the road. For example, I could use the dependency graph to **help detect code smells, pinpoint errors more accurately or export the data to a visual graph format like [D3.js](https://d3js.org)**. Weaver could also **help to query the list of dependencies an object needs to work properly**. I’m sure plenty of other improvements and features will be considered, which I’m pretty excited about.

If you’d like to try Weaver, please check it out on [Github](https://github.com/scribd/Weaver) and feel free to send me your suggestions for improvement. I also wrote a [sample project](https://github.com/scribd/Weaver/tree/master/Sample) to demonstrate how it works, which is worth checking out.

Thanks for reading,

Cheers!

### References

1. [Dependency Injection Demystified, James Shore, 03/22/2006](http://www.jamesshore.com/Blog/Dependency-Injection-Demystified.html)
