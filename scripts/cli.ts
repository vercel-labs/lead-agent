#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import { formSchema, type FormSchema } from '../lib/types';
import { qualify, researchAgent, writeEmail } from '../lib/services';

/**
 * Collect lead information via interactive prompts
 */
async function collectLeadInfo(): Promise<FormSchema> {
  console.log(chalk.blue.bold('\n🚀 Lead Agent CLI\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Lead name:',
      validate: (input) =>
        input.length >= 2 || 'Name must be at least 2 characters'
    },
    {
      type: 'input',
      name: 'email',
      message: 'Lead email:',
      validate: (input) =>
        /\S+@\S+\.\S+/.test(input) || 'Please enter a valid email'
    },
    {
      type: 'input',
      name: 'phone',
      message: 'Phone (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'company',
      message: 'Company (optional):',
      default: ''
    },
    {
      type: 'input',
      name: 'message',
      message: 'Message:',
      validate: (input) =>
        input.length >= 10 || 'Message must be at least 10 characters'
    }
  ]);

  return formSchema.parse(answers);
}

/**
 * Run the workflow directly and display outputs
 */
async function runWorkflow(lead: FormSchema) {
  console.log(chalk.yellow('\n⏳ Starting workflow...\n'));

  try {
    // Step 1: Research
    console.log(chalk.blue.bold('🔍 Step 1: Researching lead...\n'));
    const { text: research } = await researchAgent.generate({
      prompt: `Research the lead: ${JSON.stringify(lead)}`
    });

    console.log(
      boxen(research.slice(0, 1000) + (research.length > 1000 ? '\n\n...(truncated)' : ''), {
        padding: 1,
        borderColor: 'yellow',
        title: '🔍 Research Results',
        titleAlignment: 'center'
      })
    );
    console.log('\n');

    // Step 2: Qualify
    console.log(chalk.blue.bold('📊 Step 2: Qualifying lead...\n'));
    const qualification = await qualify(lead, research);

    console.log(
      boxen(
        chalk.cyan('Category: ') + qualification.category + '\n' +
        chalk.cyan('Reason: ') + qualification.reason,
        {
          padding: 1,
          borderColor: 'cyan',
          title: '📊 Qualification Results',
          titleAlignment: 'center'
        }
      )
    );
    console.log('\n');

    // Step 3: Write Email (only if qualified or follow-up)
    if (
      qualification.category === 'QUALIFIED' ||
      qualification.category === 'FOLLOW_UP'
    ) {
      console.log(chalk.blue.bold('📧 Step 3: Generating email...\n'));
      const email = await writeEmail(research, qualification);

      console.log(
        boxen(email, {
          padding: 1,
          borderColor: 'green',
          title: '📧 Generated Email',
          titleAlignment: 'center'
        })
      );
      console.log('\n');

      // Step 4: Human Approval
      console.log(chalk.blue.bold('='  .repeat(80)) + '\n');
      console.log(chalk.yellow.bold('👤 Step 4: Human Approval\n'));

      const { approved, feedback } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'approved',
          message: chalk.bold('Approve this email?'),
          default: false
        },
        {
          type: 'input',
          name: 'feedback',
          message: 'Feedback (optional):',
          default: '',
          when: (answers) => !answers.approved
        }
      ]);

      console.log('\n' + chalk.blue.bold('='  .repeat(80)) + '\n');

      if (approved) {
        console.log(chalk.green.bold('✅ Email approved!\n'));
        console.log(chalk.gray('In production, this would trigger email sending.'));
        console.log(chalk.gray(`Lead: ${lead.email}`));
        console.log(chalk.gray(`Category: ${qualification.category}\n`));
      } else {
        console.log(chalk.red.bold('❌ Email rejected.\n'));
        if (feedback) {
          console.log(chalk.gray(`Feedback: ${feedback}\n`));
        }
      }
    } else {
      console.log(
        chalk.yellow.bold(
          `\n⚠️  Lead categorized as ${qualification.category} - no email generated.\n`
        )
      );
    }
  } catch (error) {
    console.error(chalk.red('\n❌ Workflow error:'), error);
    throw error;
  }
}

/**
 * Main CLI function
 */
async function main() {
  try {
    // Collect lead information
    const lead = await collectLeadInfo();

    // Confirm submission
    console.log(
      '\n' +
        boxen(
          chalk.bold('Lead Information\n\n') +
            `${chalk.cyan('Name:')} ${lead.name}\n` +
            `${chalk.cyan('Email:')} ${lead.email}\n` +
            (lead.phone ? `${chalk.cyan('Phone:')} ${lead.phone}\n` : '') +
            (lead.company ? `${chalk.cyan('Company:')} ${lead.company}\n` : '') +
            `${chalk.cyan('Message:')} ${lead.message}`,
          { padding: 1, borderColor: 'white' }
        )
    );

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Start workflow for this lead?',
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow('\n❌ Cancelled\n'));
      return;
    }

    // Run workflow
    await runWorkflow(lead);

    console.log(chalk.green.bold('✨ Workflow complete!\n'));
  } catch (error) {
    console.error(chalk.red('\n❌ Error:'), error);
    process.exit(1);
  }
}

main();
