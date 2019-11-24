---
layout: post
title:  "LiveCollections Part 3: Multi-Section Views"
author: stephane
tags:
- swift
team: iOS
---

I’m glad you made it this far, because frankly this is where most of the behind the scenes magic happens (and validates hours of mind numbing number crunching).

If you’re in using a view with multiple sections, there are two main uses to consider:

1. Data that can be repeated in multiple sections (but unique in any individual section).

1. Data that is unique across all sections.

For the first use we’re going to continue using CollectionData but with a caveat with the view. This can be seen Scenarios 3 and 4.

For the second use we’re going to take a look at CollectionSectionData. This can be seen Scenarios 5 and 6.

**Scenario 3: A UICollectionView with multiple sections, each section has its own CollectionData**

Often, we use each section of a collection view to display a unique set of data, where each section doesn’t really know or care what the other sections are displaying. In this scenario you can manage each section with its own CollectionData object.

    collectionDataList =
                       [CollectionData<Movie>(optionalData, section: 0),
                        CollectionData<Movie>(optionalData, section: 1),
                        CollectionData<Movie>(optionalData, section: 2)]

These discrete sections can update their data independently from one another or may all update at the same time. CollectionData keeps each action atomic and will perform safely. You can even have one section reload all of its contents at the same a separate sections is performing line item animations.
> It’s very important that each CollectionData object be given a unique section, or you can probably guess the results…

![Fg. 4: Class diagram of a collection view with 3 discrete sections](https://cdn-images-1.medium.com/max/2156/1*d333OS_ack_6encLZ8oPwA.png)*Fg. 4: Class diagram of a collection view with 3 discrete sections*

Now you can update any data source independently and they will animate just their own section of the view.

**Scenario 4: A UITableView with multiple sections, each section has its own CollectionData**

You can point multiple CollectionData objects at a table view in exactly the same way.

![Fg. 5: Class diagram of a collection view with 3 discrete sections](https://cdn-images-1.medium.com/max/2156/1*cLMWcIN5OAw8Zt6z_sVDFg.png)*Fg. 5: Class diagram of a collection view with 3 discrete sections*

A situation I found by using this framework in Scribd is that sometimes a UITableView animates its cells more cleanly when they are part of the same animation batch. Scribd has a view where we show a filter in one cell and a list of filtered items beneath it, all in the same view. When clearing the filter, the filter cell is removed and the cells beneath are adjusted. The resulting animations ended up being a bit jerky. It seemed that the right thing to do would be to make sure both sections animate together.

The solution was to create an object CollectionDataSynchronizer that would cause those sections to batch their animations into the same block. You can synchronize any or all of your CollectionData objects pointing to the same view. When applying your synchronizer to multiple sections, if the data updates in those sections at the same time, or on the same run-loop, they will be batched together.

![Fg. 6: Class diagram of a table view with 3 discrete sections, two will be synchronized](https://cdn-images-1.medium.com/max/2552/1*cbVVSxR2x8K8BC33Vu2FTA.png)*Fg. 6: Class diagram of a table view with 3 discrete sections, two will be synchronized*

The code is as simple as:

    let syncrhonizer = CollectionDataSyncronizer(delay: .short)
    collectionDataList[1].synchronizer = synchronizer
    collectionDataList[2].synchronizer = synchronizer

That’s the only use you’ll have for the synchronizer, after that you can interact with your UICollectionView directly as you would normally. You just need to make sure that they all point to the same synchronizer object.
> It’s not required to use a synchronizer, the animations will work just fine without it. I added it as a tool to give you flexibility to fine tune animations that needed to absolutely be at the same time, or to delay them slightly to give them a bit of room to breathe.

You can alter the delay time if your animation requires any tweaking to get the feel just right. The values are in milliseconds, *none (0)*, *short (10)*, *long (100)*, and *custom(X)*.

![](https://cdn-images-1.medium.com/max/2000/1*hTHcvNhtABq_lMD0dVYQAA.png)

### Scenario 5: A UICollectionView with multiple sections and a singular data source

Unlike scenario 3, this example uses the data class CollectionSectionData instead of CollectionData and instead of having multiple data sources, we will have a singular data source across all sections. Because data items are unique for the entire view, this means that animations can move them across sections.

Whereas before we would be using the data type:

    struct Movie: UniquelyIdentifiable { ... }

Now we will be adopting the protocol:

    public protocol UniquelyIdentifiableSection: UniquelyIdentifiable { 
      associatedtype DataType: UniquelyIdentifiable 
      var items: [DataType] { get }
    }

And create a new data type that looks something like:

    struct MovieSection: Hashable {
      let sectionID: Int
      let movies: [Movie]
    }

    extension MovieSection: UniquelyIdentifiableSection {
      var uniqueID: Int { return sectionID }
      var items: [Movie] { return movies }
    }

When you pass in [MovieSection], it will perform all of the section animations using the uniqueID of MovieSection, and for all row calculations, it will use the uniqueID of Movie. That is to say, a MovieSection can have the same uniqueID as a Movie without causing an error.

In the end, the real change here is just in how we structure the data by wrapping your row data into a section object. We have the same update API:

    func dataDidUpdate(_ data: [MovieSection]) {
      collectionData.update(data)
    }

![Fg. 7: Class diagram of a collection view supporting a flexible number of sections](https://cdn-images-1.medium.com/max/2188/1*-1viUAo1qeaobRQtscyZQw.png)*Fg. 7: Class diagram of a collection view supporting a flexible number of sections*

This makes updating and animating as easy as it was with CollectionData.

The next difference you will notice is thatCollectionSectionData must be given a view at initialization:

    lazy var collectionData: CollectionSectionData<MovieSection> = {
      return CollectionSectionData<MovieSection>(view: tableView)
    }()

There is no option to calculate the delta and perform it after the fact. The reason for this is that these animations occur in two stages and their timing must be tightly coupled with the ordering of the processing queue in the CollectionSectionData object.

Now just set up your dataSource methods like so:

    func numberOfSections(in collectionView: UICollectionView) -> Int 
      return collectionData.sectionCount
    }

    func collectionView(_ collectionView: UICollectionView,  numberOfItemsInSection section: Int) -> Int {
      return collectionData.rowCount(forSection: section)
    }

And you can use the *subscript *accessor to fetch your row data directly:

    let movie = collectionData[indexPath]

**Scenario 6: A UITableView with multiple sections and a singular data source**

Once again, exactly the same as Scenario 6, but this time with UITableViews.

![Fg. 8: Hopefully including this diagram isn’t insulting at this point](https://cdn-images-1.medium.com/max/2188/1*h-rLLMczFUjjKzP0H1d-Sw.png)*Fg. 8: Hopefully including this diagram isn’t insulting at this point*

### Up Next

[Part 4: A Table of Carousels](https://medium.com/scribd-data-science-engineering/livecollections-part-4-a-table-of-carousels-3bf877e78f50)

### Revisit

[Part 1: Get Animated with LiveCollections for iOS](https://medium.com/p/59ea1eda2b2d)

[Part 2: Single Section Views](https://medium.com/p/812436b004ea)

**If you want to work on changing how the world reads, come join us! [www.scribd.com/careers](https://www.scribd.com/careers)**

### Resources

[Download from Scribd’s GitHub repo](https://github.com/scribd/LiveCollections/)

![](https://cdn-images-1.medium.com/max/2000/1*hTHcvNhtABq_lMD0dVYQAA.png)
