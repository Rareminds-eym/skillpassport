#!/usr/bin/env bash

# Enhanced Unified Codebase Health Report Generator
REPORT_DIR="REPORTS"
REPORT_FILE="$REPORT_DIR/health-report.md"
mkdir -p "$REPORT_DIR"

echo "# Codebase Health Report - $(date)" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "## Summary Table" >> "$REPORT_FILE"
echo "| Check | Status | Issues Found |" >> "$REPORT_FILE"
echo "| :--- | :--- | :--- |" >> "$REPORT_FILE"

TEMP_LOGS_DIR="$REPORT_DIR/logs"
mkdir -p "$TEMP_LOGS_DIR"

run_check() {
  local name=$1
  local id=$2
  local command=$3
  local count_regex=$4
  
  echo "⏳ Running $name..."
  local log_file="$TEMP_LOGS_DIR/$id.log"
  eval "$command" > "$log_file" 2>&1
  local status=$?
  
  local issues=0
  if [[ -n "$count_regex" ]]; then
    # Custom counting logic based on provided regex or tool-specific patterns
    if [[ "$id" == "tsc" ]]; then
       issues=$(grep -c "error TS" "$log_file")
    elif [[ "$id" == "eslint" ]]; then
       issues=$(grep -oE "[0-9]+ problems" "$log_file" | awk '{print $1}')
       [[ -z "$issues" ]] && issues=0
    elif [[ "$id" == "cspell" ]]; then
       issues=$(grep -oE "Issues found: [0-9]+" "$log_file" | awk '{print $3}')
       [[ -z "$issues" ]] && issues=0
    elif [[ "$id" == "prettier" ]]; then
       issues=$(grep -c "\[warn\]" "$log_file")
    elif [[ "$id" == "secretlint" ]]; then
       issues=$(grep -c " error " "$log_file")
    elif [[ "$id" == "madge" ]]; then
       issues=$(grep -oE "Found [0-9]+ circular" "$log_file" | awk '{print $2}')
       [[ -z "$issues" ]] && issues=0
    elif [[ "$id" == "knip" ]]; then
       issues=$(grep -c ":" "$log_file") # Compact reporter puts each issue on a line
    else
       issues=$(grep -cE "$count_regex" "$log_file")
    fi
  fi

  local status_str="✅ PASSED"
  [[ $status -ne 0 || $issues -gt 0 ]] && status_str="❌ FAILED"
  [[ $issues -eq 0 && $status -eq 0 ]] && status_str="✅ PASSED"

  echo "| $name | $status_str | $issues |" >> "$REPORT_FILE"
  
  echo "## Details: $name" >> "$REPORT_FILE"
  echo "\`\`\`" >> "$REPORT_FILE"
  cat "$log_file" >> "$REPORT_FILE"
  echo "\`\`\`" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  echo "  $status_str ($issues issues)"
}

run_check "Secretlint" "secretlint" "npx secretlint '**/*'" "error"
run_check "ESLint" "eslint" "npx eslint . --max-warnings=0" "problems"
run_check "Prettier" "prettier" "npx prettier --check ." "warn"
run_check "CSpell" "cspell" "npx cspell 'src/**/*.{ts,tsx,js,jsx}' --no-progress" "Issues"
run_check "TypeScript" "tsc" "npx tsc --noEmit -p tsconfig.app.json" "error TS"
run_check "Vitest" "vitest" "npx vitest run --passWithNoTests" "failed"
run_check "Knip" "knip" "npx knip --reporter compact" ":"
run_check "Madge" "madge" "npx madge --circular --extensions ts,tsx,js,jsx src/" "circular"
run_check "Depcheck" "depcheck" "npx depcheck --config .depcheckrc.json" "Unused"

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "Report generated at: $(date)" >> "$REPORT_FILE"

echo "================================================================="
echo "Report generated: $REPORT_FILE"
echo "================================================================="

exit 0
