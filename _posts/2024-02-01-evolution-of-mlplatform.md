--- 
layout: post title: "The Evolution of the Machine Learning Platform" 
team: Machine Learning Platform 
author: bshaw
tags: 
- ml
- mlops
- devops
- platform
---

Technical Debt is not unique to Software Engineering and is a concept applicable to production Machine Learning (ML) at scale. Machine Learning Platforms (ML Platforms) have the potential to be a key component to achieving production ML at scale without large technical debt, yet ML Platforms are not often well understood. This document outlines the key concepts and paradigm shifts that led to the conceptualization of ML Platforms and how ML Platforms can act as a key to unlocking Development Velocity without Technical debt.


Technical Debt and development velocity defined
-----------------------------------------------

### Development Velocity

Machine learning development velocity refers to the speed and efficiency at which machine learning (ML) projects progress from the initial concept to deployment and maintenance. It encompasses the entire lifecycle of a machine learning project, from data collection and preprocessing to model training, evaluation, deployment, and ongoing optimization. In platform engineering this is often referred to as rate of change.

### Technical Debt

The term "technical debt" in software engineering was coined by Ward Cunningham, Cunningham used the metaphor of financial debt to describe the trade-off between implementing a quick and dirty solution to meet immediate needs (similar to taking on financial debt for short-term gain) versus taking the time to do it properly with a more sustainable and maintainable solution (akin to avoiding financial debt but requiring more upfront investment). Just as financial debt accumulates interest over time, technical debt can accumulate and make future development more difficult and expensive.

The idea behind technical debt is to highlight the consequences of prioritizing short-term gains over long-term maintainability and the need to address and pay off this "debt" through proper refactoring and improvements. The term has since become widely adopted in the software development community to describe the accrued cost of deferred work on a software project.

### Technical Debt in Machine Learning

Originally a software engineering concept, Technical debt is also relevant to Machine Learning Systems infact the landmark [https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems](google paper)suggest that ML systems have the propensity to easily gain this technical debt.

> Machine learning offers a fantastically powerful toolkit for building useful complex prediction systems quickly. This paper argues it is dangerous to think of these quick wins as coming for free. Using the software engineering framework of technical debt , we ﬁnd it is common to incur massive ongoing maintenance costs in real-world ML systems
> 
> [https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems](https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems)

> As the machine learning (ML) community continues to accumulate years of experience with livesystems, a wide-spread and uncomfortable trend has emerged: developing and deploying ML sys-tems is relatively fast and cheap, but maintaining them over time is difﬁcult and expensive
> 
> [https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems](https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems)

Technical debt is important to consider especially when trying to move fast. Moving fast is easy, moving fast without acquiring technical debt is alot more complicated.

The Evolution Of ML Platforms
-----------------------------

### DevOps -- The paradigm shift that led the way

DevOps is a methodology in software development which advocates for teams owning the entire software development lifecycle. This paradigm shift from fragmented teams to end-to-end ownership enhances collaboration and accelerates delivery. Dev ops has become standard practice in modern software development. The adoption of DevOps has been widespread across various industries, with many organizations considering it an essential part of their software development and delivery processes. Some of the principles of DevOps are:

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
> — [](https://teamtopologies.com/book "https://teamtopologies.com/book")[https://teamtopologies.com/book](https://teamtopologies.com/book)

As teams grapple with the mental effort required by adopting DevOps of understanding, operating, and maintaining systems, cognitive load becomes a barrier to efficiency. The weight of this additional load can hinder productivity, prompting organizations to seek solutions.

Platforms emerged as a strategic solution, delicately abstracting unnecessary details of the development lifecycle. This abstraction allows engineers to focus on critical tasks, mitigating cognitive load and fostering a more streamlined workflow.

> The purpose of a platform team is to enable stream-aligned teams to deliver work with substantial autonomy. The stream-aligned team maintains full ownership of building, running, and fixing their application in production. The platform team provides internal services to reduce the cognitive load that would be required from stream-aligned teams to develop these underlying services.
> 
> — [](https://teamtopologies.com/book "https://teamtopologies.com/book")[https://teamtopologies.com/book](https://teamtopologies.com/book)

> _Infrastructure Platform teams enable organisations to scale delivery by solving common product and non-functional requirements with resilient solutions. This allows other teams to focus on building their own things and releasing value for their users_
> 
> \- [https://martinfowler.com/articles/building-infrastructure-platform.html](https://martinfowler.com/articles/building-infrastructure-platform.html)

### ML Ops -- Reducing technical debt of machine learning

The ability of ML systems to rapidly accumulate technical debt has given rise to the concept of MLOps, a methodology that takes inspiration from and incorporates best practices of the DevOps , tailoring them to address the distinctive challenges and workflows inherent in machine learning and controlling technical debt. MLOps seamlessly applies the established principles of DevOps to the intricate landscape of machine learning, recognizing that merely a fraction of real-world ML systems comprises the actual ML code. Serving as a crucial bridge between development and the ongoing intricacies of maintaining ML systems.

Some examples of concepts of DevOps applied to ML (aka ML Ops) are:

1.  **Automation:**
    
    1.  Automation can be applied to many parts of the machine learning lifecycle. The incorporation of automation not only streamlines processes but also addresses technical debt through the establishment of consistency and a standardized and reproducible approach.
        
    2.  Model deployments which can be automated by the implementation of DevOps CI/CD strategies.
        
    3.  Automation can also be applied to retraining of machine learning models
        
2.  **Continuous** **Testing:**
    
    *   Continuous testing can be applied as part of a model deployment pipeline, removing the need for manual testing (increasing development velocity) and removing technical debt by ensuring tests are performed consistently
        
    *   Model validation can be automated using tooling providing consistency between training iterations.
        
3.  **Monitoring:**
    
    *   Monitoring provides key insights and a steps towards creating vital feedback loops.
        
    *   Monitoring can be applied to real time inference infrastructure revealing performance concerns similar to dev ops.
        
    *   Monitoring can be applied to Model performance and monitor for model drift in realtime, providing realtime insight and analysis to model performance and when it may need to be retrained.
        
4.  **Collaboration and Communication:**
    
    *   Utilize collaboration tools for effective communication and information sharing among team members.
        
    *   Feature Store provides a platform for discovering, re using and collaborating on ML features
        
    *   Model Database provides platform for discovering, re using and collaborating on ML Models
        
5.  **Version Control:**
    
    *   Applying version control to experiments, machine learning models and features provides
        

MLOps is a methodology that provides a collection of concepts and workflows designed to promote efficiency, collaboration, and sustainability of the ML Lifecycle. MLOps plays a pivotal role in ensuring the efficiency, reliability, and scalability of machine learning implementations over time.

The Rise of Machine Learning Platform
-------------------------------------

The paradigm shifts of DevOps, MLOps and Platform Thinking led to the emergence of Machine Learning platforms. ML platforms are the application of MLOps concepts and workflows and provide a curated developer experience for Machine Learning developers throughout the entire ML lifecycle. These platforms address the challenges of cognitive load, technical debt, quality and developer velocity and increase efficiency, collaboration, and sustainability. As the ML team grows, the benefits amplify, creating a multiplier effect that allows organizations to scale whilst maintaining quality.

### Benefits to the Organization

The adoption of a Machine Learning Platform unfolds a spectrum of benefits:

**Increasing Flow of Change (aka developer velocity):** A swift pace in model development and deployment, enhancing overall efficiency.

**Fostering Collaboration Amongst Teams:** Breaking down silos and promoting cross-functional collaboration. The platform becomes the silent foundation for collaboration, facilitating a harmonious working environment.

**Enforcing Best Practices:** Standardizing and ensuring adherence to best practices across ML projects.

**Reducing/Limiting Technical Debt:** Strategically mitigating the risk of accumulating technical debt, ensuring long-term sustainability.

**Multiplier Effect:** As the ML team grows, these benefits of the platform amplify—a dividend that multiplies with organizational growth.

References
----------

[https://www.youtube.com/watch?v=Bfhl8kcSaEI&embeds\_referring\_euri=https%3A%2F%2Fplatformengineering.org%2F&feature=emb\_imp\_woyt](https://www.youtube.com/watch?v=Bfhl8kcSaEI&embeds_referring_euri=https%3A%2F%2Fplatformengineering.org%2F&feature=emb_imp_woyt)

[https://www.atlassian.com/devops/frameworks/team-topologies](https://www.atlassian.com/devops/frameworks/team-topologies)

[https://platformengineering.org/blog/what-is-platform-engineering](https://platformengineering.org/blog/what-is-platform-engineering)

[https://www.thoughtworks.com/insights/blog/platforms/art-platform-thinking](https://www.thoughtworks.com/insights/blog/platforms/art-platform-thinking)

[https://www.scribd.com/document/611845499/Whitepaper-State-of-Platform-Engineering-Report](https://www.scribd.com/document/611845499/Whitepaper-State-of-Platform-Engineering-Report)

[https://martinfowler.com/bliki/ConwaysLaw.html](https://martinfowler.com/bliki/ConwaysLaw.html)

[https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems](https://www.scribd.com/document/428241724/Hidden-Technical-Debt-in-Machine-Learning-Systems)

[https://martinfowler.com/articles/building-infrastructure-platform.html](https://martinfowler.com/articles/building-infrastructure-platform.html)

[https://martinfowler.com/articles/platform-teams-stuff-done.html](https://martinfowler.com/articles/platform-teams-stuff-done.html)

[https://martinfowler.com/articles/talk-about-platforms.html](https://martinfowler.com/articles/talk-about-platforms.html)

[https://www.techopedia.com/definition/27913/technical-debt](https://www.techopedia.com/definition/27913/technical-debt)
