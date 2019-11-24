---
layout: post
title:  "Get Animated with LiveCollections for iOS"
author: stephane
tags:
- swift
team: iOS
---

A collection of books on Scribd

To get straight to the point, using UITableView and UICollectionView animations is harder than it should be. What should be a nice visual flourish in your app can end in betrayal and crashes. This is pretty much the worst case scenario, and it’s pretty hard to explain to your manager or PM that the latest release is now crashing more because you wanted to make it *prettier*. The ultimate decision is that we roll back the change and replace it with a call to reloadData, replacing animations with a jolt, and that makes me a sad developer.

I’ve made this concession myself more than once, when it would still fail after I thought I had caught the problem, it started to feel too fragile. I found myself becoming demoralized about using these animations. Surely a solution could be found.

### The Solution: Write a Framework!

If you’re like me, then you’d rather spend 10 hours solving the general case of a problem than solving that one specific case in an hour, only to know that someday you’re going to have to tackle that same hour again and again. In this particular case I think the time spent was actually closer to 100 hours, but who’s counting?

Some call getting diverted down that rabbit-hole, procrastination, I call it forward-thinking aversion. As such, **LiveCollections.framework** was born.

### So, What is it exactly?

It’s a tool for iOS developers that takes in an array of data and animates the delta from the previous array in a UITableView, UICollectionView, or even a custom view.

![Fg.1: Animations calculated from immutable data sets](https://cdn-images-1.medium.com/max/2048/1*uqRV_tN_WJtaB1yCijyaaQ.gif)*Fg.1: Animations calculated from immutable data sets*

More importantly, it doesn’t require the system that is serving up the data to give you any hints or even know about the changes in the data, a distinction from NSFetchedResultsController. Instead, LiveCollections takes two fully immutable arrays of data and animates the difference between them, either by calling the view directly, or giving you back a delta struct so that you can control the timing. This both simplifies the code you write and helps decouple how you receive the data versus how you present the data.

It not only manages the view animation for you, but it keeps the entire operation thread safe; so you can throw as many updates from as many different threads as carelessly as you like, and it will result in nice animations rather than an abrupt home screen.
> The open source framework can be [downloaded from the Scribd GitHub account](https://github.com/scribd/LiveCollections/), and is free to use in your personal or professional applications.

### Risk is Removed

As mentioned, one of the most common problems I’ve seen using table or collection view animations is a crash that produces this dread inducing snippet:

    ***** Terminating app due to uncaught exception 'NSInternalInconsistencyException', reason: 'Invalid update: invalid number of items in section 0.  The number of items contained in an existing section after the update (27) must be equal to the number of items contained in that section before the update (30), plus or minus the number of items inserted or deleted from that section (3 inserted, 3 deleted) and plus or minus the number of items moved into or out of that section (0 moved in, 0 moved out).'**

When data changes are small, an insertion here, a deletion there, then calculating the change is generally trivial. However, data is often delivered to us where the changes are unpredictable. It can be returned asynchronously from a server or background process with a wholly different immutable data set that has changed in some unknown way. In this case, calculating a delta from one data set to another is often complex and increases the chance of there being an error. Race conditions exist too, it’s possible to receive an update from another thread or process and accidentally replace the underlying data while an animation is in process. Welcome to crash town.
> Having your app crash when you’re trying to add finishing polish quickly becomes a very poor risk to reward proposition. We often simply concede that it’s not worth the headache.

**LiveCollections takes away all of the risk of using UITableView and UICollectionView animations.** It calculates all of the deltas for you and builds up a matching animation set, and can even pass that directly to the view, queueing up subsequent updates to keep everything synchronized and thread safe.

This is important because…

### Animations Add Value

From a user perspective, animating changes carries with it not only a sense of polish, but actually helps us understand what is happening. When data just changes in a flash, we often miss it and as a result may end up with a sense of disorientation and be unaware of how the data has changed.

Apple knows this value because they’ve built in very powerful animation tools into both UITableView and UICollectionView for us to leverage. LiveCollections aims to make those tools more accessible by filling in the other half of the equation: turning changes in your data set into matching line item animation code.

Also importantly, Apple kept the delta logic consistent between the two views, meaning that we can support both views from the same class.

### How Does It Work?

LiveCollections provides two key classes: CollectionData and CollectionSectionData. Both of them have the same basic API:

    collectionData.update(data)

Calling this one line of code with two consecutive sets of data is all it takes. It both holds the most recent set of data, and handles the transformation from the previous set when updated.

Additionally, the two main classes CollectionData and CollectionSectionData become your thread-safe data source from which you can access your data directly via a few simple accessors like *subscript*, *count*, and *isEmpty*.

To generate a delta, CollectionData takes an updated data set B’ and applies it to the existing data set B to calculate all of the positional changes for you (B∆B’). All *insertions*, *deletions*, *moves*, and *reloads*, are placed into a struct which is then passed to a UITableView or UICollectionView and all of the corresponding animations are performed automatically.

A delta between data sets is based on indices and looks like this:

    IndexDelta(insertions: [0, 6, 7], 
               deletions: [2], 
               reloads: [(9, 10)], 
               moves: [(8, 5), (0, 3)])

*(For calculating equality, it’s important to know both the position in the original data set and the position in the updated data.)*

### Support For Any Data Object

One of the goals for this project was to make a generic class to support any data type. To make your data work with CollectionData, you will extend your custom data class to adopt the protocol UniquelyIdentifiable:

    public protocol UniquelyIdentifiable: Equatable {
      associatedtype RawType
      associatedtype UniqueIDType: Hashable

      var rawData: RawType { get }
      var uniqueID: UniqueIDType { get }
    }

Here’s an example of what adopting it looks like:

    struct Movie: Hashable {
        let id: UInt
        let title: String
    }

    extension Movie: UniquelyIdentifiable {
        typealias RawType = Movie
        var uniqueID: UInt { return id }
    }

For the delta calculations to be able to identify positional changes, individual items are identified by the uniqueID property for insertions, deletions, and moves, while the equatability inheritance is used to determine if a reload is required. (In some cases an item may have both moved and require a reload).

In most of the examples we’ll look at RawType will always be set to the same as the adopting class. (i.e. we’ll use your class’ default equatability to determine changes). In a later example I discuss what it means to change this to another type.

Once you have adopted the protocol, setting up your collection data is as simple as let collectionData = CollectionData<YourClass>().
> Note: As the naming implies, every single item in the data set must return a value for uniqueID that is different from every other item in the data set. This absolutely must be true or else the resulting calculations will misidentify changes and create animation deltas that crash your app!

Update: LiveCollections now has support for sets of non-unique data!

You can have your data type adopt the alternate protocol NonUniquelyIdentifiable:

    public protocol NonUniquelyIdentifiable: Equatable {
      associatedtype NonUniqueIDType: Hashable
      var nonUniqueID: NonUniqueIDType { get }
    }

And simply replace the use of CollectionData or CollectionSectionData with typealiased alternates NonUniqueCollectionData and NonUniqueCollectionSectionData. This will be discussed in more detail in a later section.

### Performance

Delta calculations remain highly performant on data sets up to 10,000 items. Above that you will start to see some delay between setting the data and the resulting update. This is all happening on background threads so it won’t lock up your UI, but if very large updates (>10,000 items) happen frequently you may start taxing your user’s battery.

Here is a quick comparison of performance for two devices, an iPhone 5S and an iPhone X. A series of tests were run for two data sets, one using a simple Int and the other using a mock Book struct which has a more complex equality equation (it compares 1 integer var, 3 string vars, and a date field).

    ╔═════════════════╦═════════════╗
    ║ **Data vs Compute** ║   **iPhone    **║**
    **║ **Time (~seconds)** ║  **5s **    **X**   ║
    ╠═════════════════╬══════╦══════╣
    ║ [Int] 1,000     ║ 0.05 ║ 0.01 ║
    ║ [Int] 10,000    ║ 0.18 ║ 0.05 ║
    ║ [Int] 100,000   ║ 1.90 ║ 0.48 ║
    ╠–––––––––––––––––╬––––––╬––––––╣
    ║ [Book] 1,000    ║ 0.05 ║ 0.01 ║
    ║ [Book] 10,000   ║ 0.28 ║ 0.08 ║
    ║ [Book] 100,000  ║ 2.99 ║ 0.90 ║ 
    ╚═════════════════╩══════╩══════╝

Additionally, redundant calculations are not performed. If your view is animating and two rapid updates show up before the animation completes, only the delta between the current data and most recent data is calculated. Any intermediate data sets are ignored.

### Sample Code

At this point, I would encourage you to [download the framework and sample application from GitHub](https://github.com/scribd/LiveCollections/) (no dependencies required) and try out Scenario 1 to see LiveCollections in action.

The sample application also has a working example for every use case scenario detailed. You can jump to say, ScenarioOneViewController.swift, to see how I’ve set up the classes. Most are just a few lines of code, but if there are any specific nuances, I’ll be sure to describe them in their respective section.
> All of the example scenarios in the sample app use the open API provided by The Movie Database ([www.themoviedb.org](http://www.themoviedb.org)). *I’d like to thank everyone there for providing this extremely helpful service.*

### Up Next: Use Cases

There are a number of varying use cases that LiveCollections supports, and for each one there will be both an explanation here and sample code in the app.

For most users, you probably don’t need to read past **Part 2 **of this post, it covers the 80% use case, when all data is in a single section.

However, if you’re using table views and collection views in more complex ways in your app, or if you’d like to see how you can fully leverage LiveCollections, then I encourage you to read to the end.

[Part 2: Single Section Views](https://medium.com/p/812436b004ea)

[Part 3: Multi-Section Views](https://medium.com/@stephane_57022/6525369decd2)

**If you want to work on changing how the world reads, come join us! [www.scribd.com/careers](https://www.scribd.com/careers)**

### Resources

[Download from Scribd’s GitHub repo](https://github.com/scribd/LiveCollections/)

![](https://cdn-images-1.medium.com/max/2000/1*hTHcvNhtABq_lMD0dVYQAA.png)
