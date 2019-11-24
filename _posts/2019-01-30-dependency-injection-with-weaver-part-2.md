---
layout: post
title:  "Dependency injection tutorial with Weaver on iOS (part 2)"
author: theo
tags:
- swift
- weaver
team: iOS
---


In this post, you’re about to explore how [Weaver](https://github.com/scribd/Weaver) gets handy when **writing unit tests**. In [the first part](https://medium.com/scribd-data-science-engineering/weaver-tutorial-for-ios-part-1-78265548dd00) of this tutorial, we created a [sample project](https://github.com/trupin/WeaverTutorial) to show how to inject and provide dependencies, write custom builders and use Weaver with ObjC. In this part, we will write unit tests for this same sample project.

I am not going to cover what unit testing actually is, but if you feel like you should know more about it, I encourage you to read [this post](https://medium.com/scribd-data-science-engineering/how-unit-testing-can-help-write-better-designs-c290d1c46776) I wrote on the topic.

## 1. Setup the project

To setup the project, run the following command in a terminal.

    $ git clone git@github.com:trupin/WeaverTutorial.git
    $ cd WeaverTutorial
    $ open Sample.xcodeproj

Once done, you should be able to see the target Sample in the project navigator.

![](https://cdn-images-1.medium.com/max/2000/1*2q84IoVmYLabJjyhEcQSPg.png)

Click on the + button you can see on the screenshot above to create a target.

![](https://cdn-images-1.medium.com/max/2920/1*ygE6soC8yjOyV69a79ZJsw.png)

Select iOS Unit Testing Bundle as shown above and click on Next. Then click on Finish to complete the process.

You should now be able to see a new SampleTests directory in the project navigator.

![](https://cdn-images-1.medium.com/max/2000/1*xifBjlz-G-rG5Oeh94EpeQ.png)

You’re good to go, let’s write some tests!

## 2. Infrastructure

Before jumping into the code, let’s analyze the protocols Weaver generates.

![[Weaver.ImageManager.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/Generated/Weaver.ImageManager.swift)](https://cdn-images-1.medium.com/max/2992/1*l_iEEJq1aAVD2NTujcHFxw.png)*[Weaver.ImageManager.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/Generated/Weaver.ImageManager.swift)*

This code is the ImageManager’s container for which URLSession is the only dependency. Therefore, if we wanted to test ImageManager, we would have to pass in a fake URLSession instance in order to observe how it’s being used.

Weaver generated two protocols;ImageManagerInputDependencyResolver and ImageManagerDependencyResolver. The first one gives access to external dependencies, those which are provided by other containers, and the second one gives access to all the dependencies (internal and external). Actually, as you can see in the code below, ImageManagerDependencyResolver is the protocol which is used to initialize ImageManager.

![[MovieManager.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/MovieManager.swift)](https://cdn-images-1.medium.com/max/2640/1*gxTGc6gLBdmuJBsmI8CW3Q.png)*[MovieManager.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/MovieManager.swift)*

This protocol comes in handy because it gives us the possibility to implement a fake container and init MovieManager with it. This way, no matter how many dependencies we need to fake for testability, we can fake all of them the same way.

## 3. Test Doubles

Unit testing usually requires the use of test doubles, but what is it?

**A Test Double is a very simplistic implementation of an abstraction able to fake its behavior, observe how it’s being used, setup expectations, etc..**

In this example, I will use the two following doubles:
-** Stub **— Real implementation initialized with fake arbitrary (but valid) values. Mainly used for data structures.
- **Spy **— Lightweight implementation of an abstraction which records how its interface is being used. Its records are used to assert after the tested code executed.

Note that a spy is not to confuse with a mock. A mock has internal expectations and thus, is responsible of failing the unit test when they are not met. On the contrary a spy only records and expectations are written in the unit test implementation itself, making it the only responsible for reporting a failure. That’s actually why I prefer to use spies most of the time. I think it makes unit tests easier to read and maintain.

## 4. Write your test doubles

With that said, what doubles would we actually need to test MovieManager? One to fake ImageManagerDependencyResolver and one to fake URLSession.

One issue is that URLSession doesn’t have a protocol, so let’s write our own.

![[URLSessionProtocol.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/URLSessionProtocol.swift)](https://cdn-images-1.medium.com/max/4096/1*A4syzjjhp0yaKyn5yRn6dg.png)*[URLSessionProtocol.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/URLSessionProtocol.swift)*

And of course, in order to use this protocol correctly, we need to inject it with Weaver.

To do so, let’s update some of our annotations:

* In AppDelegate.swift : replace // weaver: urlSession = URLSession with // weaver: urlSession = URLSession <- URLSessionProtocol.

* In ImageManager, MovieManager, and ReviewManager: replace // weaver: urlSession <- URLSession with // weaver: urlSession <- URLSessionProtocol.

At that point, the project should compile correctly, and you’ll notice that the generated code for ImageManager slightly changed.

![[Weaver.ImageManager.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/Generated/Weaver.ImageManager.swift)](https://cdn-images-1.medium.com/max/2992/1*5APK5uiMJtt2oapeB1H5cg.png)*[Weaver.ImageManager.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/Sample/Generated/Weaver.ImageManager.swift)*

As you can see in the code above, Weaver used URLSessionProtocol instead of URLSession to declare the resolver’s protocol.

Now that we have an URLSessionProtocol up and running, everything’s ready to write a spy for it.

![[URLSessionSpy.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/SampleTests/URLSessionSpy.swift)](https://cdn-images-1.medium.com/max/4096/1*ikXy24zXhjRYeEw-vxJG3w.png)*[URLSessionSpy.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/SampleTests/URLSessionSpy.swift)*

This spy basically only records the urls which are passed to dataTask(with:completionHandler:) and completes with whatever you stored in resultStubs.

Finally, let’s write ImageManagerDependencyResolverSpy.

![[ImageManagerDependencyResolverSpy.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/SampleTests/ImageManagerDependencyResolverSpy.swift)](https://cdn-images-1.medium.com/max/3056/1*oNmDkdhOoEyZmIb2qyUGtQ.png)*[ImageManagerDependencyResolverSpy.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/SampleTests/ImageManagerDependencyResolverSpy.swift)*

Note that these spies are added to the SampleTests target rather than the main one. Needless to say that you don’t want to ship these doubles ever.

This might feel a lot to write but believe me, it is worth it. In large projects, when all the common classes have their respective protocols and test doubles, unit testing becomes so easy that I sometimes catch myself building entire features without running the app once. A dream!

## 5. Write your unit tests

It’s finally time to write the tests.

Note how the following code, thanks to the ImageManagerDependencyResolverSpy we wrote, is mostly about testing behaviors, rather than setting up dependencies.

![[ImageManagerTests.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/SampleTests/ImageManagerTests.swift)](https://cdn-images-1.medium.com/max/4096/1*44zhsO4qY_JHuSvmDbStNQ.png)*[ImageManagerTests.swift on Github](https://github.com/trupin/WeaverTutorial/blob/master/SampleTests/ImageManagerTests.swift)*

## Conclusion

In this post, you saw how you can adapt your codebase and Weaver annotations to write unit tests intuitively.

The next and last episode of this series will be about how Weaver can adapt to a multi targets project.

Thanks for reading.

Happy testing!

**If you want to work on changing how the world reads, come join us! [www.scribd.com/careers](https://www.scribd.com/careers)**
