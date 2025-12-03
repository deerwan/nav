-- Add tags and notes fields to bookmarks table
ALTER TABLE bookmarks ADD COLUMN tags TEXT DEFAULT '';
ALTER TABLE bookmarks ADD COLUMN notes TEXT DEFAULT '';

-- Create index for tags to improve search performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks(tags);
