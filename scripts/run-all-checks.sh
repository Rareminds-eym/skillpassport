#!/usr/bin/env bash

# This script runs all codebase checks and generates a report
# It is designed to be non-blocking but extremely noisy so the dev sees everything.

echo "================================================================="
echo "                  FULL CODEBASE HEALTH REPORT                    "
echo "================================================================="
echo ""

report=""

run_check() {
  local name=$1
  local command=$2
  
  echo "⏳ Running $name..."
  output=$(eval "$command" 2>&1)
  local status=$?
  
  if [ $status -eq 0 ]; then
    echo "✅ $name: PASSED"
    report="$report\n✅ $name: PASSED"
  else
    echo "❌ $name: FAILED"
    echo "-----------------------------------------------------------------"
    echo "$output"
    echo "-----------------------------------------------------------------"
    echo ""
    report="$report\n❌ $name: FAILED (See logs above)"
  fi
}

run_check "Secretlint (Secrets)" "npx secretlint '**/*'"
run_check "ESLint (Code Quality)" "npx eslint . --max-warnings=0"
run_check "Prettier (Formatting)" "npx prettier --check ."
run_check "CSpell (Spelling)" "npx cspell 'src/**/*.{ts,tsx,js,jsx}' --no-progress"
run_check "TypeScript (Type Checking)" "npx tsc --noEmit -p tsconfig.app.json"
run_check "Vitest (Unit Tests)" "npx vitest run --passWithNoTests"
run_check "Knip (Dead Code)" "npx knip --reporter compact"
run_check "Madge (Circular Dependencies)" "npx madge --circular --extensions ts,tsx,js,jsx src/"
run_check "Depcheck (Unused Packages)" "npx depcheck --config .depcheckrc.json"

echo "================================================================="
echo "                        REPORT SUMMARY                           "
echo "================================================================="
echo -e "$report"
echo "================================================================="
echo "Note: Checks are non-blocking so you can still commit/push."
echo "      Please fix any failed checks when possible."

exit 0
