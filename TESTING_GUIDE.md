# Lead Agent - Local Testing Guide

## Prerequisites Check

```bash
# Check Node.js version (needs 20+)
node --version

# Check if pnpm is installed
pnpm --version

# If pnpm is not installed, install it
npm install -g pnpm
```

---

## Step 1: Install Dependencies

```bash
# Navigate to the project directory
cd /home/user/lead-agent

# Install all dependencies
pnpm install
```

**Expected output**: Dependencies should install without errors (~2-3 minutes)

---

## Step 2: Get Required API Keys

### A. AI Gateway API Key (Option 1 - Recommended)

1. Go to: https://vercel.com/ai-gateway
2. Sign up/Login to Vercel
3. Create a new AI Gateway API key
4. Copy the key (starts with `ag_...`)

### B. OpenAI API Key (Option 2 - Alternative)

1. Go to: https://platform.openai.com/api-keys
2. Sign up/Login to OpenAI
3. Create a new API key
4. Copy the key (starts with `sk-...`)

### C. Exa API Key (Required)

1. Go to: https://exa.ai/
2. Sign up for an account
3. Navigate to Dashboard → API Keys
4. Create a new API key
5. Copy the key

### D. Slack Bot Setup (Optional - Skip for basic testing)

Only needed if you want to test the human-in-the-loop approval feature.

1. Go to: https://api.slack.com/apps
2. Click "Create New App" → "From a manifest"
3. Select your workspace
4. Copy the contents of `manifest.json` from this repo
5. Paste into the manifest editor
6. Create the app
7. Go to "OAuth & Permissions" → Install to workspace
8. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
9. Go to "Basic Information" → Copy the "Signing Secret"
10. Right-click on your Slack channel → View channel details → Copy the Channel ID

---

## Step 3: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit the file (use your preferred editor)
nano .env.local
```

Add your API keys:

```bash
# REQUIRED: Choose ONE of these options
AI_GATEWAY_API_KEY=ag_your_key_here
# OR
# OPENAI_API_KEY=sk-your_key_here

# REQUIRED: Exa API Key
EXA_API_KEY=your_exa_api_key_here

# OPTIONAL: Slack integration (skip for basic testing)
# SLACK_BOT_TOKEN=xoxb-your-slack-token
# SLACK_SIGNING_SECRET=your-slack-signing-secret
# SLACK_CHANNEL_ID=C123456789
```

**Save and exit** (Ctrl+O, Enter, Ctrl+X in nano)

---

## Step 4: Start the Development Server

```bash
pnpm dev
```

**Expected output**:
```
▲ Next.js 16.0.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 2.3s
○ Compiling / ...
✓ Compiled / in 1.5s
```

**If you see Slack warnings** (expected if Slack not configured):
```
⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set. Slack integration will be disabled.
```

**Leave this terminal running** and open a new terminal for testing.

---

## Step 5: Test Each Feature

### Test 1: Access the Application

**Action**:
```bash
# Open in your browser
http://localhost:3000
```

**Expected Result**:
- ✅ Lead capture form should be visible
- ✅ Form should have fields: Email, Name, Phone (optional), Company (optional), Message
- ✅ Form should be styled correctly with dark/light mode toggle

**Screenshot**: You should see a professional-looking contact form.

---

### Test 2: Form Validation

**Action**: Try submitting the form with invalid data

**Test Case 1**: Submit empty form
1. Click "Submit" without filling any fields
2. **Expected**: Red error messages appear under each required field

**Test Case 2**: Invalid email
1. Enter "notanemail" in email field
2. Enter "Test Name" in name field
3. Enter "Test message here" in message field
4. Click "Submit"
5. **Expected**: Error message "Please enter a valid email address"

**Test Case 3**: Message too short
1. Enter "test@example.com" in email
2. Enter "Test Name" in name
3. Enter "Hi" in message (too short)
4. Click "Submit"
5. **Expected**: Error message "Message must be at least 10 characters"

**Test Case 4**: Message too long
1. Enter a message with 501+ characters
2. **Expected**: Error message "Message must be at most 500 characters"

---

### Test 3: Bot Protection

**Action**: Submit the form as a legitimate user

1. Fill out the form with valid data:
   ```
   Email: test@example.com
   Name: John Doe
   Phone: +1-555-123-4567 (optional)
   Company: Acme Corp (optional)
   Message: I'm interested in learning more about your enterprise solution
   ```

2. Click "Submit"

**Expected Result**:
- ✅ BotID fingerprinting should run (invisible to user)
- ✅ Green success toast notification: "Form submitted successfully!"
- ✅ Form should reset (all fields cleared)

**In the terminal where you ran `pnpm dev`**, you should see:
```
POST /api/submit 200 in XXXms
```

**Note**: Bot protection is working if legitimate submissions succeed. Automated bots would get a 403 error.

---

### Test 4: Background Lead Processing

**What happens after form submission**:

The application starts processing the lead in the background. Watch your terminal for logs:

**Expected terminal output** (this will take 2-5 minutes):

```
POST /api/submit 200 in 45ms
🔍 Starting research for lead: test@example.com
🔍 Research agent analyzing...
[Research agent may call multiple tools:]
- Searching web for "Acme Corp"
- Fetching company website
- Checking CRM for existing contacts
✅ Research completed in 120000ms
📊 Qualifying lead...
✅ Lead qualified as: QUALIFIED
✉️ Generating email response...
✅ Email generated
```

**If Slack is NOT configured**, you'll see:
```
⚠️  SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET is not set, skipping human feedback step
```

**If Slack IS configured**, you'll see:
```
📤 Sending to Slack for approval...
✅ Slack message sent
```

**Check the processing**:

Open a new terminal and check server logs:
```bash
# Watch for any errors
tail -f .next/trace
```

---

### Test 5: AI-Powered Research Agent

**Monitor what the AI agent is doing**:

The research agent will autonomously:
1. Search the web for the company
2. Fetch relevant URLs
3. Check the knowledge base (currently placeholder)
4. Check CRM (currently placeholder)
5. Analyze tech stack (currently placeholder)
6. Synthesize findings into a report

**You can add more logging to see this in action**:

```bash
# In a new terminal, add debug logging
# Edit lib/services.ts to add console.logs in the research agent
```

**Or check the current logs** for research activity:
```bash
grep "Research" .next/trace
```

---

### Test 6: Lead Qualification

After research completes, the lead is automatically qualified.

**Check qualification logic**:

The AI will categorize the lead as one of:
- **QUALIFIED**: High-value lead ready for sales
- **UNQUALIFIED**: Not a good fit
- **SUPPORT**: Technical support request
- **FOLLOW_UP**: Needs more nurturing

**View qualification in logs**:
```bash
# Should see something like:
✅ Lead qualified as: QUALIFIED
Reason: Acme Corp is a fast-growing SaaS company...
```

---

### Test 7: Email Generation

If the lead is **QUALIFIED** or **FOLLOW_UP**, an email is automatically generated.

**Check email generation**:

In the terminal logs, you should see:
```
✉️ Generating personalized email...
✅ Email generated:
---
Hi John,

Thank you for your interest...

Best regards,
[Your Name]
---
```

**Email is customized based on**:
- Lead's name and company
- Their specific message/inquiry
- Research findings
- Qualification category

---

### Test 8: Slack Human-in-the-Loop (If Configured)

**Only if you set up Slack in Step 2D**

**Action**: Check your Slack channel

**Expected in Slack**:
1. A new message from your Lead Agent bot
2. Message contains:
   - Lead email
   - Qualification category and reason
   - Generated email content
   - Two buttons: "👍 Approve" and "👎 Reject"

**Test Approval**:
1. Click "👍 Approve" button
2. In terminal, you should see:
   ```
   ✅ Lead approved: test@example.com
   📧 Sending email to test@example.com
   ```

**Test Rejection**:
1. Submit another test lead
2. Wait for Slack message
3. Click "👎 Reject" button
4. In terminal, you should see:
   ```
   ❌ Lead rejected: test@example.com
   ```

**Note**: Currently, `sendEmail()` is a placeholder function that just logs. In production, you'd integrate an email service provider.

---

### Test 9: Different Lead Types

Test different qualification categories by varying your submissions:

**Test Case A: Support Request**
```
Email: support@customer.com
Name: Jane Support
Message: I'm having trouble logging into my account. Can you help?
```

**Expected**: Qualified as **SUPPORT**, different email tone

**Test Case B: Unqualified Lead**
```
Email: student@school.edu
Name: Student User
Message: I need this for a school project, can you give it to me for free?
```

**Expected**: Qualified as **UNQUALIFIED**, polite but firm response

**Test Case C: Follow-Up Lead**
```
Email: info@startup.com
Name: Startup Founder
Message: Interested but want to learn more about pricing first
```

**Expected**: Qualified as **FOLLOW_UP**, nurturing email with resources

---

## Step 6: Advanced Testing

### Test Multiple Submissions

Submit 3-5 leads in quick succession:

```bash
# Each should be processed independently
# Check that all are handled without crashes
```

**Monitor server load**:
```bash
# In a new terminal
top
# or
htop
```

---

### Test Error Handling

**Test Case 1: Invalid API Key**
1. Change `EXA_API_KEY` in `.env.local` to `invalid_key`
2. Restart the server (`Ctrl+C`, then `pnpm dev`)
3. Submit a lead
4. **Expected**: Error in terminal, graceful error handling

**Test Case 2: Network Issues**
1. Disconnect from internet
2. Submit a lead
3. **Expected**: Proper error logging, no crashes

**Test Case 3: Malformed Input**
1. Try to send a POST request with malformed JSON:
   ```bash
   curl -X POST http://localhost:3000/api/submit \
     -H "Content-Type: application/json" \
     -d '{"invalid": json}'
   ```
2. **Expected**: 400 Bad Request error

---

## Step 7: Component Testing

### Test Dark Mode

1. Open http://localhost:3000
2. Look for theme toggle (usually top-right)
3. Click to switch between light/dark mode
4. **Expected**: Smooth transition, all text remains readable

### Test Responsive Design

1. Open browser DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on different screen sizes:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1920px)
4. **Expected**: Form should look good on all sizes

### Test Form UX

1. Tab through all form fields
2. **Expected**: Proper focus indicators
3. Type in fields
4. **Expected**: No lag, smooth typing
5. Clear a field that had an error
6. **Expected**: Error message disappears

---

## Step 8: API Endpoint Testing

### Test Submit Endpoint Directly

```bash
# Test with valid data
curl -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "API Test",
    "message": "Testing the API directly"
  }'
```

**Expected response**:
```json
{"message":"Form submitted successfully"}
```

### Test Slack Endpoint (If Configured)

```bash
# This will fail without proper Slack signature, which is expected
curl -X POST http://localhost:3000/api/slack \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected**: Error about missing/invalid Slack signature (this is correct security behavior)

---

## Common Issues and Solutions

### Issue 1: "Cannot find module" errors

**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Issue 2: "Port 3000 is already in use"

**Solution**:
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm dev
```

### Issue 3: BotID errors

**Solution**:
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

### Issue 4: AI API errors

**Solution**:
- Verify your API key is correct in `.env.local`
- Check your API key has sufficient quota/credits
- Ensure no leading/trailing spaces in the API key

### Issue 5: Slack messages not appearing

**Solution**:
1. Verify bot is added to the channel: `/invite @YourBotName`
2. Check bot has `chat:write` permission in manifest
3. Verify channel ID is correct (not channel name)
4. Check Slack app is installed to workspace

### Issue 6: Research agent takes too long

**Solution**:
- This is expected (2-5 minutes)
- Agent makes multiple API calls
- Check terminal for progress
- Can reduce `stepCountIs(20)` to `stepCountIs(10)` in `lib/services.ts` for faster testing

---

## Performance Benchmarks

**Expected timings**:
- Form submission response: < 100ms
- Bot detection: < 50ms
- Research phase: 30-300 seconds (varies based on agent)
- Qualification: 5-15 seconds
- Email generation: 5-15 seconds
- Slack message send: < 1 second

**Total end-to-end**: ~1-5 minutes per lead

---

## What's Working vs. Placeholder

### ✅ Fully Working Features:

1. **Lead Capture Form**
   - Client-side validation
   - Bot protection
   - Responsive design
   - Dark mode

2. **Bot Protection**
   - BotID fingerprinting
   - Server-side verification

3. **Background Processing**
   - Async lead processing
   - Error handling
   - No blocking on HTTP response

4. **AI Research Agent**
   - Autonomous tool usage
   - Web search via Exa.ai
   - URL content extraction
   - Multi-step reasoning

5. **Lead Qualification**
   - AI-powered categorization
   - Structured output with reasoning
   - Four categories (QUALIFIED, UNQUALIFIED, SUPPORT, FOLLOW_UP)

6. **Email Generation**
   - Context-aware emails
   - Personalized based on research
   - Tone varies by category

7. **Slack Integration** (if configured)
   - Message sending
   - Button interactions
   - Event handling

### 🚧 Placeholder Features (Need Implementation):

1. **Email Sending**
   - Currently just logs
   - Needs integration with Resend, SendGrid, or similar

2. **CRM Search Tool**
   - Returns empty array
   - Needs Salesforce, HubSpot, or similar integration

3. **Knowledge Base Query**
   - Returns placeholder text
   - Needs Turbopuffer, Pinecone, or similar integration

4. **Tech Stack Analysis**
   - Returns empty array
   - Needs BuiltWith API or custom solution

5. **Email Content Storage**
   - Email content not persisted
   - Needs database integration for approval workflow

---

## Next Steps After Testing

Once you've verified everything works:

1. **Deploy to Production**
   - Can deploy to any Node.js platform
   - See README.md deployment section

2. **Integrate Email Provider**
   - Implement `sendEmail()` in `lib/services.ts`
   - Recommended: Resend, SendGrid, or AWS SES

3. **Add Database**
   - Store leads, emails, qualification results
   - Recommended: PostgreSQL, MongoDB, or Supabase

4. **Integrate CRM**
   - Implement `crmSearch` tool
   - Connect to Salesforce, HubSpot, etc.

5. **Setup Knowledge Base**
   - Implement `queryKnowledgeBase` tool
   - Use vector database like Turbopuffer or Pinecone

6. **Configure Monitoring**
   - Add Sentry for error tracking
   - Add analytics for form submissions
   - Setup uptime monitoring

7. **Customize for Your Business**
   - Update qualification categories
   - Customize email templates
   - Adjust AI prompts
   - Add company branding

---

## Testing Checklist

Use this checklist to ensure you've tested everything:

- [ ] Dependencies installed without errors
- [ ] Development server starts successfully
- [ ] Application loads at http://localhost:3000
- [ ] Form validation works for all fields
- [ ] Bot protection doesn't block legitimate users
- [ ] Form submits successfully and shows toast
- [ ] Background processing starts (check terminal logs)
- [ ] Research agent completes without errors
- [ ] Lead is qualified into a category
- [ ] Email is generated for QUALIFIED/FOLLOW_UP leads
- [ ] Slack message sent (if configured)
- [ ] Slack buttons work (if configured)
- [ ] Dark mode toggles correctly
- [ ] Responsive design works on mobile
- [ ] Multiple submissions handled correctly
- [ ] Error handling works for invalid inputs
- [ ] API endpoints return expected responses

---

## Support and Troubleshooting

If you encounter issues not covered here:

1. Check terminal logs for error messages
2. Check browser console (F12) for client-side errors
3. Verify all environment variables are set correctly
4. Ensure API keys are valid and have quota
5. Try clearing `.next` cache and restarting
6. Check the DOCUMENTATION.md for more detailed information

**Common log locations**:
- Server logs: Terminal where you ran `pnpm dev`
- Next.js logs: `.next/trace`
- Browser logs: DevTools Console (F12)

---

## Conclusion

You should now have a fully functional local development environment with:

✅ Lead capture form with validation and bot protection
✅ Async background processing
✅ AI-powered research agent with web search
✅ Intelligent lead qualification
✅ Automated email generation
✅ Optional Slack approval workflow

The application is ready for customization and deployment!
