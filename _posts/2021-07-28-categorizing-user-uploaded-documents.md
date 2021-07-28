---
layout: post
title: "Categorizing user-uploaded documents"
tags:
- machinelearning
- data
- featured
- kyc-series
team: Applied Research
author: moniquec
---

Scribd offers a variety of publisher and user-uploaded content to our users and
while the publisher content is rich in metadata, user-uploaded content
typically is not. Documents uploaded by the users have varied subjects and
content types which can make it challenging to link them together.  One way to
connect content can be through a taxonomy - an important type of structured
information widely used in various domains. In this series, we have already
shared how we [identify document
types](/blog/2021/identifying-document-types.html) and [extract information
from documents](/blog/2021/information-extraction-at-scribd.html), this post
will discuss how insights from data were used to help build the taxonomy and
our approach to assign categories to the user-uploaded documents.


## Building the taxonomy

The unified taxonomy is a tree-structure with two layers that was designed by combining our Subject Matter Experts' (SME) knowledge of the book industry subject headings ([BISAC](https://bisg.org/page/BISACEdition) categories) and data-driven insights. We used user-reading patterns to find topics that could help enrich our unified taxonomy.

### Data-Driven Insights

Users have been interacting with Scribd content for more than 10 years, building reading patterns throughout time. We leveraged these reading patterns to create dense vector representations of documents similarly to word2vec in text.

<figure>
    <img width="662" alt="Schematic representation of our approach: reading sequences are used to create vector representations for user uploaded documents. The vector dimension shown is merely illustrative." src="https://user-images.githubusercontent.com/37147739/127040318-ba998c66-5751-4efd-8c92-a078b642aa2e.png">
  <figcaption> Figure 1: Schematic representation of our approach: reading sequences are used to create vector representations for user uploaded documents. The vector dimension shown is merely illustrative. </figcaption>
</figure>

For this work we focused only on user uploaded documents and on one type of interaction (reading for a minimum amount of time). The embeddings dimensions (and other hyperparamenters) were chosen to optimize the hit-ratio@20 ([Caselles-Dupré, et al 2018](https://arxiv.org/abs/1804.04212)) increasing how semantically tight the embeddings are.

Now that we have the embeddings we would like to use them to find groups of documents with similar subjects and topics. Finding these groups will help us identify categories that should be added to the taxonomy.

Dimensionality reduction allows for dense clusters of documents to be found more efficiently and accurately in the reduced space in comparison to the original high-dimensional space of our embeddings. We reduced the dimension of the embeddings using the [t-SNE](https://scikit-learn.org/stable/modules/generated/sklearn.manifold.TSNE.html) algorithm. t-SNE has a non-linear approach that can capture the smaller relationships between the points, as well as the global structure of the data. We used an implementation of t-SNE (Fast Fourier Transform accelerated Interpolation-based t-SNE” - [FIt-SNE](https://github.com/KlugerLab/FIt-SNE)) that is flexible and does not sacrifice accuracy for speed.

Finally, we grouped the user-uploaded docs by clustering the reduced embeddings using [HDBSCAN](https://arxiv.org/pdf/1709.04545.pdf). HDBSCAN separates data points into clusters based on the density distribution. It also has a feature to detect noise, which are points that are too far from the nearest detected cluster to belong to it, and lack the density to form their own cluster.

Figure 2 shows the 2D representation of the user-uploaded documents and their groups. The first thing we noticed and is highlighted in this figure is that the major groups are usually represented by language. Not surprisingly users tend to read content mostly on one single language.

<figure>
    <img width="662" alt="Figure 2: Initial 2D representation of the embeddings using t-SNE and HDBSCAN. Each colored group represents a cluster found by HDBSCAN. Spread grey points were identified as noise." src="https://user-images.githubusercontent.com/37147739/127041136-9ee4f09d-5215-4624-b02f-bc11b82b4cdb.png">
  <figcaption> Figure 2: Initial 2D representation of the embeddings using t-SNE and HDBSCAN. Each colored group represents a cluster found by HDBSCAN. Spread grey points were identified as noise. </figcaption>
</figure>

We developed a technique to further split the groups above in smaller clusters that are semantically tighter. The final clusters can be seen in Figure 3.

<figure>
    <img width="662" alt="Figure 3: Final 2D representation of the embeddings after further splitting of each cluster. Each colored group represents a subcluster found by HDBSCAN for a particular cluster. Spread grey points were identified as noise." src="https://user-images.githubusercontent.com/37147739/127041180-4fd2e8f6-3f31-439b-91dd-ead4749ad68e.png">
  <figcaption> Figure 3: Final 2D representation of the embeddings after further splitting of each cluster. Each colored group represents a subcluster found by HDBSCAN for a particular cluster. Spread grey points were identified as noise. </figcaption>
</figure>

After we got the clusters and subclusters shown in Figure 3, an inspection of the English subclusters was performed in order to identify their major subjects and themes. This investigation led to the incorporation of additional categories into the taxonomy, such as Philippine law, Study aids & test prep, and Teaching methods & materials, making the taxonomy broader across different content types and the browsing to this content more straightforward.

## Placing documents into categories

<figure>
    <img width="552" alt="Figure 4: Diagram of Scribd’s multi-component pipeline. Categorization is one of the downstream tasks highlighted in the diagram." src="https://user-images.githubusercontent.com/37147739/127041306-c60b3453-e2e0-4f50-b283-6584c2ab0c5a.png">
  <figcaption> Figure 4: Diagram of Scribd’s multi-component pipeline. Categorization is one of the downstream tasks highlighted in the diagram. </figcaption>
</figure>

Now that we have the taxonomy, it is time to place the documents into categories. Our approach leverages the extracted key phrases and entities discussed in [part II](/blog/2021/information-extraction-at-scribd.html) of the series. Figure 5 illustrates how our model works: we trained a supervised model to place documents identified as text-heavy (see [part I](/blog/2021/identifying-document-types.html)) into categories using key phrases, entities and the text.

<figure>
    <img width="662" alt="Figure 5: Model architecture to categorize docs." src="https://user-images.githubusercontent.com/37147739/127041352-d40f9d45-7766-410d-90ce-116b23929be3.png">
  <figcaption> Figure 5: Model architecture to categorize docs. </figcaption>
</figure>

### Additional insights from data

In the first iteration of the model, we had a dataset for training collected by our experts to fit the definition of each category. Not surprisingly, upon testing the model on unseen data in production, we realized that for some categories the training set was not a complete representation of the type of documents in production that could fit them. For this reason, the model was unable to generalize with the initial given training set. As an example, in the initial training set most documents about countries other than the US were documents about travel. This means that the model learned that whenever a document mentions other countries, the document is most likely about travel. For this reason, documents about business in South America, for instance, would be placed under travel by the model.

We applied a technique sometimes referred to as active learning to supplement our training set with the missing examples. Following this technique (Figure 6), the model is applied to a random sample of documents and the results analyzed by our SMEs.

<figure>
    <img width="662" alt="Figure 6: Active Learning Process used to improve model performance." src="https://user-images.githubusercontent.com/37147739/127041436-010ca99d-ce71-4d25-9dad-afaed4a427eb.png">
  <figcaption> Figure 6: Active Learning Process used to improve model performance. </figcaption>
</figure>

This iterative process had two outcomes: improved the categories performance by re-training the model with a large variety of training example and the addition of a new category after we identified that a good fraction of documents fitted this particular category,

## Additional Experiments

Throughout this project several experiments were performed to explore the full potential of the user interaction clusters.  Here we will show one exciting example of such experiment.

#### Giving names to clusters

As explained above, in general, each subcluster shown in figure 3 is semantically tight which means that the documents belonging to a subcluster are usually about one (or few) topic(s)/subject(s).

One way to associate topics to the subclusters would require Subject Matter Experts to manually inspect the documents in each subcluster and come up with the most important topics for each of them. However, this approach is not only time consuming, and thus not scalable with new iterations of the model and a likely increasing number of clusters. It is very important to try and make this a more automatic and flexible process.

We experimented with a very promising  two-step approach to automatically assign topics to subclusters. In this approach, we leverage the extracted information from the text described in [part II](/blog/2021/information-extraction-at-scribd.html) and zero-shot topic classification (more info [here](https://arxiv.org/abs/1909.00161)):

Step 1 - Find the subclusters' most representative key phrases by clustering their documents' extracted info.

<figure>
    <img width="662" alt="Figure 7: Illustration of Step 1." src="https://user-images.githubusercontent.com/37147739/127041536-95fb49e9-feea-4700-9699-f2aac5371746.png">
  <figcaption> Figure 7: Illustration of Step 1. </figcaption>
</figure>

Step 2 - Use the result of step 1 and zero-shot topic classification to find the highest ranking topics for each subcluster.

<figure>
    <img width="662" alt="Figure 8: Illustration of Step 2. The bar plot with the highest ranking topics is the result of this approach for a subcluster that contains essays about several literary works." src="https://user-images.githubusercontent.com/37147739/127041581-262f65a9-8077-4aa2-924d-f01ad5d1654a.png">
  <figcaption> Figure 8: Illustration of Step 2. The bar plot with the highest ranking topics is the result of this approach for a subcluster that contains essays about several literary works. </figcaption>
</figure>

As it can be seen in figure 8, a cluster composed of literary works' essays has as the highest ranking topic literary criticism showing the potential of this approach for automatically giving names to user interaction clusters.

## Conclusion

Two important takeaways from this journey of categorizing documents were:

**High quality labeled data** - We found that clean and consistently labelled data was much more important to the model than hyperparameter tuning. However, getting enough documents that fit the categories in our diverse corpus was a challenge. Several techniques were used to improve model performance on unseen data. Among them, active learning proved to be an important way to collect additional training samples and to guarantee the required granularity in the training set.

**Annotation alignment**  -  High quality data and model performance are both connected to the annotation process (see more [here](https://www.youtube.com/watch?v=06-AZXmwHjo)). When multiple annotators are involved in the data collection and evaluation, alignment on the definition of each category is crucial for an accurate training and evaluation of the model. This is even more essential in text classification, since associating categories/topics to a text can be a very subjective task, specially when we are dealing with a single-label categorization problem.

This project was an important milestone in understanding our user-uploaded documents: Classifying documents has enabled users to browse documents by category from our unified taxonomy. Additionally, we now have the power of understanding the categories that each user is interested in and interacts with. Combining the user interests with business metrics could help drive innovative and unexpected product decisions as well as enrich discoverability and recommendations.

## Next Steps

**Improve taxonomy using a data driven approach:**

Moving forward, how can we make sure that newly uploaded documents are covered in our taxonomy?

Using a data driven approach to build the taxonomy answers these questions and guarantees more flexibility, comprehensiveness, and specificity as opposed to a manually created taxonomy. As new content is uploaded to our platform and read by users, new user interaction clusters will form and help us identify recent user interests. For instance, during the pandemic, users started uploading documents related to Covid-19. Clustering the documents in 2021 for example, yields an additional cluster related to Covid-19, one that did not exist prior to the pandemic. This approach will help us build a less rigid taxonomy, a taxonomy that reflects Scribd’s vast content and is easily expandable in the long run.

**Multi-language:**

Now that we understand more our user-uploaded content in English and that we have a consistent pipeline to give labels to these documents, we can extend this approach to other languages

This work and post were done in collaboration with my colleague [Antonia Mouawad](https://ca.linkedin.com/in/antoniamouawad) on the Applied Research team. If you're interested to learn more about the problems Applied Research is solving, or the systems which are built around those solutions, check out [our open positions](/careers/#open-positions).
