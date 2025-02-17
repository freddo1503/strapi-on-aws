import * as path from "node:path"
import * as cdk from "aws-cdk-lib"
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager"
import * as cloudfront from "aws-cdk-lib/aws-cloudfront"
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns"
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as route53Targets from "aws-cdk-lib/aws-route53-targets"
import * as s3 from "aws-cdk-lib/aws-s3"
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment"
import type { Construct } from "constructs"
import { Database } from "./database"
import { SSMParameterReader, getEnvVar } from "./helpers"
import { NetworkStack } from "./network"

type StrapiProps = cdk.StackProps & {
    strapiPath: string
    domainName: string
    certificateParameterName: string
}

export class Strapi extends cdk.Stack {
    constructor(scope: Construct, id: string, props: StrapiProps) {
        super(scope, id, props)

        const network = new NetworkStack(this, "Network")

        const database = new Database(this, "StrapiDatabase", { vpc: network.vpc })

        const adminBucket = new s3.Bucket(this, "AdminPanelBucket", {
            websiteIndexDocument: "index.html",
            publicReadAccess: true,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        })

        const certificate = certificatemanager.Certificate.fromCertificateArn(
            this,
            "Certificate",
            new SSMParameterReader(this, "CertificateARNReader", {
                parameterName: props.certificateParameterName,
                region: "us-east-1",
            }).getParameterValue(),
        )

        const adminDistribution = new cloudfront.Distribution(this, "AdminPanelDistribution", {
            defaultRootObject: "index.html",
            domainNames: [`admin.${getEnvVar("DOMAIN_NAME")}`],
            certificate,
            defaultBehavior: {
                origin: new cloudfrontOrigins.S3StaticWebsiteOrigin(adminBucket),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            },
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: "/404.html",
                    ttl: cdk.Duration.seconds(10),
                },
            ],
        })

        new s3deploy.BucketDeployment(this, "DeployAdminPanel", {
            sources: [s3deploy.Source.asset(path.resolve(props.strapiPath, "dist/build"))],
            destinationBucket: adminBucket,
            distribution: adminDistribution,
        })

        const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
            domainName: getEnvVar("DOMAIN_NAME"),
        })

        const cluster = new ecs.Cluster(this, "StrapiCluster", { vpc: network.vpc })

        const fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(this, "StrapiService", {
            cluster,
            domainName: `api.${getEnvVar("DOMAIN_NAME")}`,
            domainZone: hostedZone,
            assignPublicIp: false,
            protocol: elbv2.ApplicationProtocol.HTTPS,
            taskSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset(props.strapiPath),
                containerPort: 1337,
                environment: {
                    JWT_SECRET: getEnvVar("JWT_SECRET"),
                    ADMIN_JWT_SECRET: getEnvVar("ADMIN_JWT_SECRET"),
                    API_TOKEN_SALT: getEnvVar("API_TOKEN_SALT"),
                    APP_KEYS: getEnvVar("APP_KEYS"),
                    STRAPI_ADMIN_BACKEND_URL: getEnvVar("STRAPI_ADMIN_BACKEND_URL"),
                },
                secrets: {
                    DATABASE_PORT: ecs.Secret.fromSecretsManager(database.credentialsSecret, "port"),
                    DATABASE_NAME: ecs.Secret.fromSecretsManager(database.credentialsSecret, "dbname"),
                    DATABASE_CLIENT: ecs.Secret.fromSecretsManager(database.credentialsSecret, "engine"),
                    DATABASE_HOST: ecs.Secret.fromSecretsManager(database.credentialsSecret, "host"),
                    DATABASE_USERNAME: ecs.Secret.fromSecretsManager(database.credentialsSecret, "username"),
                    DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(database.credentialsSecret, "password"),
                },
            },
            securityGroups: [network.ecsSecurityGroup],
        })

        fargateService.targetGroup.configureHealthCheck({
            path: "/api/health",
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(5),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 3,
        })

        new route53.ARecord(this, "ApiAliasRecord", {
            zone: hostedZone,
            target: route53.RecordTarget.fromAlias(new route53Targets.CloudFrontTarget(adminDistribution)),
            recordName: `admin.${getEnvVar("DOMAIN_NAME")}`,
        })

        new cdk.CfnOutput(this, "AdminPanelCloudfrontUrl", {
            value: adminDistribution.distributionDomainName,
        })

        new cdk.CfnOutput(this, "StrapiBackendUrl", {
            value: fargateService.loadBalancer.loadBalancerDnsName,
        })
    }
}
