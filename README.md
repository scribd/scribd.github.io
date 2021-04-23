# Scribd's tech blog

Our tech blog is published to [tech.scribd.com](https://tech.scribd.com). The
goal of the site is to share what we're up to as we build, design, and deploy
the technology that powers [scribd.com](https://scribd.com).


## Content Guidelines

The `CONTRIBUTING` document has some details on how to contribute to this
repository, but if you've contributed to a Jekyll-based site before, this
should all be fairly straight-forward.

The types of content published should generally be technology oriented, but
discussions about organization culture, collaboration, and process are welcome
so long as they pass the bar of: "would this be interesting to somebody we
would want to work with us?"

# Local build

```
# If you don't have Ruby 2.6 installed
# jekyll-sass-converter requires Ruby version >= 2.4.0
# Default MacOS ruby version is 2.3
# Ruby < 2.6 are not maintained anymore
# Ruby 2.7 prints bunch of warnings for Jekyll < 3.8.7
# Using Jekyll 3.8.7 requires bumping github-pages and jekyll-feed
brew install ruby@2.6
echo 'export PATH="/usr/local/opt/ruby@2.6/bin:$PATH"' >> "$HOME/.bash_profile"
source "$HOME/.bash_profile"

sudo gem install bundler # if you don't have bundler installed
bundle config set path vendor
bundle install

bundle exec jekyll serve --livereload # for auto-updading
open http://localhost:4000
```
