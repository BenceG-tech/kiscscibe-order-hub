# Architecture rules
- Synchronize daily offer menu records in database item triggers, preserving existing IDs and stock; this prevents partial saves and keeps reservation restoration deterministic.
- Use the shared menu composition validator on customer views and admin warnings; exactly one soup and one main prevents arbitrary meal selection.