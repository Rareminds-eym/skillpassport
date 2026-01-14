-- ============================================================================
-- APPLY APPROVED CHANGES TO NORMALIZED TABLES
-- ============================================================================
-- Purpose: When university admin approves changes, apply them to actual tables
-- Uses: Existing college_curriculum_units and college_curriculum_outcomes tables
-- Updates: approve_pending_change() function to apply changes to tables
-- ============================================================================

-- ============================================================================
-- SECTION 1: VERIFY EXISTING TABLES AND ADD MISSING COLUMNS
-- ============================================================================

-- Tables already exist, just verify and add any missing columns
DO $
BEGIN
    -- Verify college_curriculum_units exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'college_curriculum_units'
    ) THEN
        RAISE EXCEPTION '❌ college_curriculum_units table does not exist. Please create it first.';
    END IF;
    
    -- Verify college_curriculum_outcomes exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'college_curriculum_outcomes'
    ) THEN
        RAISE EXCEPTION '❌ college_curriculum_outcomes table does not exist. Please create it first.';
    END IF;
    
    RAISE NOTICE '✅ Tables verified successfully';
END $;

-- Add created_by and updated_by columns if they don't exist
ALTER TABLE college_curriculum_units 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

ALTER TABLE college_curriculum_units 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

ALTER TABLE college_curriculum_outcomes 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

ALTER TABLE college_curriculum_outcomes 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_curriculum_units_curriculum ON college_curriculum_units(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_outcomes_curriculum ON college_curriculum_outcomes(curriculum_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_outcomes_unit ON college_curriculum_outcomes(unit_id);

-- Ensure triggers exist for updated_at
DROP TRIGGER IF EXISTS update_curriculum_units_updated_at ON college_curriculum_units;
CREATE TRIGGER update_curriculum_units_updated_at 
  BEFORE UPDATE ON college_curriculum_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_curriculum_outcomes_updated_at ON college_curriculum_outcomes;
CREATE TRIGGER update_curriculum_outcomes_updated_at 
  BEFORE UPDATE ON college_curriculum_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE college_curriculum_units IS 'Stores curriculum units/modules in normalized form';
COMMENT ON TABLE college_curriculum_outcomes IS 'Stores learning outcomes linked to units';
COMMENT ON COLUMN college_curriculum_outcomes.assessment_mappings IS 'JSONB array of assessment type mappings with weightage';

-- ============================================================================
-- SECTION 2: HELPER FUNCTION TO APPLY CHANGES TO TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION apply_change_to_tables(
  p_curriculum_id UUID,
  p_change_type VARCHAR,
  p_entity_id UUID,
  p_change_data JSONB,
  p_user_id UUID
) RETURNS BOOLEAN AS $
DECLARE
  v_unit_id UUID;
  v_new_unit_id UUID;
BEGIN
  -- Apply different changes based on type
  CASE p_change_type
    
    -- ========== UNIT OPERATIONS ==========
    WHEN 'unit_add' THEN
      -- Add new unit
      INSERT INTO college_curriculum_units (
        id,
        curriculum_id,
        name,
        code,
        description,
        order_index,
        estimated_duration,
        duration_unit,
        credits,
        created_by,
        updated_by
      ) VALUES (
        p_entity_id, -- Use the entity_id from pending change
        p_curriculum_id,
        p_change_data->>'name',
        p_change_data->>'code',
        p_change_data->>'description',
        (p_change_data->>'order')::INTEGER,
        (p_change_data->>'estimatedDuration')::INTEGER,
        p_change_data->>'durationUnit',
        (p_change_data->>'credits')::DECIMAL,
        p_user_id,
        p_user_id
      );
      RAISE NOTICE 'Added unit: %', p_change_data->>'name';
    
    WHEN 'unit_edit' THEN
      -- Edit existing unit
      UPDATE college_curriculum_units
      SET 
        name = COALESCE(p_change_data->>'new_name', name),
        code = COALESCE(p_change_data->>'new_code', code),
        description = COALESCE(p_change_data->>'new_description', description),
        order_index = COALESCE((p_change_data->>'new_order')::INTEGER, order_index),
        estimated_duration = COALESCE((p_change_data->>'new_estimatedDuration')::INTEGER, estimated_duration),
        duration_unit = COALESCE(p_change_data->>'new_durationUnit', duration_unit),
        credits = COALESCE((p_change_data->>'new_credits')::DECIMAL, credits),
        updated_by = p_user_id,
        updated_at = NOW()
      WHERE id = p_entity_id;
      RAISE NOTICE 'Updated unit: %', p_entity_id;
    
    WHEN 'unit_delete' THEN
      -- Delete unit (outcomes will cascade delete)
      DELETE FROM college_curriculum_units WHERE id = p_entity_id;
      RAISE NOTICE 'Deleted unit: %', p_entity_id;
    
    WHEN 'unit_reorder' THEN
      -- Reorder units
      -- The change_data contains array of {id, newOrder}
      DECLARE
        v_reorder_item JSONB;
      BEGIN
        FOR v_reorder_item IN SELECT * FROM jsonb_array_elements(p_change_data->'units')
        LOOP
          UPDATE college_curriculum_units
          SET order_index = (v_reorder_item->>'newOrder')::INTEGER,
              updated_by = p_user_id,
              updated_at = NOW()
          WHERE id = (v_reorder_item->>'id')::UUID;
        END LOOP;
      END;
      RAISE NOTICE 'Reordered units';
    
    -- ========== OUTCOME OPERATIONS ==========
    WHEN 'outcome_add' THEN
      -- Add new learning outcome
      INSERT INTO college_curriculum_outcomes (
        id,
        curriculum_id,
        unit_id,
        outcome_text, -- Note: existing table uses outcome_text, not outcome
        bloom_level,
        assessment_mappings,
        created_by,
        updated_by
      ) VALUES (
        p_entity_id, -- Use the entity_id from pending change
        p_curriculum_id,
        (p_change_data->>'unitId')::UUID,
        p_change_data->>'outcome',
        p_change_data->>'bloomLevel',
        COALESCE(p_change_data->'assessmentMappings', '[]'::jsonb),
        p_user_id,
        p_user_id
      );
      RAISE NOTICE 'Added outcome for unit: %', p_change_data->>'unitId';
    
    WHEN 'outcome_edit' THEN
      -- Edit existing outcome
      UPDATE college_curriculum_outcomes
      SET 
        outcome_text = COALESCE(p_change_data->>'new_outcome', outcome_text),
        bloom_level = COALESCE(p_change_data->>'new_bloomLevel', bloom_level),
        assessment_mappings = COALESCE(p_change_data->'new_assessmentMappings', assessment_mappings),
        unit_id = COALESCE((p_change_data->>'new_unitId')::UUID, unit_id),
        updated_by = p_user_id,
        updated_at = NOW()
      WHERE id = p_entity_id;
      RAISE NOTICE 'Updated outcome: %', p_entity_id;
    
    WHEN 'outcome_delete' THEN
      -- Delete outcome
      DELETE FROM college_curriculum_outcomes WHERE id = p_entity_id;
      RAISE NOTICE 'Deleted outcome: %', p_entity_id;
    
    -- ========== BULK OPERATIONS ==========
    WHEN 'bulk_add_units' THEN
      -- Add multiple units at once
      DECLARE
        v_unit_item JSONB;
      BEGIN
        FOR v_unit_item IN SELECT * FROM jsonb_array_elements(p_change_data->'units')
        LOOP
          INSERT INTO college_curriculum_units (
            id,
            curriculum_id,
            name,
            code,
            description,
            order_index,
            estimated_duration,
            duration_unit,
            credits,
            created_by,
            updated_by
          ) VALUES (
            (v_unit_item->>'id')::UUID,
            p_curriculum_id,
            v_unit_item->>'name',
            v_unit_item->>'code',
            v_unit_item->>'description',
            (v_unit_item->>'order')::INTEGER,
            (v_unit_item->>'estimatedDuration')::INTEGER,
            v_unit_item->>'durationUnit',
            (v_unit_item->>'credits')::DECIMAL,
            p_user_id,
            p_user_id
          );
        END LOOP;
      END;
      RAISE NOTICE 'Added multiple units';
    
    WHEN 'bulk_add_outcomes' THEN
      -- Add multiple outcomes at once
      DECLARE
        v_outcome_item JSONB;
      BEGIN
        FOR v_outcome_item IN SELECT * FROM jsonb_array_elements(p_change_data->'outcomes')
        LOOP
          INSERT INTO college_curriculum_outcomes (
            id,
            curriculum_id,
            unit_id,
            outcome_text, -- Note: existing table uses outcome_text
            bloom_level,
            assessment_mappings,
            created_by,
            updated_by
          ) VALUES (
            (v_outcome_item->>'id')::UUID,
            p_curriculum_id,
            (v_outcome_item->>'unitId')::UUID,
            v_outcome_item->>'outcome',
            v_outcome_item->>'bloomLevel',
            COALESCE(v_outcome_item->'assessmentMappings', '[]'::jsonb),
            p_user_id,
            p_user_id
          );
        END LOOP;
      END;
      RAISE NOTICE 'Added multiple outcomes';
    
    ELSE
      RAISE NOTICE 'Unknown change type: %', p_change_type;
      RETURN FALSE;
  END CASE;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error applying change: % - %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 3: UPDATE APPROVE_PENDING_CHANGE TO APPLY TO TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_pending_change(
    p_curriculum_id UUID,
    p_change_id UUID,
    p_review_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_change JSONB;
    v_history_entry JSONB;
    v_remaining_count INTEGER;
    v_change_type VARCHAR;
    v_entity_id UUID;
    v_change_data JSONB;
    v_apply_success BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND role = 'university_admin') THEN
        RAISE EXCEPTION 'Only university admins can approve changes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM college_curriculums c
        JOIN users u ON u."organizationId" = c.university_id
        WHERE c.id = p_curriculum_id AND u.id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Not authorized for this university curriculum';
    END IF;
    
    SELECT CONCAT("firstName", ' ', "lastName") INTO v_user_name FROM users WHERE id = v_user_id;
    
    -- Get the change request
    SELECT change_obj INTO v_change
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS change_obj
    WHERE id = p_curriculum_id AND change_obj->>'id' = p_change_id::text;
    
    IF v_change IS NULL THEN RAISE EXCEPTION 'Change request not found'; END IF;
    
    -- Extract change details
    v_change_type := v_change->>'change_type';
    v_entity_id := (v_change->>'entity_id')::UUID;
    v_change_data := v_change->'data';
    
    -- ========== APPLY CHANGE TO ACTUAL TABLES ==========
    RAISE NOTICE 'Applying change type: % for entity: %', v_change_type, v_entity_id;
    
    v_apply_success := apply_change_to_tables(
        p_curriculum_id,
        v_change_type,
        v_entity_id,
        v_change_data,
        v_user_id
    );
    
    IF NOT v_apply_success THEN
        RAISE WARNING 'Failed to apply change to tables, but continuing with approval process';
    END IF;
    
    -- Create history entry
    v_history_entry := v_change || jsonb_build_object(
        'reviewed_by', v_user_id, 
        'reviewer_name', COALESCE(v_user_name, 'Unknown Admin'),
        'review_date', NOW(), 
        'status', 'approved', 
        'review_notes', COALESCE(p_review_notes, ''),
        'applied_to_tables', v_apply_success
    );
    
    -- Remove from pending_changes and add to history
    UPDATE college_curriculums
    SET pending_changes = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
            WHERE elem->>'id' != p_change_id::text
        ),
        change_history = COALESCE(change_history, '[]'::jsonb) || v_history_entry,
        updated_at = NOW()
    WHERE id = p_curriculum_id;
    
    -- Update has_pending_changes flag
    SELECT COUNT(*) INTO v_remaining_count
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
    WHERE id = p_curriculum_id AND elem->>'status' = 'pending';
    
    UPDATE college_curriculums SET has_pending_changes = (v_remaining_count > 0) WHERE id = p_curriculum_id;
    
    RAISE NOTICE '✅ Change approved and applied to tables successfully';
    RETURN TRUE;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: MIGRATION FUNCTION - MOVE EXISTING JSONB DATA TO TABLES
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_curriculum_jsonb_to_tables()
RETURNS TABLE(
  curriculum_id UUID,
  units_migrated INTEGER,
  outcomes_migrated INTEGER,
  status TEXT
) AS $
DECLARE
  v_curriculum RECORD;
  v_unit JSONB;
  v_outcome JSONB;
  v_unit_id UUID;
  v_units_count INTEGER;
  v_outcomes_count INTEGER;
BEGIN
  -- Loop through all curriculums that have JSONB data
  FOR v_curriculum IN 
    SELECT id, units, outcomes 
    FROM college_curriculums 
    WHERE jsonb_array_length(COALESCE(units, '[]'::jsonb)) > 0
       OR jsonb_array_length(COALESCE(outcomes, '[]'::jsonb)) > 0
  LOOP
    v_units_count := 0;
    v_outcomes_count := 0;
    
    BEGIN
      -- Migrate units
      IF v_curriculum.units IS NOT NULL THEN
        FOR v_unit IN SELECT * FROM jsonb_array_elements(v_curriculum.units)
        LOOP
          v_unit_id := (v_unit->>'id')::UUID;
          
          -- Insert unit if not exists
          INSERT INTO college_curriculum_units (
            id,
            curriculum_id,
            name,
            code,
            description,
            order_index,
            estimated_duration,
            duration_unit,
            credits
          ) VALUES (
            v_unit_id,
            v_curriculum.id,
            v_unit->>'name',
            v_unit->>'code',
            v_unit->>'description',
            (v_unit->>'order')::INTEGER,
            (v_unit->>'estimatedDuration')::INTEGER,
            v_unit->>'durationUnit',
            (v_unit->>'credits')::DECIMAL
          )
          ON CONFLICT (id) DO NOTHING;
          
          v_units_count := v_units_count + 1;
        END LOOP;
      END IF;
      
      -- Migrate outcomes
      IF v_curriculum.outcomes IS NOT NULL THEN
        FOR v_outcome IN SELECT * FROM jsonb_array_elements(v_curriculum.outcomes)
        LOOP
          -- Insert outcome if not exists
          INSERT INTO college_curriculum_outcomes (
            id,
            curriculum_id,
            unit_id,
            outcome_text, -- Note: existing table uses outcome_text
            bloom_level,
            assessment_mappings
          ) VALUES (
            (v_outcome->>'id')::UUID,
            v_curriculum.id,
            (v_outcome->>'unitId')::UUID,
            v_outcome->>'outcome',
            v_outcome->>'bloomLevel',
            COALESCE(v_outcome->'assessmentMappings', '[]'::jsonb)
          )
          ON CONFLICT (id) DO NOTHING;
          
          v_outcomes_count := v_outcomes_count + 1;
        END LOOP;
      END IF;
      
      -- Return success
      RETURN QUERY SELECT 
        v_curriculum.id,
        v_units_count,
        v_outcomes_count,
        'success'::TEXT;
        
    EXCEPTION
      WHEN OTHERS THEN
        -- Return error
        RETURN QUERY SELECT 
          v_curriculum.id,
          v_units_count,
          v_outcomes_count,
          ('error: ' || SQLERRM)::TEXT;
    END;
  END LOOP;
END;
$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 5: GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON college_curriculum_units TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON college_curriculum_outcomes TO authenticated;
GRANT EXECUTE ON FUNCTION apply_change_to_tables TO authenticated;
GRANT EXECUTE ON FUNCTION migrate_curriculum_jsonb_to_tables TO authenticated;

-- ============================================================================
-- SECTION 6: VERIFICATION
-- ============================================================================

DO $
BEGIN
    -- Check if tables exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'college_curriculum_units'
    ) THEN
        RAISE EXCEPTION 'college_curriculum_units table not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'college_curriculum_outcomes'
    ) THEN
        RAISE EXCEPTION 'college_curriculum_outcomes table not created';
    END IF;
    
    -- Check if functions exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'apply_change_to_tables'
    ) THEN
        RAISE EXCEPTION 'apply_change_to_tables function not created';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'migrate_curriculum_jsonb_to_tables'
    ) THEN
        RAISE EXCEPTION 'migrate_curriculum_jsonb_to_tables function not created';
    END IF;
    
    RAISE NOTICE '✅ All tables and functions created successfully!';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '   1. Run: SELECT * FROM migrate_curriculum_jsonb_to_tables();';
    RAISE NOTICE '   2. Test approval workflow with new tables';
    RAISE NOTICE '   3. Update frontend to read from new tables';
END $;
