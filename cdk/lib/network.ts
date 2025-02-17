import * as ec2 from "aws-cdk-lib/aws-ec2"
import { Construct } from "constructs"

export class NetworkStack extends Construct {
    public readonly vpc: ec2.IVpc
    public ecsSecurityGroup: ec2.SecurityGroup

    constructor(scope: Construct, id: string) {
        super(scope, id)

        this.vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true })

        this.ecsSecurityGroup = new ec2.SecurityGroup(this, "EcsSecurityGroup", {
            vpc: this.vpc,
            description: "Security group for ECS Fargate and endpoints",
        })

        this.ecsSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(this.vpc.vpcCidrBlock),
            ec2.Port.tcp(443),
            "Allow HTTPS inbound from VPC",
        )

        this.vpc.addInterfaceEndpoint("EcrApiEndpoint", {
            service: ec2.InterfaceVpcEndpointAwsService.ECR,
            privateDnsEnabled: true,
            securityGroups: [this.ecsSecurityGroup],
            subnets: { subnetType: ec2.SubnetType.PUBLIC },
        })

        this.vpc.addInterfaceEndpoint("EcrDockerEndpoint", {
            service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
            privateDnsEnabled: true,
            securityGroups: [this.ecsSecurityGroup],
            subnets: { subnetType: ec2.SubnetType.PUBLIC },
        })

        this.vpc.addInterfaceEndpoint("LogsEndpoint", {
            service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
            privateDnsEnabled: true,
            securityGroups: [this.ecsSecurityGroup],
            subnets: { subnetType: ec2.SubnetType.PUBLIC },
        })

        this.vpc.addInterfaceEndpoint("SecretsManagerEndpoint", {
            service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
            privateDnsEnabled: true,
            securityGroups: [this.ecsSecurityGroup],
            subnets: { subnetType: ec2.SubnetType.PUBLIC },
        })

        this.vpc.addGatewayEndpoint("S3Endpoint", {
            service: ec2.GatewayVpcEndpointAwsService.S3,
            subnets: [{ subnetType: ec2.SubnetType.PUBLIC }],
        })
    }
}
