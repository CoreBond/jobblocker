# Customer-Safe Status Rules

## 1) Purpose
Define what may be shown to a customer in a future shared status page/link.

## 2) Allowed customer-safe fields
- job name
- customer name
- friendly status label
- next action
- last updated timestamp
- basic job location/address only if the app later defines a clearly public field for it

## 3) Never expose
- internal notes
- activity timeline
- permit details or permit numbers
- inspection details, inspector names, failure reasons, or internal scheduling notes
- company_id
- raw job JSON
- internal metadata
- cost fields unless explicitly designed as customer-facing
- employee/internal user names unless explicitly customer-facing

## 4) Future public link rule
- All public/customer status views must use `buildCustomerSafeJobSummary` or another centralized safe mapper.
- Public routes must never return raw database rows.

## 5) KISS rule
Keep customer status simple: where the job stands, what happens next, and when it was updated.
