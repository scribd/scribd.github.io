---
layout: post
title:  "LiveCollections Part 2: Single Section Views"
author: stephane
tags:
- swift
- live-collections
- lc-series
team:
- iOS
- Mobile
---

Ok, let’s dive into actually using this thing.

In the most basic scenario, you really only need to make two decisions:

1. Do I want to associate a view directly?

1. Do I want to seed with data or not?

If you associate a view with your CollectionData object, e.g.collectionData.view = tableView, then it will perform the animation as soon as you set the data. Otherwise it’s left to the developer to call the calculateDelta function directly and then make the animation call themselves by passing in the delta at a later time. Most scenarios shown here will set the view.

If you start with an empty data set, it will animate from the empty state. If you feel this is too visually noisy, then you should initialize the CollectionData object with your starting data set.
> A reminder: The protocol *UniquelyIdentifiable *is literal in its definition. Every item in the data set you want to animate must provide a completely unique ID or else the resulting delta won’t match your data change and the animation will crash! There is an example of setting up the data object Movie [in the first section of this post](https://medium.com/p/59ea1eda2b2d#7b22).

**Scenario 1: A UICollectionView with one section**

A lot of the time, developers don’t really use the sections of a UITableView or UICollectionView, they simply omit the sectionCount data source method and let it default to a count of 1. So, by default the CollectionData class uses section 0 for all of its animations.

![Fg.2: Class diagram for a single section collection view](https://cdn-images-1.medium.com/max/2188/1*0AiKpvIvfvzQX38kniPEyQ.png)*Fg.2: Class diagram for a single section collection view*

In this example, there are only two lines of setup, in the initializer:

    collectionData = CollectionData<YourDataClass>(optionalData)
    collectionData.view = collectionView

To keep all animations thread and timing safe, you need to set up your view’s delegate and dataSource methods to access your data from the CollectionData object directly like so:

    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
      return collectionData.count
    }

You should always access your data from the CollectionData object:

    let movie = collectionData[indexPath.item]

Once set up, animating the view becomes as simple as:

    func someUpdateMethod(_ data: [YourDataClass]) {
      collectionData.update(data)
    }

If you have all of your UICollectionView dataSource methods set up, you can call update a few times and see the animations in action.

**Scenario 2: A UITableView with one section**

Since UITableViews and UICollectionViews use exactly the same delta logic, the deltas calcualted by CollectionData work on both view objects. As a result, the only difference from the previous scenario is setting:

    collectionData.view = tableView

And filling in the appropriate table view delegate and dataSource methods.

That’s it!

![Fg. 3: Not much change here for table views](https://cdn-images-1.medium.com/max/2188/1*MPRbRoKnQI03GUogEqeCiQ.png)*Fg. 3: Not much change here for table views*

### Up Next

[Part 3: Multi-Section Views](https://medium.com/@stephane_57022/6525369decd2)

### Revisit

[Part 1: Get Animated with LiveCollections for iOS](https://medium.com/p/59ea1eda2b2d)

**If you want to work on changing how the world reads, come join us! [www.scribd.com/careers](https://www.scribd.com/careers)**

### Resources

[Download from Scribd’s GitHub repo](https://github.com/scribd/LiveCollections/)

![](https://cdn-images-1.medium.com/max/2000/1*hTHcvNhtABq_lMD0dVYQAA.png)
