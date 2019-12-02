---
layout: post
title:  "LiveCollections Part 4: A Table of Carousels"
author: stephane
tags:
- swift
- live-collections
- lc-series
team: iOS
---

This is a specific enough case that I felt it warranted its own section. If you’ve ever used a content driven app, like say for example Scribd, where you make a selection from a wide variety of exciting and personalized categories, then you’ve probably interacted with this structure before.

![A table of carousels in Scribd](https://cdn-images-1.medium.com/max/4096/1*D8rNkYJFZxZ9f-5cRJ446Q.png)*A table of carousels in Scribd*

As mentioned, in Scribd, each category you see in the app is a row in a UITableView, whereas the horizontal carousel is a UICollectionView. This results in situation that sounds similar to scenarios 3 and 4, but adds some complexity.

The main difference is that we are applying animations to two different types of view objects that need to coordinate. Part of trick of this arrangement is that we don’t want to enact the UITableView reload actions. Even if you pass in animationStyle = .none, the cell can still flicker. Worse, reloading a cell causes a dequeue action, so say goodbye to any nice UICollectionView action as you rebuild the cell. Another consideration is that we want to make sure that the underlying table view waits for all colleciton view animations to complete before considering its own animation complete.

### Scenario 7: A Table of Carousels

The main problem we need to solve in this scenario is that we have one UITableView and N UICollectionViews and we need them to animate in a coordinated manner. That is, we want to be able to animate insertions, deletions, and moves, on the table view rows, but for any reload, we don’t want the table view to handle it, but to trigger the collection view animation instead.

To achieve this, we start by creating a new data srtuct that that looks like this:

    struct CarouselRow: Equatable {
      let identifier: String
      let movies: [Movie]
    }

    extension CarouselRow: UniquelyIdentifiable {
      typealias RawType = CarouselRow
      var uniqueID: String { return identifier } 
      var hashValue: Int {
        return movies.reduce(identifier.hashValue) { $0 ^ $1.hashValue }
      }
    }

Since we aren’t using multiple sections, our CarouselRow struct only needs to conform to UniquelyIdentifiable and we can update the table view with CollectionData<CarouselRow>. Notice too that it contains the array [Movie] which *also *conforms to UniquelyIdentifiable. This will get passed to a sub-controller that will control the UICollectionView and will hold its own data with CollectionData<Movie>.

### So, how do we coordinate all of this?

The challenge is to have our main controller holding the UITableVIew update each of the sub-controllers at the right time, but how?

This will be handled in two key ways:

1. All data updates for both the table view and collection views will first pass through the main table view controller via CollectionData<CarouselRow> and collectionData.update(carouselRows).

1. The main table view controller will adopt the delegate CollectionDataManualReloadDelegate, which will give it the timing hooks it needs to update the sub-controllers.

![Fg. 9: Multiple data sources will coordinate together to handle the animation timing](https://cdn-images-1.medium.com/max/2188/1*hqQn-UVer-WrKyX-4Ot_BQ.png)*Fg. 9: Multiple data sources will coordinate together to handle the animation timing*

Here are the two relevant functions that we’ll use in CollectionDataManualReloadDelegate:

    func willHandleReload(at indexPath: IndexPath) -> Bool
    func reloadItems(at indexPaths: [IndexPath], indexPathCompletion: @escaping (IndexPath) -> Void)

The first method informs the table view that the delegate intends to take care of the reload for an indexPath, and it is removed from the animation batch.

The second method tells us when it’s safe to carry out the reload for each indexPath. Here’s an example:

    func willHandleReload(at indexPathPair: IndexPathPair) -> Bool {
      return true // handle all reloads
    }

    func reloadItems(at indexPaths: [IndexPath], indexPathCompletion: @escaping (IndexPath) -> Void)) {
      indexPaths.forEach { indexPath in
        let data = collectionData[indexPath.item]
        let dataSource = carouselDataSource(for: data.identifier)
        let itemCompletion = { indexPathCompletion(indexPath) }
        dataSource.update(with: data.movies, completion: itemCompletion)
      }
    }

As you’ll see, we simply fetch the data at the correct index and pass it to the sub-controller dataSource, and for each indexPath sent to us, we will trigger the completion block once.
> **Note:** It’s extremely important that you trigger the completion bock *for each *indexPath sent to the function. If you don’t then the table view animation will be waiting indefinitely.

Additionally, since CollectionData keeps all operations ordered and thread safe, even if we have already passed another update to it before the previous animation has completed, we can still request the data directly from the CollectionData object, and it will be in sync with the animation.

**But wait, you completely skipped over the fact that UITableViewCells are dequeable…**

A very astute observation on your part. Kudos.

One additional complexity in all of this is that since we are animating UICollectionViews inside of a cell that is dequeueable, we risk edge case scenarios where we point different data sources at UICollectionViews mid animation, as a result we can have a view from the reuse pool still pointing at a data source, or have two CollectionData objects temporarily pointing at the same view.

Yeah, that doesn’t sound good, these are all serious problems.

To handle these cases, it will require a combination of adopting one additional delegate protocol and applying some defensive code in the right places. Let’s take a look.

By adopting the protocol CollectionDataReusableViewVerificationDelegate (vague and mysterious) you can inform the animating view whether or not it still points to a valid data source. The code looks like this:

    collectionData.validationDelegate = self

    ...

    func isDataSourceValid(for view: DeltaUpdatableView) -> Bool {
      guard let collectionView = view as? UICollectionView,
          collectionView.delegate === self,
          collectionView.dataSource === self else {
            return false
          }

      return true
    }

Secondly, we need to guard any index based lookup in our data to prevent out of bounds errors. This can occur if a table view is in the reuse pool but is still attempting to complete its animation. We don’t need that view to do anything sensible, we just need to prevent it from tiggering any error inducing code.

Any of your UICollectionViewDataSource/Delegate methods that result in an index lookup like let movie = collectionData[indexPath.item] need to be guarded.

You can do something as simple as this:

    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
      
    let cell = collectionView.dequeueReusableCell(withReuseIdentifier: MovieCollectionViewCell.reuseIdentifier, for: indexPath)  

      guard collectionView === collectionData.view else { return cell }

      ...
    }

    func collectionView(_ collectionView: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {

      guard collectionView === collectionData.view else { return}

      ...
    }

One last thing, with that code in place, you don’t even need to manage the prepareForResue function in the UITableViewCell that holds the UICollectionView, but what you need to do is to hook up the CollectionData object and the data source to the UICollectionView in the dequeued cell.

You can write a convenience function like so in your sub-controller:

    func registerCollectionView(_ collectionView: UICollectionView) {   
      collectionView.delegate = self
      collectionView.dataSource = self
      collectionView.register(MovieCollectionViewCell.self, forCellWithReuseIdentifier: MovieCollectionViewCell.reuseIdentifier)

      collectionData.validationDelegate = self
      collectionData.view = collectionView
    }

Then you can call this method when you dequeue your UITableViewCell.

This scenario ended up being a fair bit more complex, but when you step back and look at it, it actually ends up being a very small amount of code to support a fairly complex feature.

**Scenario 8: A Sectioned Table of Carousels (carousels can move between sections)**

Ok, so what if we want to take the concept from above, collection views in table view rows and have them be able to move between sections like in Scenario 6?

Well, this actually ends up just being a hybrid between scenario 6 and scenario 7. The only significant change here is to take the row data struct from the previous example, CarouselRow, and to wrap it in a section struct which we’ll call CarouselSection.

Here’s what this updated data struct looks like:

    struct CarouselSection: Equatable {
      let sectionIdentifier: String
      let carousels: [CarouselRow]
    }

    extension CarouselSection: UniquelyIdentifiableSection {
      var uniqueID: String { return sectionIdentifier } 
      var items: [CarouselRow] { return carousels }
      var hashValue: Int { return carousels.reduce(uniqueID.hashValue) { $0 ^ $1.hashValue } 
      }
    }

Everything else works pretty much exactly the same as you would expect and your animations should just work (knock on wood).

![Fg. 10: The main change here is the data structure we use for the table view](https://cdn-images-1.medium.com/max/2188/1*k-6H0R7G45l20VH2Uyn04Q.png)*Fg. 10: The main change here is the data structure we use for the table view*

### An Additional Note on CollectionDataManualReloadDelegate

While we’re using this delegate above to give us a hook to trigger our UICollectionView animations, it’s important to note that we could use this hook to perform *any* animation.

When we return **true** for an indexPath in willHandleReload, we are then handed that indexPath again in reloadItems. The accompanying completion block indexPathCompletion keeps any custom animations we perform in sync with the enclosing animation from the table/collection view and makes sure no successive updates on that view start until these index path animations are complete.

**What does this mean for me?**

This means that you can replace any table or collection view cell reload with a custom animation and ensure that it is safely timed with your enclosing animation. Simply fetch the existing cell from your view and expose an update function that includes an animation completion block. Here’s an example:

    let itemCompletion = { indexPathCompletion(indexPath) }

    guard let cell = collectionView.cellForItem(at: indexPath) 
                                                as? MyCellType else {
        itemCompletion()
        return // (or continue)
    }

    let data = collectionData[indexPath.item]
    cell.update(newData, animated: true, completion: itemCompletion)

Then perform the animation directly on your cell. This can change a brief flash in a cell into a nice, clean transition of state.

### Up Next

[Part 5: Data Factories and Advanced Features](https://medium.com/scribd-data-science-engineering/livecollections-part-5-data-factories-non-unique-data-and-advanced-features-166b76f82f79)

### Revisit

[Part 1: Get Animated with LiveCollections for iOS](https://medium.com/p/59ea1eda2b2d)

[Part 2: Single Section Views](https://medium.com/p/812436b004ea)

[Part 3: Multi-Section Views](https://medium.com/p/6525369decd2)

**If you want to work on changing how the world reads, come join us! [www.scribd.com/careers](https://www.scribd.com/careers)**

### Resources

[Download from Scribd’s GitHub repo](https://github.com/scribd/LiveCollections/)

![](https://cdn-images-1.medium.com/max/2000/1*hTHcvNhtABq_lMD0dVYQAA.png)
