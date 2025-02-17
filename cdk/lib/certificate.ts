import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm"
import * as cdk from "aws-cdk-lib"
import * as certificatemanager from "aws-cdk-lib/aws-certificatemanager"
import * as route53 from "aws-cdk-lib/aws-route53"
import * as ssm from "aws-cdk-lib/aws-ssm"
import type { Construct } from "constructs"

type Route53Config = {
    hostedZoneId: string
    domainName: string
}

type CertificateStackProps = cdk.StackProps & {
    route53ConfigParameterName: string
    parameterName: string
}

export class Certificate extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CertificateStackProps) {
        super(scope, id, { ...props, env: { region: "us-east-1" } })
        ;(async () => {
            try {
                const route53Config = await getRoute53Config(props.route53ConfigParameterName)
                const { hostedZoneId, domainName } = route53Config

                const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, "HostedZone", {
                    hostedZoneId,
                    zoneName: domainName,
                })

                const certificate = new certificatemanager.Certificate(this, "Certificate", {
                    domainName,
                    subjectAlternativeNames: [`*.${domainName}`],
                    validation: certificatemanager.CertificateValidation.fromDns(hostedZone),
                })

                new ssm.StringParameter(this, "CertificateArnParameter", {
                    parameterName: props.parameterName,
                    description: "Certificate ARN to be used with CloudFront",
                    stringValue: certificate.certificateArn,
                })
            } catch (error) {
                console.error("Error fetching Route 53 config:", error)
                throw error
            }
        })()
    }
}

async function getRoute53Config(parameterName: string): Promise<Route53Config> {
    const ssmClient = new SSMClient({ region: "eu-west-3" })
    const command = new GetParameterCommand({ Name: parameterName })
    const response = await ssmClient.send(command)
    if (response.Parameter?.Value) {
        return JSON.parse(response.Parameter.Value) as Route53Config
    }
    throw new Error("Failed to fetch Route 53 config from SSM")
}
