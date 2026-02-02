#!/bin/bash
echo "Repairing remaining migrations..."

npx supabase migration repair --status reverted 20260116073659
npx supabase migration repair --status reverted 20260116074040
npx supabase migration repair --status reverted 20260116081847
npx supabase migration repair --status reverted 20260116081930
npx supabase migration repair --status reverted 20260116082120
npx supabase migration repair --status reverted 20260116091420
npx supabase migration repair --status reverted 20260116105525
npx supabase migration repair --status reverted 20260116105544
npx supabase migration repair --status reverted 20260116105613
npx supabase migration repair --status reverted 20260116105704
npx supabase migration repair --status reverted 20260116105914
npx supabase migration repair --status reverted 20260116110140
npx supabase migration repair --status reverted 20260116113352
npx supabase migration repair --status reverted 20260116113548
npx supabase migration repair --status reverted 20260116115341
npx supabase migration repair --status reverted 20260116151713
npx supabase migration repair --status reverted 20260116175655
npx supabase migration repair --status reverted 20260118124925
npx supabase migration repair --status reverted 20260118203638
npx supabase migration repair --status reverted 20260119055135
npx supabase migration repair --status reverted 20260120072314
npx supabase migration repair --status reverted 20260120072448
npx supabase migration repair --status reverted 20260120072647
npx supabase migration repair --status reverted 20260122112437
npx supabase migration repair --status reverted 20260122112731
npx supabase migration repair --status reverted 20260123043607
npx supabase migration repair --status reverted 20260123043736
npx supabase migration repair --status reverted 20260123051403
npx supabase migration repair --status reverted 20260123051518
npx supabase migration repair --status reverted 20260123154816
npx supabase migration repair --status reverted 20260129041858
npx supabase migration repair --status reverted 20260129041935
npx supabase migration repair --status reverted 20260129042230
npx supabase migration repair --status reverted 20260129042439
npx supabase migration repair --status reverted 20260129042536
npx supabase migration repair --status reverted 20260129043713
npx supabase migration repair --status reverted 20260129043756
npx supabase migration repair --status reverted 20260129043950
npx supabase migration repair --status reverted 20260129044519
npx supabase migration repair --status reverted 20260129073020
npx supabase migration repair --status reverted 20260129073737
npx supabase migration repair --status reverted 20260129084941
npx supabase migration repair --status reverted 20260129094828
npx supabase migration repair --status reverted 20260129102417
npx supabase migration repair --status reverted 20260129104057

echo "Done! Now pulling fresh schema..."
npx supabase db pull
