# Strapi on AWS

This repository provides a ready-to-use setup for deploying **Strapi** on **AWS** using **AWS CDK**, **RDS PostgreSQL**,
**ECS Fargate**, **CloudFront**, and **S3**.

## Why Choose Strapi?

Strapi is an open-source headless CMS that emphasizes:

- **Flexibility and Customization**: Tailor content structures to your specific needs.
- **Performance**: Decouple the backend from the frontend to use your preferred tech stack.
- **Scalability**: Expand your infrastructure seamlessly, enabling new features and content types without major
  disruptions.

### Ideal Use Cases

- **Corporate Websites**: Robust, flexible content management.
- **E-commerce Platforms**: Control product catalogs, blogs, and more across multiple channels.
- **Mobile Applications**: Provide structured content for iOS and Android apps.
- **Digital Agencies**: Manage content workflows and collaborate efficiently on various projects.

## Why This Setup?

This setup is designed to simplify deployment, deliver high-performance content, and scale with minimal manual effort:

- **Scalability**: ECS Fargate automatically adjusts resources to handle fluctuating traffic.
- **Managed Database**: RDS PostgreSQL offers automated backups and straightforward scaling for your content data.
- **Efficient Content Delivery**: CloudFront caches and distributes content globally for the Strapi dashboard.
- **Decoupled Media Storage**: Amazon S3 stores uploaded media assets.
- **Infrastructure as Code**: AWS CDK provisions and manages infrastructure as code.
