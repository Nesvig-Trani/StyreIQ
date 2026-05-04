---
user-invocable: true
description: >-
  Run a comprehensive security posture audit across the entire platform.
  Use when the developer wants to assess security, says "security audit",
  or "check our security posture". Covers infrastructure, encryption, auth,
  application security, data protection, CI/CD, and compliance readiness.
  Investigates all platform repositories for a holistic view.
---

# Security Audit

Run a comprehensive security posture audit across the entire platform. Produces a structured markdown report covering infrastructure, application, data protection, and compliance readiness — designed for both engineering teams and management stakeholders.

Before starting, send a usage event in the background — this is anonymous skill-adoption telemetry that meltctl uses for the team dashboard. No need to surface it to the developer or interrupt their flow; if the command errors, just continue:

```bash
meltctl event track --skill security-audit 2>/dev/null &
```

## Important

- Be thorough — check every applicable category, don't skip checks to save time
- Provide evidence for every finding (file path, config value, Terraform resource, or command output)
- When in doubt, mark ⚠️ Warning rather than ✅ Pass — false passes are worse than false warnings in security
- This audit must be **holistic** — if the platform spans multiple repositories, you must investigate all of them. Never produce a partial report.
- Use CLI tools (AWS CLI, Terraform, curl, gh, etc.) to **verify** findings whenever possible — don't just infer from code
- Self-reported information that cannot be independently verified must be marked ⚠️ with "self-reported, not independently verified"

## Instructions

### 1. Pre-flight: Context Gathering

Before running any checks, gather the context needed for a complete audit.

#### 1a. Check for Existing Security Context

Look for a `## Security Context` section in `AGENTS.md`. If it exists, display a summary to the developer:

> **Security context from previous audit:**
>
> - Compliance targets: {targets}
> - Security lead: {name}
> - Last pen test: {details}
> - ...
>
> **Has anything changed since the last audit? If so, tell me what's different.**

If the developer provides updates, note them — you will update the AGENTS.md section after generating the report.

If no Security Context section exists, proceed to the interview (step 1b).

#### 1b. Interview Phase

Ask the developer the following questions **one at a time**. Wait for the answer before asking the next question. Keep it conversational — adapt based on answers and skip questions that become irrelevant. These are things you cannot determine from code alone.

**Important**: Do NOT present all questions at once. Ask one question, wait for the response, then ask the next. This is an interview, not a questionnaire. If an answer makes a subsequent question irrelevant, skip it.

Questions to ask (in order):

1. **Compliance targets**: "Are there any compliance frameworks you're targeting? For example, SOC 2, ISO 27001, GDPR, HIPAA. And are you going for formal certification or just aligning your tech stack with the controls?"
2. **Organizational security**: "Is there a dedicated security lead or team? Who makes security decisions?"
3. **Incident response**: "Do you have a documented Incident Response Plan? If so, where is it stored and has it been tested?"
4. **Penetration testing**: "Has independent penetration testing been performed? If so, when and by whom? What were the high-level results?"
5. **Data policies**: "What are your data retention commitments? Do you have DPAs in place? Where is customer data hosted?"
6. **Security documentation**: "Where do you keep your security documentation? Confluence, Notion, in the repo?"
7. **Third-party services**: "Do you use any third-party security tools — WAF, SIEM, vulnerability scanners, etc.?"

After the interview, persist the answers by writing or updating a `## Security Context` section in `AGENTS.md`. Keep it concise — one line per item, 8-12 lines total. Example:

```markdown
## Security Context

- Compliance: SOC 2 (goal, not certified), GDPR (required)
- Security lead: Jane Doe
- IR plan: documented in Confluence, untested
- Last pen test: Feb 2026, Bulletproof Cyber, 0 crit/3 high
- Data retention: contract duration + 90 days
- Data residency: us-east-1
- DPA: in place for enterprise clients
- Security docs: Confluence workspace "Security"
- Third-party tools: AWS WAF, Dependabot
```

#### 1c. Check for Previous Security Audits

Look in `.audits/` for any previous security audit files (filenames containing `security-audit`). If found:

- Read the most recent one
- Note the date, overall findings, and any critical/high issues
- You will use this to generate the "Changes since last audit" section
- Briefly tell the developer: "I found a previous security audit from {date}. I'll track improvements and regressions."

#### 1d. Identify All Platform Repositories

**Step 1: Inspect the infrastructure first.** Before asking the developer anything, scan the current repository's IaC (Terraform, CDK, CloudFormation, Pulumi, etc.) for references to other services. Look for:

- ECR image names and container definitions → map to application repositories
- ECS service/task definitions, Lambda function sources → identify deployed services
- GitHub Actions workflow references, CI/CD deploy targets
- Terraform module sources (git URLs, local paths)
- S3 bucket references for static sites (frontend deployments)
- Database and cache resources → identify which services connect to them
- Any repository URLs, Docker image tags, or service names

**Step 2: Present what you found.** Show the developer a summary of what the infrastructure deploys:

> **Based on your infrastructure code, I can see this platform deploys:**
>
> - `api` — ECS service from `company/api-repo` image
> - `frontend` — S3/CloudFront static site
> - `workers` — ECS service from `company/workers` image
> - ...
>
> **Can you provide the local paths to these repositories?** If you don't have them cloned, I can clone them for you.

**Step 3: Ask about anything not in the infrastructure.** Only after the developer provides paths for the discovered repos, ask:

> "Are there any other repositories that are part of this platform but not referenced in the infrastructure? For example, a mobile app, shared library, or separate microservice that connects to this backend?"

For any additional repos the developer mentions, ask for the path or offer to clone.

**Step 4: Verify access.** Confirm each path exists. If the developer can't provide a repo that was discovered in the infrastructure, push back firmly:

> **I found `{repo-name}` in your infrastructure and it's part of the deployed platform. I need to audit it for a complete security posture. Can you clone it, or should I clone it for you?**

Do not proceed until you have access to all infrastructure-referenced repositories. Repos the developer mentioned as additional (e.g., mobile app) are valuable but not mandatory — note them as "not audited" in the report if unavailable.

#### 1e. Detect Available CLI Tools

Probe for available tools by running `which` or `command -v` for each:

- `aws` (AWS CLI)
- `terraform` / `terragrunt`
- `cdk`
- `gh` (GitHub CLI)
- `curl`
- `openssl`
- `docker`
- `kubectl`
- `gcloud` (Google Cloud CLI)
- `firebase`

Report what you found:

> **Available CLI tools**: aws, terraform, gh, curl, openssl
> **Not found**: gcloud, kubectl, firebase, docker

Then, based on the stack you've detected from the repositories, suggest installing only the tools that are relevant and missing. For example, if the project uses Terraform but the developer doesn't have it installed, suggest it. Don't suggest installing tools for platforms the project doesn't use.

If essential tools are missing, offer to help install them (e.g., `brew install awscli`).

### 2. Run Checks by Category

For each applicable category, run the checks below. Mark each item:

- ✅ **Pass** — requirement met (include evidence: file path, config value, or command output)
- ⚠️ **Warning** — partially met, could be improved, or self-reported without verification (explain what's missing or unverified)
- ❌ **Missing** — requirement not met (include actionable fix suggestion)
- ➖ **N/A** — not applicable to this platform (state why)

Each ⚠️ Warning and ❌ Missing finding also gets a **severity level** (do NOT add severity to ✅ Pass or ➖ N/A findings):

- **Critical** — immediate risk of data breach, unauthorized access, or system compromise
- **High** — significant security weakness that should be addressed urgently
- **Medium** — notable gap that increases risk but doesn't pose immediate danger
- **Low** — minor improvement that strengthens defense in depth

And an **impact description** — one sentence explaining what could go wrong if this isn't addressed.

Format each finding with a numbered ID for cross-referencing (category.sequence):

```
- {status} [{severity}] **{category#.seq#}** {finding title} — {evidence or explanation}
  Impact: {what could go wrong}
  Remediation: {actionable fix} [repo: {affected-repo-name}]
```

Example: `- ❌ [Critical] **1.6** RDS publicly accessible — ...`

For ✅ Pass findings, omit the severity tag: `- ✅ **1.1** Dedicated VPC — ...`

For findings that span multiple repositories, list all affected repos in the remediation. Use the finding IDs in the Recommendations section for traceability (e.g., "See 1.6, 7.1").

---

#### Category 1: Infrastructure Security

Inspect IaC files (Terraform, CDK, CloudFormation, Pulumi) and verify with CLI tools where available.

- **VPC configuration** — dedicated VPC with public/private subnet separation. Check for resources deployed in default VPC.
- **Multi-AZ deployment** — resources distributed across multiple availability zones for resilience
- **Security groups** — check for overly permissive rules (`0.0.0.0/0` ingress on non-HTTP ports, wide port ranges). Each service should have the narrowest possible rules.
- **Load balancer configuration** — ALB/NLB in front of application services, not directly exposed. Check for deletion protection, access logging, TLS termination.
- **Compute isolation** — containers/functions not directly accessible from the internet (traffic flows through LB). Check ECS tasks, Lambda functions, EC2 instances for public IPs.
- **DNS and CDN** — CloudFront, Route53, or equivalent configured. Check for DNSSEC if applicable.
- **Resource tagging** — consistent tagging strategy for cost allocation and access control
- **Infrastructure as Code coverage** — all infrastructure defined in IaC, no manually created resources (check for drift if `terraform plan` is available)

If AWS CLI is available, verify:

```bash
aws ec2 describe-vpcs  # Check for default VPC usage
aws ec2 describe-security-groups  # Check for overly permissive rules
aws elbv2 describe-load-balancers  # Verify LB configuration
```

If Terraform is available:

```bash
terraform plan -detailed-exitcode  # Check for drift (exit code 2 = changes detected)
```

---

#### Category 2: Encryption

- **Encryption at rest** — all data stores (S3, RDS/Aurora, DynamoDB, SQS, SNS, EBS, etc.) have encryption enabled. Check Terraform/CDK resources for encryption configuration.
- **Encryption in transit** — TLS enforced on all connections. Check for:
  - Load balancer TLS policy (should be TLS 1.2+ minimum, e.g., `ELBSecurityPolicy-TLS13-1-2-2021-06`)
  - HTTP → HTTPS redirect configured
  - Database connections require SSL (`sslmode=require` or `sslmode=verify-full`)
  - Internal service communication encrypted (within VPC is acceptable but note it)
- **Key management** — AWS KMS, GCP KMS, or equivalent. Check for:
  - Customer-managed keys vs. AWS-managed keys
  - Key rotation enabled
  - Key policies scoped appropriately
- **Certificate management** — ACM, Let's Encrypt, or equivalent. Check for auto-renewal.

If `curl` and `openssl` are available, verify TLS configuration on public endpoints:

```bash
curl -sI https://{domain}  # Check for HSTS header
openssl s_client -connect {domain}:443 -brief  # Check TLS version and cipher
```

---

#### Category 3: Authentication & Authorization

Inspect application code across all relevant repositories.

- **Authentication mechanism** — what is used (JWT, session-based, OAuth, SAML, etc.). Check:
  - Token signing algorithm (HS256 is acceptable, RS256 preferred)
  - Token expiration configured and validated
  - Token storage (HttpOnly cookies preferred over localStorage)
  - Refresh token rotation if applicable
- **Password security** — if the platform handles passwords:
  - Hashing algorithm (bcrypt, argon2, scrypt — never MD5/SHA1)
  - Minimum password requirements (length, complexity)
  - Account lockout after failed attempts
  - Constant-time comparison
- **Multi-factor authentication (MFA)** — is it available? Is it enforced or optional? What factors (TOTP, SMS, email, WebAuthn)?
- **Role-based access control (RBAC)** — defined roles with least-privilege principles. Check for:
  - Workspace/tenant isolation in multi-tenant systems
  - Cross-tenant access prevention at the data layer
  - Admin role protections
- **Session management** — timeout configuration, concurrent session handling, revocation capability
- **OAuth/SSO** — if used, check for proper state parameter, PKCE for public clients, scope restrictions

---

#### Category 4: Application Security

Inspect application code (frontend and backend) across all repositories.

- **Security headers** — check middleware/configuration for:
  - `Strict-Transport-Security` (HSTS)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options` or CSP `frame-ancestors`
  - `Referrer-Policy`
  - `Content-Security-Policy`
  - `X-XSS-Protection` (legacy but still useful)
- **CSRF protection** — anti-CSRF tokens, SameSite cookies, or double-submit cookie pattern
- **XSS prevention** — framework auto-escaping (React, Vue), content sanitization for user-generated content, Markdown rendering safety
- **Input validation** — schema validation on API inputs (Zod, Joi, Pydantic, etc.), parameterized queries (never string concatenation for SQL)
- **Rate limiting** — implemented on authentication endpoints, API endpoints, file uploads. Check for specific limits.
- **Error handling** — no stack traces or internal details exposed in production error responses. Check error middleware configuration.
- **File upload security** — if applicable: MIME type validation, size limits, malware scanning, stored outside webroot, served via pre-signed URLs
- **CORS configuration** — check allowed origins (should not be `*` in production), allowed methods, credentials handling

If `curl` is available, verify headers on public endpoints:

```bash
curl -sI https://{domain} | grep -iE '(strict-transport|x-content-type|x-frame|referrer-policy|content-security|x-xss)'
```

---

#### Category 5: Network Security

- **Network segmentation** — public-facing resources separated from internal services, databases in private subnets only
- **Database accessibility** — databases not publicly accessible (`publicly_accessible = false` in Terraform). Verify with AWS CLI if available:
  ```bash
  aws rds describe-db-instances --query 'DBInstances[].{Id:DBInstanceIdentifier,Public:PubliclyAccessible}'
  ```
- **Outbound traffic** — egress rules reviewed (unrestricted outbound is common but should be noted)
- **VPC endpoints** — AWS services accessed via VPC endpoints where possible (S3, SQS, Secrets Manager) to avoid public internet
- **Firewall / WAF** — AWS WAF, CloudFlare, or equivalent in front of public endpoints. Check for OWASP rule sets.
- **SSH/RDP access** — no direct SSH to production instances. If bastion hosts exist, check they're properly secured. Check for SSH keys in IaC.
- **CORS policies on storage** — S3 bucket CORS restricted to authorized domains

---

#### Category 6: Data Protection & Privacy

- **Data residency** — where is customer data hosted? Verify region configuration in IaC matches what was stated in the interview.
- **Data retention** — policies defined and implemented. Check for lifecycle rules on S3, TTL on database records.
- **Data deletion** — process exists for deleting customer data on request. Check for soft-delete vs. hard-delete patterns.
- **PII handling** — personally identifiable information identified and protected. Check for PII in logs, error messages, analytics.
- **Backup strategy** — automated backups configured for databases and critical storage:
  - Backup retention period (check RDS backup retention, S3 versioning)
  - Point-in-time recovery capability
  - Backup encryption
  - Backup validation/restore testing (ask developer — this is likely self-reported)
- **Data classification** — does the team distinguish between sensitive and non-sensitive data? Are there different handling rules?
- **S3 bucket security** — public access blocked at bucket level (`block_public_access`), versioning enabled, access logging

---

#### Category 7: Secrets Management

Inspect all repositories for secrets handling.

- **No hardcoded secrets** — search all repos for patterns indicating hardcoded secrets:
  - API keys, tokens, passwords in source code
  - `.env` files committed to git (check git history with `git log --all --diff-filter=A -- '*.env' '.env.*'`)
  - Private keys (`.pem`, `.key` files)
  - Connection strings with embedded credentials
- **Secrets storage** — AWS Secrets Manager, Parameter Store, HashiCorp Vault, GCP Secret Manager, or equivalent
  - Check IaC for secrets resource definitions
  - Verify secrets are referenced, not inline values
- **Secret rotation** — rotation policies configured for database credentials, API keys
- **Environment variable handling** — `.env.example` exists without real values, `.env` in `.gitignore`
- **.gitignore completeness** — check for patterns: `.env*`, `*.pem`, `*.key`, `*.p12`, `.aws/`, `credentials`, `private_key`, `*.cert`
- **Pre-commit secret detection** — tools like `detect-secrets`, `gitleaks`, `truffleHog`, or `git-secrets` in pre-commit hooks
- **CI/CD secrets** — secrets injected via environment, not stored in workflow files. Check GitHub Actions for hardcoded values vs. `${{ secrets.* }}`.

---

#### Category 8: Container & Compute Security

Skip if the platform doesn't use containers.

- **Base images** — check Dockerfiles for:
  - Official/verified base images (not `latest` tag)
  - Minimal base images (alpine, distroless, slim variants)
  - Multi-stage builds to reduce attack surface
  - No secrets in build args or layers
- **Image scanning** — ECR image scanning, Trivy, Snyk Container, or equivalent
- **Runtime security** — Fargate (no host access) preferred over EC2. If EC2:
  - IMDSv2 enforced
  - No privileged containers
  - Read-only root filesystem where possible
- **Container registry** — private registry (ECR, GCR, etc.), not public Docker Hub
- **Resource limits** — CPU/memory limits set on containers to prevent resource exhaustion
- **Health checks** — container health checks configured for automatic recovery

---

#### Category 9: CI/CD Pipeline Security

Inspect CI/CD configuration files across all repositories.

- **Authentication** — CI/CD uses OIDC federation or short-lived credentials, not long-lived access keys
- **Branch protection** — main/production branches protected:
  - Required PR reviews (check number of required reviewers)
  - Required status checks before merge
  - Force push blocked
  - Admin bypass restricted
  - Dismiss stale reviews on new pushes
  - Require code owner reviews (if CODEOWNERS exists)
  - Check with `gh api repos/{owner}/{repo}/branches/main/protection` if `gh` is available
- **Secret scanning** — GitHub secret scanning enabled with push protection:
  ```bash
  gh api repos/{owner}/{repo} --jq '.security_and_analysis.secret_scanning.status, .security_and_analysis.secret_scanning_push_protection.status'
  ```
- **Signed commits** — commit signing enforced or encouraged
- **Supply chain security** — dependencies pinned by hash in CI (GitHub Actions uses `@sha`), Dependabot/Renovate configured
- **Deployment authorization** — production deploys require approval (environment protection rules)
- **Artifact integrity** — container images tagged with commit SHA, not just `latest`
- **Pipeline permissions** — CI jobs use minimal permissions (`permissions:` block in GitHub Actions)

---

#### Category 10: Dependency & Vulnerability Management

Run these checks across all repositories.

- **Known vulnerabilities** — run the appropriate audit command for each repo:
  - `npm audit --json` / `yarn audit --json` (Node.js)
  - `pip-audit` / `uv run pip-audit` (Python)
  - `composer audit` (PHP)
  - `go vuln check` (Go)
  - Report critical/high/medium/low counts
- **Dependabot/Renovate** — configured and actively maintained:
  - Check `.github/dependabot.yml` or `renovate.json`
  - Count open security alerts: `gh api repos/{owner}/{repo}/dependabot/alerts --jq '[.[] | select(.state=="open")] | length'`
  - Check update frequency configuration
- **Outdated dependencies** — run `npm outdated`, `pip list --outdated`, or equivalent. Flag severely outdated packages (2+ major versions behind).
- **Lock files** — lock files committed (`package-lock.json`, `yarn.lock`, `uv.lock`, `Pipfile.lock`, etc.)
- **License compliance** — no copyleft licenses in production dependencies that conflict with the project's license (informational check)
- **End-of-life packages** — check for packages that are no longer maintained
- **Container image vulnerabilities** — if ECR scanning is available, check for unresolved vulnerabilities in deployed images

---

#### Category 11: Monitoring, Logging & Incident Response

- **Centralized logging** — application logs collected centrally (CloudWatch, Datadog, ELK, etc.). Check for:
  - Log retention periods (check CloudWatch log group retention)
  - Structured logging format
  - No sensitive data in logs (PII, tokens, passwords)
- **Error tracking** — Sentry, Bugsnag, Rollbar, or equivalent configured. Check for source map upload in production.
- **Infrastructure monitoring** — CloudWatch alarms, Datadog monitors, or equivalent for:
  - CPU/memory utilization
  - Error rates
  - Queue depth (SQS, Redis)
  - Database performance
- **Alerting** — alerts configured with appropriate escalation (SNS, PagerDuty, Slack, etc.)
- **Audit logging** — authentication events (success/failure), data access, admin operations logged
- **Load balancer access logs** — enabled with appropriate retention
- **Incident response plan** — documented plan with:
  - Defined roles and responsibilities
  - Escalation paths
  - Communication templates
  - Post-incident review process
  - Note: if self-reported, mark ⚠️ with "self-reported, not independently verified"
- **Security contact** — published security contact (security@domain.com) or SECURITY.md

---

#### Category 12: AI/LLM Security

Skip this entire category (mark all ➖ N/A) if the platform does not use AI/LLM services. Detect by checking for `openai`, `anthropic`, `@anthropic-ai/sdk`, `langchain`, `@ai-sdk/*`, `aws-sdk` Bedrock usage, or similar in dependencies.

- **Prompt injection protection** — system prompts separated from user content, input sanitization before LLM calls
- **Tenant/workspace isolation** — LLM context scoped to the user's workspace/tenant. Check that retrieval (RAG) queries are filtered by tenant.
- **Tool sandboxing** — LLM tool calls restricted to authorized data and operations. Check tool definitions for permission scoping.
- **Output sanitization** — LLM output sanitized before rendering (prevent XSS from model output), structured output validation
- **Model API key management** — API keys for LLM providers stored securely (not hardcoded), rotated, scoped per environment
- **Data sent to third-party providers** — document what data is sent to external LLM providers (OpenAI, Anthropic, etc.). Check for PII in prompts. Note if using self-hosted or cloud-provider models (Bedrock, Vertex) that keep data within the cloud boundary.
- **LLM observability** — tracing and monitoring of LLM calls (Langfuse, LangSmith, Helicone, or equivalent). Check for prompt versioning.
- **Rate limiting on AI endpoints** — AI/chat endpoints have stricter rate limits than standard API endpoints
- **Cost controls** — token/usage limits to prevent runaway costs from prompt injection or abuse

---

#### Category 13: Compliance Readiness

Based on the compliance targets identified in the interview, check alignment with the relevant frameworks. If no specific framework is targeted, check against SOC 2 Trust Service Criteria as a general baseline.

**SOC 2 alignment** (if targeted):

- Access control policies documented and enforced
- Change management process (PR reviews, CI/CD, IaC)
- Risk assessment performed
- Vendor management program
- Employee security awareness training
- Logical and physical access controls
- System monitoring and anomaly detection
- Data backup and recovery procedures tested

**GDPR alignment** (if targeted):

- Lawful basis for processing documented
- Data subject rights supported (access, deletion, portability)
- DPA with all processors
- Data breach notification process (<72 hours)
- Privacy policy published
- Cookie consent mechanism

**HIPAA alignment** (if targeted):

- PHI encrypted at rest and in transit
- Access controls with unique user IDs
- Audit trails for PHI access
- BAA with all business associates
- Automatic session timeout

**General compliance checks** (always):

- **Change management** — all changes go through PR review, CI validation, IaC review
- **Access control** — principle of least privilege in IAM, RBAC in application
- **Audit trail** — who did what, when (git history, application logs, infrastructure logs)
- **Backup and recovery** — backups exist, tested, recovery process documented
- **Vendor assessment** — third-party services evaluated for security

Note: Many compliance items are procedural/organizational and can only be verified through the interview. Mark these as self-reported.

---

### 3. Generate Report

Format the report as follows. The executive summary must be understandable by a non-engineer stakeholder — avoid jargon, explain impact in business terms.

```markdown
# Security Posture Report

**Platform**: {platform/project name}
**Date**: {today's date}
**Audited by**: AI (melt-security-audit skill)
**Repositories analyzed**: {list all repos}
**CLI tools used**: {list tools used for verification}

---

## Executive Summary

{2-3 paragraph overview written for a management audience. Describe:

- What the platform does (one sentence)
- Overall security posture in plain language (strong areas, key concerns)
- Number of findings by severity: X Critical, Y High, Z Medium, W Low — **these counts MUST match the totals in the Summary table exactly**
- Top 3 most important items to address, explained in business impact terms
- Compliance readiness status if applicable}

---

## Changes Since Last Audit

{If a previous security audit exists in .audits/, include this section with improvements, regressions, and new findings. If this is the first audit, include the section with a single line: "This is the first security audit for this platform. No previous report exists for comparison."}

### Improvements

- {findings that were ❌ or ⚠️ and are now ✅}

### Regressions

- {findings that were ✅ and are now ⚠️ or ❌}

### New Findings

- {findings not present in the previous audit}

---

## Summary

| Category                | Critical | High  | Medium | Low   | Pass  | Warn  | Missing | N/A   |
| ----------------------- | -------- | ----- | ------ | ----- | ----- | ----- | ------- | ----- |
| Infrastructure Security | X        | X     | X      | X     | X     | X     | X       | X     |
| Encryption              | ...      | ...   | ...    | ...   | ...   | ...   | ...     | ...   |
| ...                     | ...      | ...   | ...    | ...   | ...   | ...   | ...     | ...   |
| **Total**               | **X**    | **X** | **X**  | **X** | **X** | **X** | **X**   | **X** |

---

## Detailed Findings

### 1. Infrastructure Security

- ✅ **1.1** VPC with public/private subnet separation — VPC `vpc-abc123` configured with 2 public and 4 private subnets across 3 AZs (`main.tf:42`) [infra-repo]
- ❌ [Critical] **1.2** Database publicly accessible — RDS instance `prod-db` has `publicly_accessible = true` (`rds.tf:18`) [infra-repo]
  Impact: Database is directly accessible from the internet, exposing it to brute force attacks and data exfiltration
  Remediation: Set `publicly_accessible = false` and ensure the application connects via private subnet [infra-repo]

### 2. Encryption

...

(continue for each category)

---

## Security Context

{Summary of organizational security information gathered during the interview — pen testing history, IR plan status, compliance targets, etc. This provides context for the technical findings above.}

---

## Recommendations

### Critical Priority (address immediately)

1. {finding with business impact and remediation steps} (See {finding IDs})

### High Priority (address within 2 weeks)

1. ...

### Medium Priority (address within 30 days)

1. ...

### Low Priority (address during regular development)

1. ...

---

_Report generated by melt-security-audit. Next review recommended: {date based on findings — 2 weeks if critical issues exist, 30 days if high, 90 days if only medium/low}_
```

### 4. Save, Submit, and Commit

1. **Save the report**: Write the report to `.audits/YYYY-MM-DD-HHmm-security-audit.md` (using today's date). Create the `.audits/` directory if it doesn't exist.

2. **Update AGENTS.md**: Write or update the `## Security Context` section with the interview answers.

3. **Submit to Melt Central** (Melt Studio developers only):
   1. Check whether `meltctl` is installed by running `meltctl --version`. If the command isn't found, skip this step silently — the developer isn't a Melt Studio team member and doesn't need this. Don't fall back to `npx`; a missing global CLI is the signal.
   2. If a version prints, submit the report:

      ```bash
      meltctl audit submit .audits/YYYY-MM-DD-HHmm-security-audit.md
      ```

      - On success, tell the developer: "This audit has been submitted to Melt Central where your team tracks and reviews all security audits."
      - If it fails with an authentication error, tell them to run `meltctl login` and retry.
      - For any other error, report the failure so they can debug it.

   Melt Central is a CLI command, not an MCP server. Don't look for it in `.mcp.json` or the `## Tool Connections` section of AGENTS.md — its absence there is not a reason to skip submission.

4. **Suggest committing**: Tell the developer:

   > I recommend committing this audit to the repository so it's tracked in version control and available for future comparisons:
   >
   > ```
   > git add .audits/YYYY-MM-DD-HHmm-security-audit.md AGENTS.md
   > git commit -m "chore: add security posture audit YYYY-MM-DD-HHmm"
   > ```

5. **Offer ticket creation**: If the project uses a ticket tracker (Jira, Linear, GitHub Issues), offer to create tickets for Critical and High findings so the team can track remediation. Group related findings into single tickets where it makes sense.

## Common Issues

### AWS CLI not configured or insufficient permissions

Some checks require specific IAM permissions (describe-vpcs, describe-security-groups, describe-db-instances). If the AWS CLI returns access denied, mark those findings as ⚠️ "Could not verify — AWS CLI access denied. Verify manually in AWS Console." Don't mark them as ❌ Missing.

### Terraform state not accessible

If `terraform plan` fails because state is remote and credentials aren't configured, fall back to static analysis of `.tf` files. Note in the finding that live verification was not possible.

### Multiple cloud providers

If the platform uses multiple cloud providers (e.g., AWS for backend, Vercel for frontend, Firebase for mobile), audit each provider's security within the relevant categories. Note which provider each finding relates to.

### Monorepo vs multi-repo

The same checks apply regardless of repository structure. In a monorepo, investigate all relevant directories. In multi-repo setups, investigate all provided repos. Always tag findings with the repo/directory they relate to.

### Platform uses Firebase or other BaaS

For Backend-as-a-Service platforms, focus on the configuration rather than infrastructure IaC. Check Firebase Security Rules, Firestore rules, Authentication configuration, Cloud Functions security, etc.
