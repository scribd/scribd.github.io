---
layout: post
title:  'Common Accessibility Pitfalls for Single Page Apps, and How to Avoid Them'
author: gwtrev
tags:
- react
- accessibility
- frontend
team: Web Development
---

[//]: # TODO This snippet needs links which reference other blog posts

> *Preface: Although unrelated to this article, folks at Scribd have already
> shared some wonderful information about accessibility, varying from the
> anatomy of an accessible ebook reader to small code snippets that can vastly
> improve the accessibility of your website with pretty minimal effort. Check
> those out if you’re interested in learning more!*

If you’re a front-end developer in today’s world, you’ve probably used the
various JavaScript tooling available (React, Vue, Webpack, etc) to build a
single page application (SPA). SPAs are easy, fast, and most importantly,
provide a concise way to manage your front-end assets. What’s more, you can
handle your page changing using client-side tools like `react-router-dom`! What
more could you ask for?

Alongside the myriad benefits that come along with SPAs comes one of the most
crucial parts of your site taking the biggest hit: accessibility.

Features that came out-of-the-box with more traditional tech stacks and server
based routing now require special handling, since all or most of the routing
happens client side. Two big issues that are easy to overlook when working with
client-side routing of SPAs include:

1. Managing the focus of each page’s main header (h1 tag); and
1. Providing the correct page title and description between pages (and in general, meta information)

Let’s take a look at some easy ways to handle these issues with React.


## Managing the page header

Let’s paint a picture. When a user with assistive software (in particular, a
screen reader) has arrived at your website, they interact with it like any
other site at first: navigating links and listening to what is available on the
page — including links to other pages.

Then the user selects a link to a different “page” on the site and… uh-oh.
nothing happens! To them, anyway.

To sighted users, clearly the content has changed. But to a user without the
ability to see the content, and without any handling of how that content has
changed, they’re left confused.

What’s worse: suppose the anchor link that navigated to this new page isn’t on
the page anymore. Now focus has moved back to the page <body>. The frustration
grows!

This isn’t an uncommon issue with SPAs. There are fewer page refreshes when you
handle routing purely in the client, and thus fewer changes in context unless
you account for them explicitly.

It’s a jarring user experience, to say the least.

Here’s a simple React component that handles these frustrations for us. Notes
afterward.

What is this little component doing? The important part is what happens with
its state. Here’s a quick overview:

1. When the component mounts, it does a check against a prop called
`lastLocation`. This is provided by a higher order component we’re using called
`withLastLocation`, from the npm package
[react-router-last-location](https://www.npmjs.com/package/react-router-last-location).
The package borrows state from your React Router wrapper to tell us the last
location that was visited by the user.

1. If `lastLocation` is null, nothing happens and the component renders without
side effects. This is the behavior expected from first page load.

1. If `lastLocation` provides an object, we can infer the current page the user
is viewing is not the first page they’ve seen since opening the website. We
then set the `tabIndex` of the header to -1 and focus the header to set the
context for the user. Once the header loses focus, we reset the `tabIndex` back
to `null`.

And that’s it! You can drop this component anywhere — just remember:

1. [WCAG](https://www.w3.org/WAI/standards-guidelines/wcag/) (Web Content
Accessibility Guidelines) recommends you have only one h1 on any given page.
If you include this component twice, whichever component renders last will
command focus, so best to avoid that altogether by only rendering it once.
1. You’ll need `react-router-dom` (4.x.x and greater) for the above
implementation to work, as the package `react-router-last-location` requires it
as a [peerDependency](https://yarnpkg.com/lang/en/docs/dependency-types/).

## Managing the site title and meta description

Similar to the page header, your site title and meta description should update
across pages if the context of the page has sufficiently changed. Assistive
technologies will need to know that the page is different at the highest level
so screen readers can announce it. The perk of this step will be more than
accessibility, though; it’s also great for SEO (when combined with server side
rendering).

For this example, we’ll do another simple React component using
[react-helmet](https://www.npmjs.com/package/react-helmet) to
modify the content of the document head. Again, notes are after.

The component is pretty straightforward, and can be used similar to the
`AccessibleHeader` component above. Drop it anywhere on the page, with `title` and `description`
props defined, and `react-helmet` replaces the existing definitions
in your document head. Similar to your h1, you should only have one of each
title and meta description on each page.

Let’s also look at that `titleTemplate` prop that React Helmet accepts — this is
exactly what it sounds like. It’s a base template that takes a placeholder
option, `%s`, that is added in addition to whatever your new title text happens
to be. If your title was `Shopping Cart`, for example, the end result would be `My
Site | Shopping Cart`. Easy!

As an aside, be aware of titles and descriptions you’ve added to your base
`index.html` (assuming you’re using `html-webpack-plugin`). Sometimes React Helmet
will duplicate one or both of these tags, which isn’t desirable.

---

I hope this was helpful! As discussed, it’s vital to ensure your SPA has proper
handling of context between pages to provide the most valuable information
possible to users visiting with assistive technologies. You’re also improving
the SEO and general user experience of your app by including these changes, so
it’s a win-win all around!

**If you want to work on changing how the world reads, come join us! Learn more
at [scribd.com/careers](https://www.scribd.com/careers)!***
