#!/usr/bin/env node
import { execSync } from "node:child_process"
import * as path from "node:path"
import * as cdk from "aws-cdk-lib"
import { Certificate } from "../lib/certificate"
import { getAccountAndRegion, getEnvVar } from "../lib/helpers"
import { Strapi } from "../lib/strapi"

const strapiPath = path.resolve(__dirname, "../../strapi")
const certificateParameterName = "/strapi/certificate-arn"
const domainName = getEnvVar("DOMAIN_NAME")

const app = new cdk.App()

getAccountAndRegion().then((env) => {
    new Certificate(app, "StrapiCertificate", {
        env,
        route53ConfigParameterName: "/route53/config/fredferre-com",
        parameterName: certificateParameterName,
    })

    execSync(`cd ${strapiPath} && npm install && npm run build`, { stdio: "inherit" })
    new Strapi(app, "Strapi", { env, strapiPath, certificateParameterName, domainName })
})
