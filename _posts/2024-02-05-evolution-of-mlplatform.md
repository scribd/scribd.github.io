--- 
layout: post 
title: "The Evolution of the Machine Learning Platform" 
team: Machine Learning Platform 
author: bshaw
tags: 
- mlops
- featured
- ml-platform-series
---

Machine Learning Platforms (ML Platforms) have the potential to be a key component in achieving production ML at scale without large technical debt, yet ML Platforms are not often understood. This document outlines the key concepts and paradigm shifts that led to the conceptualization of ML Platforms in an effort to increase an understanding of these platforms and how they can best be applied.


Technical Debt and development velocity defined
-----------------------------------------------

### Development Velocity

Machine learning development velocity refers to the speed and efficiency at which machine learning (ML) projects progress from the initial concept to deployment in a production environment. It encompasses the entire lifecycle of a machine learning project, from data collection and preprocessing to model training, evaluation, validation deployment and testing for new models or for re-training, validation and deployment of existing models.

### Technical Debt

The term "technical debt" in software engineering was coined by Ward Cunningham, Cunningham used the metaphor of financial debt to describe the trade-off between implementing a quick and dirty solution to meet immediate needs (similar to taking on financial debt for short-term gain) versus taking the time to do it properly with a more sustainable and maintainable solution (akin to avoiding financial debt but requiring more upfront investment). Just as financial debt accumulates interest over time, technical debt can accumulate and make future development more difficult and expensive.

The idea behind technical debt is to highlight the consequences of prioritizing short-term gains over long-term maintainability and the need to address and pay off this "debt" through proper refactoring and improvements. The term has since become widely adopted in the software development community to describe the accrued cost of deferred work on a software project.

### Technical Debt in Machine Learning

Originally a software engineering concept, Technical debt is also relevant to Machine Learning Systems infact the landmark google paper suggest that ML systems have the propensity to easily gain this technical debt.

> Machine learning offers a fantastically powerful toolkit for building useful complex prediction systems quickly. This paper argues it is dangerous to think of these quick wins as coming for free. Using the software engineering framework of technical debt , we ﬁnd it is common to incur massive ongoing maintenance costs in real-world ML systems
> 
> [Sculley et al (2021) Hidden Technical Debt in Machine Learning Systems](https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems)

> As the machine learning (ML) community continues to accumulate years of experience with livesystems, a wide-spread and uncomfortable trend has emerged: developing and deploying ML sys-tems is relatively fast and cheap, but maintaining them over time is difﬁcult and expensive
> 
> [Sculley et al (2021) Hidden Technical Debt in Machine Learning Systems](https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems)

Technical debt is important to consider especially when trying to move fast. Moving fast is easy, moving fast without acquiring technical debt is alot more complicated.

The Evolution Of ML Platforms
-----------------------------

### DevOps -- The paradigm shift that led the way

DevOps is a methodology in software development which advocates for teams owning the entire software development lifecycle. This paradigm shift from fragmented teams to end-to-end ownership enhances collaboration and accelerates delivery. Dev ops has become standard practice in modern software development and the adoption of DevOps has been widespread, with many organizations considering it an essential part of their software development and delivery processes. Some of the principles of DevOps are:

1.  **Automation**
    
2.  **Continuous Testing**
    
3.  **Continuous Monitoring**
    
4.  **Collaboration and Communication**
    
5.  **Version Control**
    
6.  **Feedback Loops**
    

### Platforms -- Reducing Cognitive Load

This shift to DevOps and teams teams owning the entire development lifecycle introduces a new challenge—additional cognitive load. Cognitive load can be defined as

> The total amount of mental effort a team uses to understand, operate and maintain their designated systems or tasks.
> 
> [Skelton & Pais (2019) Team Topologies](https://teamtopologies.com/book)

The weight of the additional load introduced in DevOps of teams owning the entire software development lifecycle can hinder productivity, prompting organizations to seek solutions.

Platforms emerged as a strategic solution, delicately abstracting unnecessary details of the development lifecycle. This abstraction allows engineers to focus on critical tasks, mitigating cognitive load and fostering a more streamlined workflow.

> The purpose of a platform team is to enable stream-aligned teams to deliver work with substantial autonomy. The stream-aligned team maintains full ownership of building, running, and fixing their application in production. The platform team provides internal services to reduce the cognitive load that would be required from stream-aligned teams to develop these underlying services.
> 
> [Skelton & Pais (2019) Team Topologies](https://teamtopologies.com/book)

> Infrastructure Platform teams enable organisations to scale delivery by solving common product and non-functional requirements with resilient solutions. This allows other teams to focus on building their own things and releasing value for their users
> 
> [Rowse & Shepherd (2022) Building Infrastructure Platforms](https://martinfowler.com/articles/building-infrastructure-platform.html)

### ML Ops -- Reducing technical debt of machine learning

The ability of ML systems to rapidly accumulate technical debt has given rise to the concept of MLOps. MLOps is a methodology that takes inspiration from and incorporates best practices of the DevOps, tailoring them to address the distinctive challenges inherent in machine learning. MLOps applies the established principles of DevOps to machine learning, recognizing that merely a fraction of real-world ML systems comprises the actual ML code. Serving as a crucial bridge between development and the ongoing intricacies of maintaining ML systems.
MLOps is a methodology that provides a collection of concepts and workflows designed to promote efficiency, collaboration, and sustainability of the ML Lifecycle. Correctly applied MLOps can play a pivotal role controlling technical debt and ensuring the efficiency, reliability, and scalability of the machine learning lifecycle over time.

Scribd's ML Platform -- MLOps and Platforms in Action
-------------------------------------
At Scribd we have developed a machine learning platform which provides a curated developer experience for machine learning developers. This platform has been built with MLOps in mind which can be seen through its use of common DevOps principles.

1.  **Automation:**    
    *  Applying CI/CD strategies to model deployments through the use of Jenkins pipelines which deploy models from the Model Registry to AWS based endpoints.
    *  Automating Model training throug the use of Airflow DAGS and allowing these DAGS to trigger the deployment pipelines to deploy a model once re-training has occured.
        
2.  **Continuous** **Testing:**
    *   Applying continuous testing as part of a model deployment pipeline, removing the need for manual testing.
    *   Increased tooling to support model validation testing.
        
3.  **Monitoring:**
    *   Monitoring real time inference endpoints
    *   Monitoring training DAGS
    *   Monitoring batch jobs
        
4.  **Collaboration and Communication:**
    *   Feature Store which provides feature discovery and re-use
    *   Model Database which provides model collaboration
        
6.  **Version Control:**
    *   Applying version control to experiments, machine learning models and features
        

References
----------

[Bottcher (2018, March 05). What I Talk About When I Talk About Platforms. https://martinfowler.com/articles/talk-about-platforms.html](https://martinfowler.com/articles/talk-about-platforms.html)

[D. Sculley, Gary Holt, Daniel Golovin, Eugene Davydov, Todd Phillips, Dietmar Ebner, Vinay Chaudhary, Michael Young, Jean-Franc¸ois Crespo, Dan Dennison (2021) Hidden Technical Debt in Machine Learning Systems](https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems)

[Fowler (2022, October 20).Conway's Law. https://martinfowler.com/bliki/ConwaysLaw.html](https://martinfowler.com/bliki/ConwaysLaw.html)

[Galante, what is platform engineering. https://platformengineering.org/blog/what-is-platform-engineering](https://platformengineering.org/blog/what-is-platform-engineering)

[Humanitect, State of Platform Engineering Report](https://www.scribd.com/document/611845499/Whitepaper-State-of-Platform-Engineering-Report)

[Hodgson (2023, July 19).How platform teams get stuff done. https://martinfowler.com/articles/platform-teams-stuff-done.html](https://martinfowler.com/articles/platform-teams-stuff-done.html)

[Murray (2017, April 27. The Art of Platform Thinking. https://www.thoughtworks.com/insights/blog/platforms/art-platform-thinking)](https://www.thoughtworks.com/insights/blog/platforms/art-platform-thinking)

[Rouse (2017, March 20). Technical Debt. https://www.techopedia.com/definition/27913/technical-debt](https://www.techopedia.com/definition/27913/technical-debt)

[Rowse & Shepherd (2022).Building Infrastructure Platforms. https://martinfowler.com/articles/building-infrastructure-platform.html](https://martinfowler.com/articles/building-infrastructure-platform.html)

[Skelton & Pais (2019) Team Topologies](https://teamtopologies.com/book)
