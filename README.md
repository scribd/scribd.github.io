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
brew install ruby@2.7
echo 'export PATH="/usr/local/opt/ruby@2.7/bin:$PATH"' >> "$HOME/.bash_profile"
source "$HOME/.bash_profile"

sudo gem install jekyll bundler
bundle install

bundle exec jekyll serve --livereload # for auto-updading
open http://localhost:4000
```
