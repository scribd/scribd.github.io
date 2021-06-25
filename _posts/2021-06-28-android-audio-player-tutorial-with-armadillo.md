---
layout: post
title: "Armadillo makes audio players in Android easy"
tags:
- android
- kotlin
- armadillo
- featured
author: nathans
team: Android
---

Armadillo is the fully featured audio player library Scribd uses to play and
download all of its audiobooks and podcasts, which is [now open
source](https://github.com/scribd/armadillo). It specializes in playing HLS
or MP3 content that is broken down into chapters or tracks. It leverages
[Google’s Exoplayer](https://github.com/google/ExoPlayer/) library for its audio engine. Exoplayer wraps a variety of
low level audio and video apis but has few opinions of its own for actually
using audio in an Android app.

![Armadillo Image](https://i.ibb.co/LzTK79B/armadillo.jpg)
<sup>Icon made by [Freepik](https://www.flaticon.com/authors/freepik) from [www.flaticon.com](http://www.flaticon.com/) <sub>

The leap required from Exoplayer to audio player
is enormous both in terms of the amount of code needed as well as the amount of
domain knowledge required about complex audio related subjects. Armadillo
provides a turn-key solution for powering an audio player and providing the
information to update a UI.

- **Easy-to-use** because it outputs state updates with everything needed for a UI or analytics. Works in the background state.
- **Effective** because it uses Google’s Exoplayer as the playback engine.
- **Ready-to-go** out of the box usage for a developer looking to use an audio player.
- **Robust** because it contains numerous configuration options for supporting most any requirement and includes a number of other android apis
required for a high quality audio player.

## What does it include?

- Support for HLS and MP3 audio
- Exoplayer for downloading and playback
- [MediaBrowserService](https://developer.android.com/reference/android/service/media/MediaBrowserService) so the app can be played in the background, browsed by other apps, and integrated with Android Auto.
- [MediaSession](https://developer.android.com/reference/android/media/session/MediaSession) to support commands from media controllers, ex. a bluetooth headset.

## Getting Started:

The library is hosted with Github packages so you will need to add the Github registry with authentication to your build.gradle file. See the official docs on authenticating here. But you will need to:

1. Generate a personal access token from your Github account.
1. Add the Github package registry with authentication to your `build.gradle` file.

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

For a more complex example, please see the [TestApp](https://github.com/scribd/armadillo/tree/main/TestApp) included in the library. If
you have any problems, don’t be afraid to open up an issue [on
GitHub](https://github.com/scribd/armadillo).

