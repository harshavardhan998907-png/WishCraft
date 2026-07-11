-- 030_backfill_external_template_manifest.sql
--
-- External (creator-submitted) templates approved before review-template began
-- persisting config.fields/config.theme have an empty manifest_json ({}), so the
-- editor falls back to standard occasion fields instead of the creator-defined
-- custom fields. Backfill the known affected template here.
--
-- Idempotent: only writes when manifest_json is currently empty/null so a later
-- (correct) approval is never clobbered.

UPDATE templates
SET manifest_json = '{
  "schema": [
    {"id": "recipient_name", "type": "text", "label": "Friend''s Name", "required": true, "placeholder": "e.g. Priya"},
    {"id": "sender_name", "type": "text", "label": "Your Name", "required": true, "placeholder": "e.g. Arjun"},
    {"id": "message", "type": "textarea", "label": "Personal Message", "maxLength": 500},
    {"id": "friendNickname", "type": "text", "label": "Friend''s Nickname", "placeholder": "e.g. Arju"},
    {"id": "startDate", "type": "date", "label": "When did your friendship start?"},
    {"id": "secretMessage", "type": "textarea", "label": "Secret Message", "maxLength": 300},
    {"id": "milestones", "type": "repeater", "label": "Friendship Milestones",
     "subFields": [
       {"id": "date", "type": "text", "label": "Date"},
       {"id": "title", "type": "text", "label": "Title"},
       {"id": "description", "type": "textarea", "label": "Story"}
     ]},
    {"id": "insideJokes", "type": "repeater", "label": "Inside Jokes",
     "subFields": [
       {"id": "emoji", "type": "text", "label": "Emoji"},
       {"id": "title", "type": "text", "label": "Title"},
       {"id": "story", "type": "textarea", "label": "The Story"}
     ]},
    {"id": "photos", "type": "gallery", "label": "Memory Photos", "maxItems": 8},
    {"id": "music", "type": "music", "label": "Add a Song"}
  ]
}'::jsonb
WHERE slug = 'friendship-day-v2'
  AND (manifest_json IS NULL OR manifest_json = '{}'::jsonb);

notify pgrst, 'reload schema';
