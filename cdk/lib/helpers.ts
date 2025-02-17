import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts"
import { fromIni } from "@aws-sdk/credential-provider-ini"
import { Arn, Stack } from "aws-cdk-lib"
import {
    AwsCustomResource,
    AwsCustomResourcePolicy,
    type AwsSdkCall,
    PhysicalResourceId,
} from "aws-cdk-lib/custom-resources"
import type { Construct } from "constructs"

import * as dotenv from "dotenv"
dotenv.config()

export async function getAccountAndRegion(profile?: string) {
    if (!profile && !process.env.AWS_PROFILE) {
        throw new Error("No profile provided")
    }

    const stsClient = new STSClient({
        credentials: fromIni({ profile: profile || process.env.AWS_PROFILE }),
    })
    const data = await stsClient.send(new GetCallerIdentityCommand({}))
    return {
        account: data.Account,
        region: await stsClient.config.region(),
    }
}

export class SSMParameterReader extends AwsCustomResource {
    constructor(scope: Construct, id: string, { parameterName, region }: { parameterName: string; region: string }) {
        const ssmAwsSdkCall: AwsSdkCall = {
            service: "SSM",
            action: "getParameter",
            parameters: { Name: parameterName },
            region,
            physicalResourceId: PhysicalResourceId.of(Date.now().toString()),
        }

        const ssmCrPolicy = AwsCustomResourcePolicy.fromSdkCalls({
            resources: [
                Arn.format(
                    { service: "ssm", region, resource: "parameter", resourceName: parameterName.replace(/^\//, "") },
                    Stack.of(scope),
                ),
            ],
        })

        super(scope, id, { onUpdate: ssmAwsSdkCall, policy: ssmCrPolicy })
    }

    public getParameterValue(): string {
        return this.getResponseField("Parameter.Value").toString()
    }
}

export function getEnvVar(name: string): string {
    const value = process.env[name]?.trim()
    if (!value) throw new Error(`${name} must be set and non-empty.`)
    return value
}
