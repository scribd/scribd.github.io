---
layout: post
title: "Information Extraction at Scribd"
tags:
- machinelearning
- data
- featured
team: Applied Research
authors:
- antoniam
- rafaelp
---

Extracting metadata from our documents is an important part of our discovery
and recommendation pipeline, but discerning useful and relevant details
from text-heavy user-uploaded documents can be challenging. This is
part 2 in a series of blog posts describing a multi-component machine learning
system the Applied Research team built to extract metadata from our documents in order to enrich downstream discovery models. In this post, we present the challenges and
limitations the team faced when building information extraction NLP models for Scribd's 
text-heavy documents and how they were solved.

As mentioned in [part 1](/blog/2021/identifying-document-types.html), we now have a way of identifying text-heavy documents. Having done that, we want to build dedicated models to deepen our semantic understanding of them. We do this by extracting keyphrases and entities.

<figure>
    <img width="662" alt="Figure 1: Diagram of our multi-component machine learning system. " src="https://user-images.githubusercontent.com/11147367/126206943-9deabf5f-6add-4a01-9e20-5ed8f9e10069.png">
  <figcaption> Figure 1: Diagram of our multi-component machine learning system. </figcaption>
</figure>

Keyphrases are phrases that represent major themes/topics, whereas entities are proper nouns such as people, places and organizations. For example, when a user uploads a document about the Manhattan project, we will first detect it is text-heavy, then extract keyphrases and entities. Potential keyphrases would be “atomic bomb” and “nuclear weapons” and potential entities would be “Robert Oppenheimer” and “Los Alamos”.

As keyphrase extraction brings out the general topics discussed in a document, it helps put a cap on the amount of information kept per document, resulting in a somewhat uniform representation of documents irrespective of their original size. Entity extraction, on the other hand, identifies elements in a text that aren't necessarily reflected by keyphrases only. We found the combination of keyphrase and entity extraction to provide a rich semantic description of each document.

The rest of this post will explain how we approached keyphrase and entity extraction, and how we identified whether a subset of these keyphrases and entities are present in a knowledge base (also known as linking), and introduce how we use them to categorize documents.

## Keyphrase Extraction

Typically a keyphrase extraction system operates in two steps as indicated in this survey: 

- Using heuristics to extract a list of words/phrases that serve as candidate keyphrases, such as part-of-speech language patterns, stopwords filtering, and n-grams with Wikipedia article titles

- Determining which of these candidate keyphrases are most likely to be keyphrases, using one of the two approaches:

  - Supervised approaches such as binary classification of candidates (useful/not useful), structural features based on positional encoding, etc.

  - Unsupervised approaches such as selecting terms with the highest tf-idf and clustering.

Training a decent supervised model to be able to extract keyphrases across a wide variety of topics would require a large amount of training data, and might generalize very poorly. For this reason, we decided to take the unsupervised approach.

Our implementation of keyphrase extraction is optimized for speed without sacrificing keyphrase quality much. We employ both a statistical method and language specific rules to identify them efficiently.

We simply start by filtering out stopwords and extracting the n-grams with a base n (bi-grams in our case, n=2). This step is fast and straightforward and results in an initial set of candidate n-grams. 

Limiting the results to a single n-gram class, however, results in split keyphrases, which makes linking them to a knowledge base a challenging task. For that, we attempt to agglomerate lower order n-grams into potentially longer keyphrases, as long as they occur at a predetermined minimum frequency as compared to the shorter n-gram, based on the following a pattern: 

`A sequence of nouns (NN) possibly interleaved with either Coordinating Conjunctions (CC) or Prepositions and Subordinating Conjunctions (IN).`

Here are a few examples:

- Assuming the minimum frequency of agglomeration is 0.5, that means we would only replace the bi-gram `world (NN) health (NN)` by `world (NN) health (NN) organization (NN)` as long as `world health organization` occurs at least 50% as much as `world health` occurs. 

- Replace `Human (NNP) Development (NNP)` with `Center(NNP) for (IN) Global (NNP) Development (NNP)` only if the latter occurs at least a predetermined percentage of time as compared to the former.

This method results in more coherent and complete keyphrases that could be linked more accurately to a knowledge base entry.

Finally we use the count of occurrences of the candidate keyphrase as a proxy to its importance. This method is reliable for longer documents, as the repetition of a keyphrase tends to reliably indicate its centrality to the document’s topic. 

## Named Entities

Keyphrases are only one side of finding what’s important in a document. To further capture what a document is about, we must also consider the named entities that are present.

Named Entity Extraction systems identify instances of named entities in a text, which we can count in order to represent their importance in the document, similar to how we did with keyphrases.

Naively counting named entities through exact string matches surfaces an interesting problem: a single entity may go by many names or aliases, which means string frequency is an unreliable measurement of importance. In the example given in Figure 2, we know that “MIll”, “John Stuart Mill” and “Stuart Mill” all refer to the same person. This means that Mill is even more central to the document than the table indicates, since he is referred to a total of 8 times instead of 5.


<figure>
    <img width="662" alt="Figure 2: Excerpt from John Stuart Mill’s Wikipedia page (left) and Top 5 Named Entity counts of the first few paragraphs (right)." src="https://user-images.githubusercontent.com/11147367/126206932-a5612459-e597-4340-a379-d62da58a29dc.png">
  <figcaption> Figure 2: Excerpt from John Stuart Mill’s Wikipedia page (left) and Top 5 Named Entity counts of the first few paragraphs (right). </figcaption>
</figure>

To address this counting problem, let's introduce a few abstractions:

- `Named Entity` refers to a unique person, place or organization. Because of their uniqueness, we can represent them with a unique identifier (ID). 

- `Named Entity Alias` (or simply Alias), is one of possibly many names associated with a particular entity.

- `Canonical Alias` is the preferred name for an entity.

- `Named Entity Mention` (or simply `Mention`), refers to each occurrence in a text that a Named Entity was referred to, regardless of which Alias was used.

- `Knowledge Base` is a collection of entities, allowing us to query for ID, canonical name, aliases and other information that might be relevant for the task at hand. One example is [Wikidata](https://www.wikidata.org/wiki/Wikidata:Main_Page).

The first step to solve the counting problem is to normalize the names a document uses to refer to a named entity. Using our abstractions, this means we want to find all the mentions in a document, and use its alias to find the named entity it belongs to. Then, replace it with either the canonical name or the named entity ID - this distinction will become clearer later on.

### Entity Normalization

Given a set of aliases that appear in a document, we developed heuristics (e.g. common tokens, initials) to identify which subset of aliases refer to the same named entity. This allowed us to limit our search space when comparing aliases.

Using our previous example to illustrate this method, we start by assuming the canonical alias is the longest alias in a text for a given entity, and attempt to merge aliases together by evaluating which aliases match the heuristics we developed. 

<figure>
    <img width="662" alt="Table 1: Top 5 occurring aliases in the first few paragraphs of John Stuart Mill’s Wikipedia page, some referring to the same person.
" src="https://user-images.githubusercontent.com/11147367/126228221-7b9c6062-5ba3-4734-ae7f-49b00244792d.png">
  <figcaption> Table 1: Top 5 occurring aliases in the first few paragraphs of John Stuart Mill’s Wikipedia page, some referring to the same person.
 </figcaption>
</figure>

Comparing entities with each other using exact token matching as a heuristic would solve this:

<figure>
    <img width="662" alt="Table 2: Pairwise alias comparisons and resulting merges. Matches highlighted in bold." src="https://user-images.githubusercontent.com/11147367/126228205-d657fd20-3bc1-408a-b8e6-70a40fb74ade.png">
  <figcaption> Table 2: Pairwise alias comparisons and resulting merges. Matches highlighted in bold.
 </figcaption>
</figure>

By replacing all mentions with its corresponding canonical alias, we are able to find the correct named entity counts.

One edge case is when an alias might refer to more than one entity: e.g. the alias “Potter” could refer to the named entities “Harry Potter” or “James Potter” within the Harry Potter universe. To solve this, we built an Entity Linker, which determines which named entity is the most likely to match the alias given the context. This process is further explained in the Linking to a Knowledge Base section.

When an entity is not present in a knowledge base, we cannot use Named Entity Linking to disambiguate. In this case, our solution uses a fallback method that assigns the ambiguous mention (Potter) to the closest occurring unambiguous mention that matches the heuristics (e.g. Harry). 

## Linking to a Knowledge Base

Given that many keyphrases and entities mentioned in a document are notable, they are likely present in a knowledge base. This allows us to leverage extra information present in the knowledge base to improve the normalization step as well as downstream tasks.

Entity Linking assists normalization by providing information that an alias matches a named entity, which otherwise wouldn't match a heuristic (e.g. “Honest Abe” versus “Abraham Lincoln”). Furthermore, [information in a knowledge base can be used to embed linked entities and keyphrases in the same space as text](https://arxiv.org/abs/1601.01343).

Being able to embed entities in the same space as text is useful, as this unlocks the ability to [compare possible matching named entity IDs with the context in which they’re mentioned](https://arxiv.org/abs/1911.03814), and make a decision on whether an alias we’re considering might be one of the entities in the knowledge base (in which case we will use IDs), or whether the alias doesn't match any entity in the knowledge base, in which case we fall back to using the assumed canonical alias. 

At Scribd we make use of Entity Linking to not only improve the Entity Normalization step, but also to take advantage of entity and keyphrase embeddings as supplemental features.

## Discussion

Putting all of this together, we can:

1. Link documents to keyphrases and entities

1. Find the relative importance of each in a document

1. Take advantage of relevant information in knowledge bases

This has enabled some interesting projects:

In one of them, the Applied Research team built a graph of documents along with their related keyphrases and entities. Embedding documents, keyphrases and entities in the same space allowed us to discover documents by analogy. For example, take `The Count of Monte Cristo` by Alexandre Dumas, a 19th century French novel about revenge. If we add to its embedding the embedding of `science_fiction`, it leads us to a collection of science fiction novels by Jules Verne (another 19th century French author), such as `20,000 Leagues Under the Sea` and `Journey to the Center of the Earth`.

Keyphrase extractions have also been useful in adding clarity to document clusters. By extracting the most common keyphrases of a cluster, we can derive a common theme for the cluster’s content:


<figure>
    <img width="662" alt="Figure 3: Top keyphrases in a document cluster. The keywords imply that the documents therein are related to dentistry & healthcare, which was confirmed by manually inspecting the documents." src="https://user-images.githubusercontent.com/11147367/126206921-31cea5fb-989c-4468-bb0e-508935f20636.png">
  <figcaption> Figure 3: Top keyphrases in a document cluster. The keywords imply that the documents therein are related to dentistry & healthcare, which was confirmed by manually inspecting the documents. </figcaption>
</figure>

In yet another project, the team leveraged precomputed knowledge base embeddings to represent a document in space through a composition of the entities and keyphrases it contains. These features allowed us to understand the documents uploaded by our users and improve the content discovery on the platform.

To see how we use the information extracted to classify documents into a
taxonomy, make sure to check out [part 3](/blog/2021/categorizing-user-uploaded-documents.html).

If you're interested to learn more about the problems Applied Research
is solving, or the systems which are built around those solutions,
check out [our open positions!](/careers/#open-positions)

