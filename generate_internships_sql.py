import pandas as pd
import json

# Read the Excel file
df = pd.read_excel('school_student_learning_internships.xlsx')

# Recruiter ID
recruiter_id = '902d03ef-71c0-4781-8e09-c2ef46511cbb'

# Open output file
with open('import-all-internships.sql', 'w', encoding='utf-8') as f:
    f.write('-- Import All 50 Learning Internships\n')
    f.write(f'-- Recruiter ID: {recruiter_id}\n\n')
    
    for idx, row in df.iterrows():
        # Extract values
        intern_id = row['ID']
        title = row['Title'].replace("'", "''")
        sector = row['Sector'].replace("'", "''") if pd.notna(row['Sector']) else 'General'
        exposure_type = row['Exposure Type'].replace("'", "''") if pd.notna(row['Exposure Type']) else 'General'
        total_hours = row['Total Hours'] if pd.notna(row['Total Hours']) else 'NULL'
        
        # Parse duration
        duration_str = str(row['Duration (Weeks/Days)']) if pd.notna(row['Duration (Weeks/Days)']) else ''
        duration_weeks = 'NULL'
        duration_days = 'NULL'
        if 'week' in duration_str.lower():
            try:
                # Extract first number, handle ranges like "1-2" or "1–2"
                num_str = duration_str.split()[0].replace('–', '-').replace('—', '-')
                if '-' in num_str:
                    # Take the first number from range
                    duration_weeks = num_str.split('-')[0]
                else:
                    duration_weeks = num_str
                # Validate it's a number
                float(duration_weeks)
            except:
                duration_weeks = 'NULL'
        elif 'day' in duration_str.lower():
            try:
                # Extract first number, handle ranges
                num_str = duration_str.split()[0].replace('–', '-').replace('—', '-')
                if '-' in num_str:
                    duration_days = num_str.split('-')[0]
                else:
                    duration_days = num_str
                # Validate it's a number
                float(duration_days)
            except:
                duration_days = 'NULL'
        
        schedule_note = row['Schedule Note'].replace("'", "''") if pd.notna(row['Schedule Note']) else ''
        what_learn = row["What you'll learn"].replace("'", "''") if pd.notna(row["What you'll learn"]) else ''
        what_do = row["What you'll do"].replace("'", "''") if pd.notna(row["What you'll do"]) else ''
        artifact_type = row['Final Artifact Type'].replace("'", "''") if pd.notna(row['Final Artifact Type']) else ''
        artifact_desc = row['Final Artifact Description'].replace("'", "''") if pd.notna(row['Final Artifact Description']) else ''
        mentor_bio = row['Mentor Bio'].replace("'", "''") if pd.notna(row['Mentor Bio']) else ''
        prerequisites = row['Prerequisites'].replace("'", "''") if pd.notna(row['Prerequisites']) else 'None'
        safety_note = row['Safety Note'].replace("'", "''") if pd.notna(row['Safety Note']) else ''
        parent_role = row['Parent Role'].replace("'", "''") if pd.notna(row['Parent Role']) else 'Consent only'
        cost_inr = row['Cost (INR)'] if pd.notna(row['Cost (INR)']) else 0
        cost_note = row['Cost Note'].replace("'", "''") if pd.notna(row['Cost Note']) else ''
        
        # Determine location and mode
        if 'visit' in schedule_note.lower() or 'on-site' in what_do.lower():
            location = 'On-site'
            mode = 'In-person'
        elif 'home' in what_do.lower() or 'online' in what_do.lower():
            location = 'Remote'
            mode = 'Remote'
        else:
            location = 'Hybrid'
            mode = 'Flexible'
        
        # Build SQL
        f.write(f'-- {intern_id}: {title}\n')
        f.write('INSERT INTO public.opportunities (\n')
        f.write('  title, job_title, company_name, department, sector, exposure_type,\n')
        f.write('  total_hours, duration_weeks, duration_days, schedule_note,\n')
        f.write('  what_youll_learn, what_youll_do, final_artifact_type, final_artifact_description,\n')
        f.write('  mentor_bio, requirements, safety_note, parent_role,\n')
        f.write('  cost_inr, cost_note, employment_type, location, mode,\n')
        f.write('  is_active, recruiter_id, status, posted_date\n')
        f.write(') VALUES (\n')
        f.write(f"  '{title}',\n")
        f.write(f"  '{title}',\n")
        f.write(f"  '{sector} Program',\n")
        f.write(f"  '{sector}',\n")
        f.write(f"  '{sector}',\n")
        f.write(f"  '{exposure_type}',\n")
        f.write(f"  {total_hours},\n")
        f.write(f"  {duration_weeks},\n")
        f.write(f"  {duration_days},\n")
        f.write(f"  '{schedule_note}',\n")
        f.write(f"  '{what_learn}',\n")
        f.write(f"  '{what_do}',\n")
        f.write(f"  '{artifact_type}',\n")
        f.write(f"  '{artifact_desc}',\n")
        f.write(f"  '{mentor_bio}',\n")
        f.write(f"  '[\"{prerequisites}\"]'::jsonb,\n")
        f.write(f"  '{safety_note}',\n")
        f.write(f"  '{parent_role}',\n")
        f.write(f"  {cost_inr},\n")
        f.write(f"  " + (f"'{cost_note}'" if cost_note else "NULL") + ",\n")
        f.write(f"  'Internship',\n")
        f.write(f"  '{location}',\n")
        f.write(f"  '{mode}',\n")
        f.write(f"  true,\n")
        f.write(f"  '{recruiter_id}',\n")
        f.write(f"  'published',\n")
        f.write(f"  NOW()\n")
        f.write(');\n\n')

print('SQL file generated: import-all-internships.sql')
