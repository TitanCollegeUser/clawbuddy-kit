#!/bin/bash
# ClawBuddy Update Script
# Run this when a new version is released to pull changes,
# apply database migrations, and redeploy edge functions.
#
# Prerequisites:
#   - Supabase CLI installed (npm install -g supabase)
#   - Project linked (supabase link --project-ref YOUR_REF)
#   - Git upstream set (git remote add upstream https://github.com/mkanasani/clawbuddy-kit.git)

set -e

echo "========================================="
echo "  ClawBuddy Updater"
echo "========================================="
echo ""

# Step 1: Pull latest from upstream
echo "[1/3] Pulling latest changes from upstream..."
git fetch upstream
git merge upstream/main --no-edit
echo "  Done."
echo ""

# Step 2: Run database migrations
echo "[2/3] Applying database migrations..."
supabase db push
echo "  Done."
echo ""

# Step 3: Redeploy edge functions
echo "[3/3] Deploying edge functions..."

FUNCTIONS=(
  ai-tasks
  automation-runner
  sherlock-brain
  morning-digest
  evening-report
  midday-prep
  competitor-intel
  intelligence-sync
  browser-research
  calendar-sync
  goal-analyzer
  report-webhook
  list-offices
  manage-office-agent
  create-office-task
  office-agent-status
  reset-office
  upload-office-deliverable
  activate-license
  millis-proxy
  lexa-webhook
  lexa-precall
  lexa-campaign-runner
  make-proxy
  forge-analyzer
)

for fn in "${FUNCTIONS[@]}"; do
  echo "  Deploying $fn..."
  supabase functions deploy "$fn" --no-verify-jwt
done
echo "  Done."
echo ""

echo "========================================="
echo "  Update complete!"
echo "========================================="
echo ""
echo "Your frontend will auto-deploy if connected to Netlify."
echo "If not, run: npm run build"
