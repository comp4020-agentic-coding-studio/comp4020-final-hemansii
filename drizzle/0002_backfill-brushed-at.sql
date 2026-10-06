-- Digs made before the brush mechanic existed were fully revealed on dig
-- alone. Back-fill them as already brushed (by their own digger) so this
-- migration doesn't re-bury content visitors had already seen.
UPDATE digs SET brushed_at = dug_at, brushed_by = visitor_id WHERE brushed_at IS NULL;
