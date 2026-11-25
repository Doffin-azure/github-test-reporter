# Integrations

GitHub Test Reporter supports various integrations to enhance your test reporting workflow. These integrations allow you to seamlessly combine the GitHub Test Reporter with popular developer tools.

You can use multiple integrations in the same workflow.

## Data processing

The action reads and processes CTRF and JUnit reports on the GitHub Actions
runner that executes the step, including self-hosted runners. JUnit conversion
also runs on the runner.

GitHub receives the output you publish, such as job summaries, pull request and
issue comments, check runs, annotations in workflow logs, and report artifacts.
Reports that use historical results can download artifacts from GitHub through
its API.

External integrations send data to the services you configure. Slack and
Microsoft Teams receive the rendered notification. AI features send report
content, such as failed test names and error details, to the configured AI
provider for processing. This applies to AI configured through `ai` or
`integrations-config`, including when an AI summary is generated for the report.

Integrations are currently in beta. Please report any issues to the [GitHub Test Reporter repository](https://github.com/ctrf-io/github-test-reporter/issues).

| Integration | Description | Repository |
|------------|-------------|------------|
| Slack Test Reporter | Send test results and notifications to Slack channels | [ctrf-io/slack-test-reporter](https://github.com/ctrf-io/slack-test-reporter) |
| Microsoft Teams Test Reporter | Post test results and alerts to Teams channels | [ctrf-io/teams-test-reporter](https://github.com/ctrf-io/teams-test-reporter) |
| AI Test Reporter | Intelligent test analysis using leading AI models | [ctrf-io/ai-test-reporter](https://github.com/ctrf-io/ai-test-reporter) |
| JUnit to CTRF | Convert JUnit test results to CTRF format | [ctrf-io/junit-to-ctrf](https://github.com/ctrf-io/junit-to-ctrf) |

To suggest a new integration, please open a discussion on the [CTRF Discussions](https://github.com/ctrf-io/ctrf/discussions).

## Configuration

Integrations are configured using the `integrations-config` input in your GitHub Actions workflow. The configuration is passed as a JSON string:

```yaml
- name: Publish Test Report
  uses: ctrf-io/github-test-reporter@v1
  with:
    report-path: './ctrf/*.json'
    integrations-config: |
      {
        "slack": {
          "enabled": true,
          "action": "results"
        },
        "teams": {
          "enabled": true,
          "action": "results"
        },
        "ai": {
          "enabled": true,
          "action": "openai"
        }
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  if: always()
```

## Available Integrations

### Slack Integration

The Slack integration allows you to send test results directly to your Slack channels.

The Slack integration is powered by the [Slack Test Reporter](https://github.com/ctrf-io/slack-test-reporter), see the latest documentation for more information.

Actions available:

- `results`
- `failed`
- `flaky`
- `ai`
- `custom-markdown`
- `custom-block-kit`

Set the `SLACK_WEBHOOK_URL` environment variable or provide
`options.webhookUrl`. For bot authentication, set both `options.oauthToken`
and `options.channelId`.

```yaml
- name: Publish Test Report
  uses: ctrf-io/github-test-reporter@v1
  with:
    report-path: './ctrf/*.json'
    integrations-config: |
      {
        "slack": {
          "enabled": true,
          "action": "results",
          "options": {
            "title": "Test Results",
            "prefix": "Custom prefix",
            "suffix": "Custom suffix",
            "consolidated": false,
            "onFailOnly": false
          }
        }
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
  if: always()
```

For a custom Slack message, set `options.templatePath` to a Handlebars
template file in the checked-out workspace. The template can access report data
through `ctrf`, for example `{{ctrf.summary.tests}}`.

```json
{
  "slack": {
    "enabled": true,
    "action": "custom-markdown",
    "options": {
      "templatePath": ".github/templates/slack-report.hbs"
    }
  }
}
```

Use Slack-flavored Markdown with `custom-markdown`. With `custom-block-kit`,
the rendered template must be a JSON object with a `blocks` array.

See the [Slack Test Reporter](https://github.com/ctrf-io/slack-test-reporter) for more information.

### Microsoft Teams Integration

The Microsoft Teams integration allows you to send test results directly to your Microsoft Teams channels.

The Microsoft Teams integration is powered by the [Microsoft Teams Test Reporter](https://github.com/ctrf-io/teams-test-reporter), see the documentation for more information.

Actions available:

- `results`
- `failed`
- `flaky`
- `ai`

Requires the `TEAMS_WEBHOOK_URL` environment variable to be set.

```yaml
- name: Publish Test Report
  uses: ctrf-io/github-test-reporter@v1
  with:
    report-path: './ctrf/*.json'
    integrations-config: |
      {
        "teams": {
          "enabled": true,
          "action": "results",
          "options": {
            "title": "Test Results",
            "onFailOnly": false
          }
        }
      }
  env:
    TEAMS_WEBHOOK_URL: ${{ secrets.TEAMS_WEBHOOK_URL }}
  if: always()
```

See the [Microsoft Teams Test Reporter](https://github.com/ctrf-io/teams-test-reporter) for more information.

### AI Integration

The AI integration provides intelligent analysis of your test results using advanced AI models.

The AI integration is powered by the [AI Test Reporter](https://github.com/ctrf-io/ai-test-reporter), see the latestdocumentation for more information.

Actions available:

- `openai`
- `claude`
- `azure-openai`
- `grok`
- `deepseek`
- `mistral`
- `gemini`
- `perplexity`
- `openrouter`

Requires the environment variable to be set for the AI provider you are using.

```yaml
- name: Publish Test Report
  uses: ctrf-io/github-test-reporter@v1
  with:
    report-path: './ctrf/*.json'
    integrations-config: |
      {
        "ai": {
          "enabled": true,
          "action": "openai",
          "options": {
            "model": "gpt-4",
            "systemPrompt": "Custom system prompt",
            "frequencyPenalty": 0,
            "maxTokens": 1000,
            "presencePenalty": 0,
            "temperature": 0.7,
            "topP": 1,
            "log": false,
            "maxMessages": 10,
            "consolidate": false,
            "deploymentId": "your-azure-deployment-id"
          }
        }
      }
  env:
    OPENAI_TOKEN: ${{ secrets.OPENAI_TOKEN }}
  if: always()
```

### JUnit to CTRF Integration

The JUnit to CTRF integration allows you to convert JUnit test results to CTRF format.

The JUnit to CTRF integration is powered by the [JUnit to CTRF](https://github.com/ctrf-io/junit-to-ctrf), see the latest documentation for more information.

Actions available:

- `convert`

```yaml
- name: Publish Test Report
  uses: ctrf-io/github-test-reporter@v1
  with:
    report-path: './target/surefire-reports/*.xml'
    integrations-config: |
      {
        "junit-to-ctrf": {
          "enabled": true,
          "action": "convert",
          "options": {
            "output": "./ctrf-reports/ctrf-report.json",
            "toolname": "junit-to-ctrf",
            "useSuiteName": false,
            "env": {
              "appName": "my-app"
            }
          }
        }
      }
  if: always()
```

See the [JUnit to CTRF](https://github.com/ctrf-io/junit-to-ctrf) for more information.
