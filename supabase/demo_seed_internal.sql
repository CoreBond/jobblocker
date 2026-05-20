-- JobBlocker internal demo seed
-- Internal use only. Do not use this script for production data.
-- WARNING: Replace 'REPLACE_WITH_DEMO_COMPANY_ID' before running.
-- This script inserts demo rows into:
--   jobs, permits, inspections, notes, activity_log

WITH inserted_jobs AS (
  INSERT INTO jobs (company_id, name, customer_name, job_type, status, next_action)
  VALUES
    ('REPLACE_WITH_DEMO_COMPANY_ID', 'Miller Bathroom Remodel', 'Dawn Miller', 'Bathroom Remodel', 'needs_attention', 'Schedule reinspection for plumbing rough-in'),
    ('REPLACE_WITH_DEMO_COMPANY_ID', 'Jensen Deck Addition', 'Chris Jensen', 'Deck Addition', 'waiting_approval', 'Follow up on permit approval'),
    ('REPLACE_WITH_DEMO_COMPANY_ID', 'Alvarez Kitchen Remodel', 'Rosa Alvarez', 'Kitchen Remodel', 'inspection_phase', 'Await electrical rough-in inspection'),
    ('REPLACE_WITH_DEMO_COMPANY_ID', 'Thompson Garage Conversion', 'Leah Thompson', 'Garage Conversion', 'ready_to_move', 'Move to drywall and interior finish'),
    ('REPLACE_WITH_DEMO_COMPANY_ID', 'Carter Basement Finish', 'Evan Carter', 'Basement Finish', 'ready_to_close', 'Close job'),
    ('REPLACE_WITH_DEMO_COMPANY_ID', 'Brooks Fence Replacement', 'Nina Brooks', 'Fence Replacement', 'closed', 'Job finished')
  RETURNING id, company_id, name
),
inserted_permits AS (
  INSERT INTO permits (job_id, permit_type, permit_number, status, expiration_date, notes)
  SELECT id, 'Building Permit', 'BP-2026-1101', 'approved', DATE '2026-06-15', 'Main remodel permit approved.'
  FROM inserted_jobs WHERE name = 'Miller Bathroom Remodel'
  UNION ALL
  SELECT id, 'Zoning Permit', 'ZP-2026-2044', 'submitted', NULL, 'Submitted and pending city approval.'
  FROM inserted_jobs WHERE name = 'Jensen Deck Addition'
  UNION ALL
  SELECT id, 'Electrical Permit', 'EL-2026-3310', 'approved', NULL, 'Electrical scope approved.'
  FROM inserted_jobs WHERE name = 'Alvarez Kitchen Remodel'
  UNION ALL
  SELECT id, 'Building Permit', 'BP-2026-1177', 'approved', DATE '2026-08-01', 'Conversion permit approved.'
  FROM inserted_jobs WHERE name = 'Thompson Garage Conversion'
  UNION ALL
  SELECT id, 'Building Permit', 'BP-2026-1290', 'approved', DATE '2026-07-30', 'Basement permit approved.'
  FROM inserted_jobs WHERE name = 'Carter Basement Finish'
  UNION ALL
  SELECT id, 'Fence Permit', 'FP-2026-0902', 'closed', NULL, 'Permit closed after final inspection.'
  FROM inserted_jobs WHERE name = 'Brooks Fence Replacement'
  RETURNING id, job_id
),
inserted_inspections AS (
  INSERT INTO inspections (
    job_id,
    inspection_type,
    status,
    scheduled_date,
    time_window,
    inspector_name,
    result_date,
    correction_notes,
    reinspection_required
  )
  SELECT id, 'Plumbing Rough-In', 'failed', DATE '2026-05-18', '8 AM - 12 PM', 'J. Kim', DATE '2026-05-18', 'Vent relocation required.', true
  FROM inserted_jobs WHERE name = 'Miller Bathroom Remodel'
  UNION ALL
  SELECT id, 'Footing Inspection', 'needed', NULL, NULL, NULL, NULL, NULL, false
  FROM inserted_jobs WHERE name = 'Jensen Deck Addition'
  UNION ALL
  SELECT id, 'Electrical Rough-In', 'scheduled', DATE '2026-05-22', '1 PM - 4 PM', 'M. Ortiz', NULL, NULL, false
  FROM inserted_jobs WHERE name = 'Alvarez Kitchen Remodel'
  UNION ALL
  SELECT id, 'Framing Inspection', 'passed', DATE '2026-05-16', '9 AM - 11 AM', 'L. Nguyen', DATE '2026-05-16', NULL, false
  FROM inserted_jobs WHERE name = 'Thompson Garage Conversion'
  UNION ALL
  SELECT id, 'Final Inspection', 'passed', DATE '2026-05-19', '10 AM - 12 PM', 'R. Patel', DATE '2026-05-19', NULL, false
  FROM inserted_jobs WHERE name = 'Carter Basement Finish'
  UNION ALL
  SELECT id, 'Final Inspection', 'passed', DATE '2026-05-10', '9 AM - 10 AM', 'S. Flores', DATE '2026-05-10', NULL, false
  FROM inserted_jobs WHERE name = 'Brooks Fence Replacement'
  RETURNING id, job_id
),
inserted_notes AS (
  INSERT INTO notes (job_id, note, visibility)
  SELECT id, 'Plumber scheduled correction work for Friday morning.', 'internal'
  FROM inserted_jobs WHERE name = 'Miller Bathroom Remodel'
  UNION ALL
  SELECT id, 'Customer approved revised deck dimensions.', 'internal'
  FROM inserted_jobs WHERE name = 'Jensen Deck Addition'
  UNION ALL
  SELECT id, 'Cabinet install complete; waiting on inspection.', 'internal'
  FROM inserted_jobs WHERE name = 'Alvarez Kitchen Remodel'
  UNION ALL
  SELECT id, 'Insulation crew confirmed for Monday.', 'internal'
  FROM inserted_jobs WHERE name = 'Thompson Garage Conversion'
  UNION ALL
  SELECT id, 'Final walkthrough scheduled with customer this week.', 'internal'
  FROM inserted_jobs WHERE name = 'Carter Basement Finish'
  UNION ALL
  SELECT id, 'Project completed and handed off to customer.', 'internal'
  FROM inserted_jobs WHERE name = 'Brooks Fence Replacement'
  RETURNING id, job_id
)
INSERT INTO activity_log (company_id, job_id, action, entity_type, entity_id, message)
SELECT j.company_id, j.id, 'job_created', 'job', j.id, 'Job created: ' || j.name
FROM inserted_jobs j
UNION ALL
SELECT j.company_id, j.id, 'permit_added', 'permit', p.id, 'Permit added for ' || j.name
FROM inserted_jobs j
JOIN inserted_permits p ON p.job_id = j.id
UNION ALL
SELECT j.company_id, j.id, 'inspection_added', 'inspection', i.id, 'Inspection added for ' || j.name
FROM inserted_jobs j
JOIN inserted_inspections i ON i.job_id = j.id
UNION ALL
SELECT j.company_id, j.id, 'note_added', 'note', n.id, 'Internal note added for ' || j.name
FROM inserted_jobs j
JOIN inserted_notes n ON n.job_id = j.id
UNION ALL
SELECT j.company_id, j.id, 'job_status_changed', 'job', j.id, 'Job status set to needs_attention'
FROM inserted_jobs j
WHERE j.name = 'Miller Bathroom Remodel'
UNION ALL
SELECT j.company_id, j.id, 'inspection_failed', 'inspection', i.id, 'Inspection marked failed: Plumbing Rough-In'
FROM inserted_jobs j
JOIN inserted_inspections i ON i.job_id = j.id
WHERE j.name = 'Miller Bathroom Remodel'
UNION ALL
SELECT j.company_id, j.id, 'job_status_changed', 'job', j.id, 'Job status set to waiting_approval'
FROM inserted_jobs j
WHERE j.name = 'Jensen Deck Addition'
UNION ALL
SELECT j.company_id, j.id, 'job_status_changed', 'job', j.id, 'Job status set to inspection_phase'
FROM inserted_jobs j
WHERE j.name = 'Alvarez Kitchen Remodel'
UNION ALL
SELECT j.company_id, j.id, 'inspection_passed', 'inspection', i.id, 'Inspection marked passed: Framing Inspection'
FROM inserted_jobs j
JOIN inserted_inspections i ON i.job_id = j.id
WHERE j.name = 'Thompson Garage Conversion'
UNION ALL
SELECT j.company_id, j.id, 'job_status_changed', 'job', j.id, 'Job status set to ready_to_move'
FROM inserted_jobs j
WHERE j.name = 'Thompson Garage Conversion'
UNION ALL
SELECT j.company_id, j.id, 'inspection_passed', 'inspection', i.id, 'Inspection marked passed: Final Inspection'
FROM inserted_jobs j
JOIN inserted_inspections i ON i.job_id = j.id
WHERE j.name = 'Carter Basement Finish'
UNION ALL
SELECT j.company_id, j.id, 'job_status_changed', 'job', j.id, 'Job status set to ready_to_close'
FROM inserted_jobs j
WHERE j.name = 'Carter Basement Finish'
UNION ALL
SELECT j.company_id, j.id, 'inspection_passed', 'inspection', i.id, 'Inspection marked passed: Final Inspection'
FROM inserted_jobs j
JOIN inserted_inspections i ON i.job_id = j.id
WHERE j.name = 'Brooks Fence Replacement'
UNION ALL
SELECT j.company_id, j.id, 'job_status_changed', 'job', j.id, 'Job status set to closed'
FROM inserted_jobs j
WHERE j.name = 'Brooks Fence Replacement';
