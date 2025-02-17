import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2"
import * as rds from "aws-cdk-lib/aws-rds"
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager"
import { Construct } from "constructs"

type DatabaseProps = {
    vpc: ec2.IVpc
}

export class Database extends Construct {
    public readonly credentialsSecret: secretsmanager.ISecret
    constructor(scope: Construct, id: string, props: DatabaseProps) {
        super(scope, id)

        this.credentialsSecret = new secretsmanager.Secret(this, "DatabaseCredentials", {
            secretName: "StrapiDatabaseCredentials",
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: "postgres" }),
                generateStringKey: "password",
                excludePunctuation: true,
                passwordLength: 12,
            },
        })

        const database = new rds.DatabaseInstance(this, "PostgresDB", {
            engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_14_15 }),
            vpc: props.vpc,
            vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
            credentials: rds.Credentials.fromSecret(this.credentialsSecret),
            allocatedStorage: 20,
            storageType: rds.StorageType.GP2,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T4G, ec2.InstanceSize.MICRO),
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            databaseName: "strapi",
        })

        database.connections.allowDefaultPortFrom(
            ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
            "Allow connection from entire VPC",
        )
    }
}
