---
layout: post
title: "Android Audio player tutorial with Armadillo"
tags:
- android
- kotlin
- audio player
author: NathanSass
team: Android
---

![Armadillo Image](https://i.ibb.co/LzTK79B/armadillo.jpg)

In this tutorial, we are going to explore how to build an audio player in an Android app using Armadillo. We are going to do that by discussing what goes into designing an effective audio player as well as some best practices for handling audio in an app.

## What is Armadillo?

Armadillo is the fully featured audio player library Scribd uses to play and download all of its audiobooks and podcasts. It specializes in playing HLS or mp3 content that is broken down into chapters or tracks. It leverages Google’s Exoplayer library for its audio engine. Exoplayer wraps a variety of low level audio and video apis but has few opinions of its own for actually using audio in an Android app. The leap required from Exoplayer to audio player is enormous both in terms of the amount of code needed as well as the amount of domain knowledge required about complex audio related subjects. Armadillo provides a turn-key solution for powering an audio player and providing the information to update a UI.

- **Easy-to-use** because it outputs state updates with everything needed for a UI or analytics. Works in the background state.
- **Effective** because it uses Google’s Exoplayer as the playback engine.
- **Ready-to-go** out of the box usage for a developer looking to use an audio player.
- **Robust** because it contains numerous configuration options for supporting most any requirement and includes a number of other android apis
required for a high quality audio player.

## What does it include?
- Support for HLS and mp3 audio
- Exoplayer for downloading and playback
- MediaBrowserService so the app can be played in the background, browsed by other apps, and integrated with Android Auto.
- MediaSession to support commands from media controllers, ex. a bluetooth headset.

## Installation:

The library is hosted with Github packages so you will need to add the Github registry with authentication to your build.gradle file. See the official docs on authenticating here. But you will need to:
Step 1: Generate a personal access token from your Github account.
Step 2: Add the Github package registry with authentication to your build.gradle file.

```kotlin
maven {
   name = "GitHubPackages"
   url = uri("https://maven.pkg.github.com/scribd/armadillo-and")
   credentials {
       username = "github_username"
       password = "github_access_token"
   }
}
```

## Getting Started:

It is as easy as adding this code snippet to your Activity / Fragment to play your first piece of content.

```kotlin
// construct your media
val media = AudioPlayable(
    id = 0,
    title = "Google Hosted Mp3",
    request = AudioPlayable.MediaRequest.createHttpUri("https://storage.googleapis.com/exoplayer-test-media-0/play.mp3"),
    chapters = emptyList()
)

// initialize the player
val armadilloPlayer = ArmadilloPlayerFactory.init()

// begin playback
armadilloPlayer.beginPlayback(media)

// listen for state updates
armadilloPlayer.armadilloStateObservable.subscribe {

    // update your UI here

}
```

That’s all you need to get started!

## Next Steps:

For a more complex example, please see the TestApp included in the library. If you have any problems, don’t be afraid to open up an issue in the repository.

<sub><sup>Icon made by [Freepik](https://www.flaticon.com/authors/freepik) from [www.flaticon.com](http://www.flaticon.com/) <sub><sup>
